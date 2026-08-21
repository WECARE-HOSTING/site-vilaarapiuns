/**
 * Suíte HTTP contra dist/enviar.php, em dryRun.
 *
 * Sobe o servidor embutido do PHP, exercita cada caso do spec, derruba.
 * Nenhuma credencial de SMTP envolvida: em dryRun o endpoint grava o
 * e-mail em arquivo, e é o arquivo que a suíte inspeciona.
 *
 *   npm run form:check      (exige `npm run build` antes)
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORTA = 4399;
const BASE = `http://127.0.0.1:${PORTA}`;
const varDir = mkdtempSync(join(tmpdir(), 'va-'));

// A config real mora ACIMA do webroot. dist/ é o webroot, então: ao lado dele.
// Template explícito, não JSON massageado com regex: config de teste que
// gera PHP inválido faz a suíte inteira falhar por um motivo que não é o
// que ela está medindo.
writeFileSync('va-config.php', `<?php return [
  'smtpHost' => '', 'smtpPort' => 465, 'smtpUser' => '', 'smtpPass' => '',
  'from' => 'site@vilaarapiuns.com.br', 'fromName' => 'Villa Arapiuns',
  'to' => 'reservas@vilaarapiuns.com.br',
  'bcc' => 'carlos@wecarehosting.com.br',
  'dryRun' => true,
  'varDir' => ${JSON.stringify(varDir)},
];`);

const php = spawn('php', ['-S', `127.0.0.1:${PORTA}`, '-t', 'dist'], { stdio: 'ignore' });
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
await dorme(1200);

const VALIDO = { nome: 'Ana Silva', email: 'ana@example.com', whatsapp: '+49 170 1234567',
                 mes: '3', ano: '2027', pessoas: '2', interesse: 'pacote',
                 mensagem: 'Wir möchten im März kommen.', idioma: 'de' };

function enviados() {
  try { return readdirSync(join(varDir, 'enviados')); } catch { return []; }
}
function limpa() {
  try { rmSync(join(varDir, 'enviados'), { recursive: true }); } catch {}
  for (const f of readdirSync(varDir)) if (f.startsWith('rate-')) rmSync(join(varDir, f));
}

async function post(campos, headers = {}) {
  return fetch(`${BASE}/enviar.php`, {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded',
               Origin: 'https://vilaarapiuns.com.br', ...headers },
    body: new URLSearchParams(campos),
  });
}

let falhas = 0;
const ok = (nome, cond, detalhe = '') => {
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${nome}${cond ? '' : ' — ' + detalhe}`);
  if (!cond) falhas++;
};

try {
  // 1. Envio válido, resposta JSON
  limpa();
  let r = await post(VALIDO, { Accept: 'application/json' });
  let j = await r.json();
  ok('envio válido devolve ok', r.status === 200 && j.ok === true, `${r.status} ${JSON.stringify(j)}`);
  const arqs = enviados();
  ok('gravou exatamente um e-mail', arqs.length === 1, `gravou ${arqs.length}`);
  const email = readFileSync(join(varDir, 'enviados', arqs[0]), 'utf8');
  ok('assunto traz nome, pessoas e quando',
     email.includes('[Villa Arapiuns] Ana Silva — 2 pessoas — março/2027'), email.split('\n')[3]);
  ok('avisa o idioma do visitante', email.includes('escreveu em Deutsch'));
  ok('Reply-To é o visitante', email.includes('Reply-To: Ana Silva <ana@example.com>'));
  ok('BCC de segurança presente', email.includes('Bcc: carlos@wecarehosting.com.br'));
  ok('destino é o alias de função, não pessoa', email.includes('To: reservas@vilaarapiuns.com.br'));
  ok('mensagem verbatim, sem tradução', email.includes('Wir möchten im März kommen.'));

  // 2. Sem JS: 303 para a página de enviado no idioma certo
  limpa();
  r = await post({ ...VALIDO, idioma: 'ja' });
  ok('sem JS redireciona 303', r.status === 303, String(r.status));
  ok('303 aponta para o idioma certo',
     r.headers.get('location') === '/ja/book/sent/', String(r.headers.get('location')));

  // 3. Honeypot: responde sucesso e não grava
  limpa();
  r = await post({ ...VALIDO, _hp: 'http://spam.example' }, { Accept: 'application/json' });
  ok('honeypot finge sucesso', (await r.json()).ok === true);
  ok('honeypot não gravou nada', enviados().length === 0);

  // 4. Rápido demais
  limpa();
  r = await post({ ...VALIDO, _t: String(Math.floor(Date.now() / 1000)) }, { Accept: 'application/json' });
  ok('envio instantâneo descartado', enviados().length === 0);

  // 5. Sem _t (sem JS) NÃO é rejeitado
  limpa();
  await post(VALIDO, { Accept: 'application/json' });
  ok('ausência de _t não bloqueia quem está sem JS', enviados().length === 1);

  // 6. Validação
  limpa();
  for (const [nome, patch, campo, codigo] of [
    ['nome vazio',        { nome: '' },                 'nome',     'obrigatorio'],
    ['e-mail inválido',   { email: 'ana@@example' },    'email',    'invalido'],
    ['mensagem gigante',  { mensagem: 'x'.repeat(2001) },'mensagem','longo'],
    ['mês fora da lista', { mes: '13' },                'mes',      'opcao'],
    ['pessoas inventado', { pessoas: '99' },            'pessoas',  'opcao'],
  ]) {
    const rr = await post({ ...VALIDO, ...patch }, { Accept: 'application/json' });
    const jj = await rr.json();
    ok(nome, rr.status === 422 && jj.erros?.[campo] === codigo, JSON.stringify(jj));
  }
  ok('nada inválido foi gravado', enviados().length === 0);

  // 7. Injeção de cabeçalho
  limpa();
  await post({ ...VALIDO, nome: 'Ana\r\nBcc: invasor@example.com' }, { Accept: 'application/json' });
  const inj = readFileSync(join(varDir, 'enviados', enviados()[0]), 'utf8');
  ok('CR/LF removidos do nome', !inj.includes('invasor@example.com'), 'cabeçalho injetado!');

  // 8. Mês flexível dispensa o ano
  limpa();
  r = await post({ ...VALIDO, mes: 'flexivel', ano: '' }, { Accept: 'application/json' });
  ok('mes=flexivel não exige ano', (await r.json()).ok === true);
  ok('grava "ainda flexível"',
     readFileSync(join(varDir, 'enviados', enviados()[0]), 'utf8').includes('ainda flexível'));

  // 9. Origem estranha
  limpa();
  r = await post(VALIDO, { Origin: 'https://evil.example', Accept: 'application/json' });
  ok('origem de fora recusada', r.status === 403, String(r.status));

  // 10. Limite por IP
  limpa();
  for (let i = 0; i < 5; i++) await post({ ...VALIDO, email: `a${i}@example.com` }, { Accept: 'application/json' });
  r = await post(VALIDO, { Accept: 'application/json' });
  ok('6º envio na mesma hora bloqueado', r.status === 429, String(r.status));

  // 11. GET recusado
  r = await fetch(`${BASE}/enviar.php`, { redirect: 'manual' });
  ok('GET devolve 405', r.status === 405, String(r.status));
} finally {
  php.kill();
  rmSync(varDir, { recursive: true, force: true });
  rmSync('va-config.php', { force: true });
}

console.log(falhas ? `\n${falhas} FALHA(S).` : '\nOK — endpoint íntegro.');
process.exit(falhas ? 1 : 0);
