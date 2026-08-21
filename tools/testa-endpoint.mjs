/**
 * Suíte HTTP contra o enviar.php CONSTRUÍDO, em dryRun.
 *
 * Sobe o servidor embutido do PHP, exercita cada caso do spec, derruba.
 * Nenhuma credencial de SMTP envolvida: em dryRun o endpoint grava o
 * e-mail em arquivo, e é o arquivo que a suíte inspeciona.
 *
 *   npm run form:check      (o próprio script roda `npm run build` antes)
 *
 * NADA é escrito dentro do repositório. A versão anterior gravava
 * `va-config.php` na RAIZ do repo e apagava sem perguntar no `finally` — o
 * mesmo caminho que o layout e o .gitignore convidam um desenvolvedor a usar
 * para a config local de verdade, e que duas sessões rodando ao mesmo tempo
 * disputariam. Aqui tudo (docroot, config e varDir) vive numa árvore
 * temporária que é removida inteira no fim.
 */
import { spawn, execFileSync } from 'node:child_process';
import {
  mkdtempSync, mkdirSync, writeFileSync, copyFileSync, cpSync,
  readdirSync, readFileSync, rmSync, existsSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Porta livre pedida ao SO, não um número fixo. Com porta fixa, um `php -S`
// esquecido de outra sessão (ou outra rodada desta suíte) fica com a porta,
// o nosso servidor nem sobe, e a suíte passa a interrogar o servidor ALHEIO
// — falhando com mensagens que não têm nada a ver com o que se está medindo.
const PORTA = await new Promise((resolve, reject) => {
  const s = createServer();
  s.on('error', reject);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});
const BASE = `http://127.0.0.1:${PORTA}`;
// Crachá: um arquivo com um token só nosso, servido pelo docroot temporário.
// É como a suíte confirma que quem atendeu foi o servidor que ela subiu.
const CRACHA = randomBytes(12).toString('hex');

// Árvore temporária:
//   <tmp>/va-config.php   <- o enviar.php procura em __DIR__/../va-config.php
//   <tmp>/site/           <- docroot: cópia dos PHP construídos
//   <tmp>/var/            <- varDir (e-mails de dryRun, contadores, descartes)
const tmp = mkdtempSync(join(tmpdir(), 'va-form-'));
const raiz = join(tmp, 'site');
const varDir = join(tmp, 'var');
mkdirSync(raiz);
mkdirSync(varDir);

// Testa o CONSTRUÍDO, não a fonte: é o arquivo que sobe por FTP.
for (const arquivo of ['enviar.php', 'enviar-mail.php']) {
  const origem = join('dist', arquivo);
  if (!existsSync(origem)) {
    console.error(`Falta ${origem}. Rode \`npm run build\` antes.`);
    rmSync(tmp, { recursive: true, force: true });
    process.exit(1);
  }
  copyFileSync(origem, join(raiz, arquivo));
}
// dist/_i18n/: enviar-mail.php lê a copy da auto-resposta em __DIR__/_i18n/,
// e __DIR__ é o docroot de teste, não o repositório. Sem esta cópia,
// textoAuto() nunca encontra os dicionários e a auto-resposta sai vazia,
// mesmo com o PHP construído correto.
if (!existsSync(join('dist', '_i18n'))) {
  console.error('Falta dist/_i18n/. Rode `npm run build` antes.');
  rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
}
cpSync(join('dist', '_i18n'), join(raiz, '_i18n'), { recursive: true });

// Template explícito, não JSON massageado com regex: config de teste que
// gera PHP inválido faz a suíte inteira falhar por um motivo que não é o
// que ela está medindo.
writeFileSync(join(tmp, 'va-config.php'), `<?php return [
  'smtpHost' => '', 'smtpPort' => 465, 'smtpUser' => '', 'smtpPass' => '',
  'from' => 'site@vilaarapiuns.com.br', 'fromName' => 'Villa Arapiuns',
  'to' => 'reservas@vilaarapiuns.com.br',
  'bcc' => 'carlos@wecarehosting.com.br',
  'dryRun' => true,
  'varDir' => ${JSON.stringify(varDir)},
];`);

writeFileSync(join(raiz, 'cracha.txt'), CRACHA);

const php = spawn('php', ['-S', `127.0.0.1:${PORTA}`, '-t', raiz], { stdio: 'ignore' });
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

// Espera o servidor ATENDER, em vez de dormir um tempo fixo e torcer. Um
// sleep de 1,2 s é longo demais numa máquina rápida e curto demais numa
// máquina carregada — flake dos dois lados. E confere o crachá: atender não
// basta, tem de ser o NOSSO servidor.
async function esperaServidor(limiteMs = 20000) {
  const fim = Date.now() + limiteMs;
  while (Date.now() < fim) {
    try {
      const r = await fetch(`${BASE}/cracha.txt`);
      if (r.ok && (await r.text()) === CRACHA) return true;
    } catch { /* ainda não subiu */ }
    await dorme(50);
  }
  return false;
}

const VALIDO = { nome: 'Ana Silva', email: 'ana@example.com', whatsapp: '+49 170 1234567',
                 mes: '3', ano: '2027', pessoas: '2', interesse: 'pacote',
                 mensagem: 'Wir möchten im März kommen.', idioma: 'de' };

function enviados() {
  try { return readdirSync(join(varDir, 'enviados')); } catch { return []; }
}
// Desde a Tarefa 6 cada envio grava DOIS arquivos (venda + auto-resposta).
// enviados()[0] não tem ordem garantida entre os dois — leEnviado() sempre
// quer o de VENDA, então localiza pelo sufixo, não pela posição.
function leEnviado() {
  const arqVenda = enviados().find((f) => f.endsWith('-gabriela.txt'));
  return readFileSync(join(varDir, 'enviados', arqVenda), 'utf8');
}
function descartes() {
  try { return readFileSync(join(varDir, 'descartes.log'), 'utf8'); } catch { return ''; }
}
function limpa() {
  try { rmSync(join(varDir, 'enviados'), { recursive: true }); } catch {}
  try { rmSync(join(varDir, 'descartes.log')); } catch {}
  for (const f of readdirSync(varDir)) if (f.startsWith('rate-')) rmSync(join(varDir, f));
}

// Origin: null remove o cabeçalho (para o caso "sem Origin e sem Referer").
function cabecalhos(extra = {}) {
  const h = { 'Content-Type': 'application/x-www-form-urlencoded',
              Origin: 'https://vilaarapiuns.com.br', ...extra };
  for (const k of Object.keys(h)) if (h[k] === null) delete h[k];
  return h;
}

async function post(campos, headers = {}) {
  return postBruto(new URLSearchParams(campos).toString(), headers);
}
async function postBruto(corpo, headers = {}) {
  return fetch(`${BASE}/enviar.php`, {
    method: 'POST', redirect: 'manual', headers: cabecalhos(headers), body: corpo,
  });
}

let falhas = 0;
const ok = (nome, cond, detalhe = '') => {
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${nome}${cond ? '' : ' — ' + detalhe}`);
  if (!cond) falhas++;
};

/**
 * Confere a FORMA do bloco de cabeçalho, não a ausência de uma string.
 *
 * A versão anterior deste teste só perguntava se "invasor@example.com" estava
 * fora do arquivo. Bastava reduzir semSintaxeDeCabecalho() a tirar `@` para o
 * arquivo passar a conter `Reply-To: AnaBcc: invasorexample.com <...>` — um
 * `Bcc:` plantado DENTRO de um cabeçalho vivo — e o teste continuava verde,
 * porque a string procurada de fato não estava lá. Um teste que não pode
 * falhar não é teste.
 *
 * Aqui o bloco até a primeira linha em branco tem de ser EXATAMENTE as linhas
 * esperadas: nada a mais, nada fora de ordem, nenhum nome de cabeçalho
 * repetido, e cada linha começando por um cabeçalho que a gente escreveu.
 */
function verificaCabecalho(rotulo, texto, esperadas) {
  const corte = texto.indexOf('\n\n');
  const linhas = (corte === -1 ? texto : texto.slice(0, corte)).split('\n');
  const nomes = linhas.map((l) => l.slice(0, l.indexOf(':')));

  ok(`${rotulo}: toda linha é um cabeçalho conhecido`,
     linhas.every((l) => /^(To|Bcc|Reply-To|Subject): /.test(l)), JSON.stringify(linhas));
  ok(`${rotulo}: nenhum cabeçalho repetido`,
     new Set(nomes).size === nomes.length, nomes.join(', '));
  ok(`${rotulo}: bloco de cabeçalho é exatamente o esperado`,
     linhas.length === esperadas.length && linhas.every((l, i) => l === esperadas[i]),
     JSON.stringify(linhas));
}

const semRuidoPhp = (t) =>
  !/(Warning|Notice|Fatal error|Deprecated|Array to string|headers already sent)/i.test(t);

/**
 * Extrai o corpo de uma função de um texto PHP contando chaves, não com
 * regex de uma linha — chaveDeLimite() tem `if` aninhado, e "até a primeira
 * `}`" cortaria a função na metade.
 */
function extraiFuncao(fonte, nome) {
  const marca = `function ${nome}(`;
  const inicio = fonte.indexOf(marca);
  if (inicio === -1) throw new Error(`função ${nome}() não encontrada no PHP construído`);
  const abre = fonte.indexOf('{', inicio);
  let profundidade = 0;
  let fim = abre;
  for (; fim < fonte.length; fim++) {
    if (fonte[fim] === '{') profundidade++;
    else if (fonte[fim] === '}') { profundidade--; if (profundidade === 0) { fim++; break; } }
  }
  return fonte.slice(inicio, fim);
}

/**
 * chaveDeLimite() chamada fora do HTTP, direto num `php -r` isolado.
 *
 * O servidor embutido do PHP não deixa a suíte escolher REMOTE_ADDR — ele
 * vem da conexão TCP, sempre 127.0.0.1 local — então testar IPs diferentes
 * por requisição HTTP é impossível. Extrai a função pura do PHP CONSTRUÍDO
 * (mesmo princípio do resto da suíte: testar o que sobe por FTP) e roda.
 */
function testaChaveDeLimite() {
  const fonte = readFileSync(join(raiz, 'enviar.php'), 'utf8');
  const fn = extraiFuncao(fonte, 'chaveDeLimite');
  const casos = ['::ffff:203.0.113.7', '::ffff:198.51.100.9', '203.0.113.7', '2001:db8::1234', '::1'];
  const script = `${fn}\n$c = ${JSON.stringify(casos)};\n`
    + `echo json_encode(array_combine($c, array_map('chaveDeLimite', $c)));`;
  return JSON.parse(execFileSync('php', ['-r', script], { encoding: 'utf8' }));
}

try {
  // 0. chaveDeLimite(): a regressão original mapeava TODO endereço
  //    IPv4-mapped (::ffff:a.b.c.d) — a forma que um Apache dual-stack
  //    apresenta cliente IPv4 — e também ::1 (loopback) para o MESMO balde
  //    "0000000000000000::/64", porque `strlen(inet_pton($ip)) === 16` mede
  //    a família da STRING, não a família real do cliente. Nesse cenário
  //    todo visitante IPv4 do planeta compartilha uma cota de 5/hora.
  const baldes = testaChaveDeLimite();
  ok('IPv4-mapped: dois endereços diferentes caem em baldes diferentes',
     baldes['::ffff:203.0.113.7'] !== baldes['::ffff:198.51.100.9'], JSON.stringify(baldes));
  ok('IPv4-mapped desembrulha para o mesmo balde do IPv4 puro equivalente',
     baldes['::ffff:203.0.113.7'] === baldes['203.0.113.7'], JSON.stringify(baldes));
  ok('IPv4 puro: o balde é o próprio endereço',
     baldes['203.0.113.7'] === '203.0.113.7', baldes['203.0.113.7']);
  ok('IPv6 de verdade: o balde é o /64, não o endereço inteiro',
     baldes['2001:db8::1234'] !== '2001:db8::1234' && baldes['2001:db8::1234'].endsWith('::/64'),
     baldes['2001:db8::1234']);
  ok('loopback não cai no mesmo balde de um IPv4-mapped',
     baldes['::1'] !== baldes['::ffff:203.0.113.7'], JSON.stringify(baldes));

  if (!(await esperaServidor())) {
    console.error(`Servidor PHP da suíte não atendeu em ${BASE} (porta ocupada?).`);
    falhas++;
    throw new Error('servidor não subiu');
  }

  // 1. Envio válido, resposta JSON
  limpa();
  let r = await post(VALIDO, { Accept: 'application/json' });
  let j = await r.json();
  ok('envio válido devolve ok', r.status === 200 && j.ok === true, `${r.status} ${JSON.stringify(j)}`);
  // erros muda de TIPO entre sucesso ([]) e falha ({...}) se ninguém forçar.
  // O JS do formulário lê erros[campo]; um array vazio ali é armadilha.
  ok('erros é objeto também no sucesso', j.erros && !Array.isArray(j.erros), JSON.stringify(j.erros));
  const arqs = enviados();
  ok('gravou os dois e-mails', arqs.length === 2, `gravou ${arqs.length}: ${arqs.join()}`);
  const arqVenda = arqs.find((f) => f.endsWith('-gabriela.txt'));
  ok('gravou o e-mail de venda', Boolean(arqVenda), arqs.join());
  const email = readFileSync(join(varDir, 'enviados', arqVenda), 'utf8');
  ok('assunto traz nome, pessoas e quando',
     email.includes('[Villa Arapiuns] Ana Silva — 2 pessoas — março/2027'), email.split('\n')[3]);
  ok('avisa o idioma do visitante', email.includes('escreveu em Deutsch'));
  ok('mensagem verbatim, sem tradução', email.includes('Wir möchten im März kommen.'));
  verificaCabecalho('envio válido', email, [
    'To: reservas@vilaarapiuns.com.br',
    'Bcc: carlos@wecarehosting.com.br',
    'Reply-To: Ana Silva <ana@example.com>',
    'Subject: [Villa Arapiuns] Ana Silva — 2 pessoas — março/2027',
  ]);

  // 1b. Auto-resposta
  const auto = enviados().find((f) => f.endsWith('-autoresposta.txt'));
  ok('gravou a auto-resposta', Boolean(auto), enviados().join());
  const ar = readFileSync(join(varDir, 'enviados', auto), 'utf8');
  ok('auto-resposta vai para o visitante', ar.includes('To: ana@example.com'));

  /**
   * Prova a PROPRIEDADE (nenhum dado do visitante ecoado), não uma
   * instância dela. A versão anterior só perguntava se `mensagem` estava
   * fora do corpo — um mutante que passasse a ecoar `whatsapp`,
   * `interesse` ou `mes`/`ano` (todos presentes em VALIDO, nenhum deles
   * conferido aqui) passava pelas 77 asserções desta suíte inteira, porque
   * nenhuma delas perguntava pela FORMA do corpo, só por uma substring.
   * Não ecoar dado do visitante é o ponto inteiro do desenho da
   * auto-resposta: um formulário que manda conteúdo controlado pelo
   * visitante para um endereço controlado pelo visitante é máquina de
   * spam com o domínio deste negócio na assinatura.
   *
   * Lê o dicionário de ORIGEM (o mesmo `src/i18n/de.json` que
   * tools/copia-dicionarios.mjs copia para dist/_i18n/, e que
   * enviar-mail.php lê em produção), aplica as MESMAS duas trocas que o
   * PHP aplica ({nome} e {whatsapp}) e exige IGUALDADE com o corpo
   * recebido — não uma substring. Igualdade prova a ausência de TUDO de
   * uma vez (mensagem, whatsapp, interesse, mes, ano, ou qualquer campo
   * futuro) e ainda fixa o dicionário como fonte única deste texto: se
   * dicionário e PHP divergirem por qualquer motivo, é este teste que
   * acusa primeiro.
   */
  const dicDe = JSON.parse(readFileSync('src/i18n/de.json', 'utf8'));
  const corpoEsperado = dicDe.autoresp.corpo
    .replaceAll('{nome}', VALIDO.nome)
    .replaceAll('{whatsapp}', 'https://wa.me/5547992067078');
  const corpoRecebido = ar.slice(ar.indexOf('\n\n') + 2);
  ok('auto-resposta é EXATAMENTE o corpo do dicionário com as trocas — prova ausência de qualquer eco',
     corpoRecebido === corpoEsperado,
     JSON.stringify({ esperado: corpoEsperado, recebido: corpoRecebido }));

  // 2. Sem JS: 303 para a página de enviado — a TABELA inteira, não uma linha.
  //    A tabela de rotas é justamente o que esta suíte existe para vigiar.
  for (const [idioma, destino] of [
    ['pt', '/pt/reservar/enviado/'],
    ['en', '/en/book/sent/'],
    ['es', '/es/reservar/enviado/'],
    ['de', '/de/buchen/gesendet/'],
    ['ja', '/ja/book/sent/'],
  ]) {
    limpa();
    r = await post({ ...VALIDO, idioma });
    ok(`sem JS redireciona 303 (${idioma})`, r.status === 303, String(r.status));
    ok(`303 aponta para ${destino}`,
       r.headers.get('location') === destino, String(r.headers.get('location')));
  }

  // 3. Honeypot: responde sucesso, não grava, mas DEIXA RASTRO
  limpa();
  r = await post({ ...VALIDO, _hp: 'http://spam.example' }, { Accept: 'application/json' });
  ok('honeypot finge sucesso', r.status === 200 && (await r.json()).ok === true);
  ok('honeypot não gravou nada', enviados().length === 0);
  ok('honeypot registrou o descarte', descartes().includes('honeypot'), JSON.stringify(descartes()));

  // 4. Rápido demais: também finge sucesso (dizer 403/422 ensinaria o bot
  //    exatamente o que o comentário do endpoint manda não ensinar) e também
  //    deixa rastro.
  limpa();
  r = await post({ ...VALIDO, _t: String(Math.floor(Date.now() / 1000)) }, { Accept: 'application/json' });
  ok('envio instantâneo finge sucesso', r.status === 200 && (await r.json()).ok === true, String(r.status));
  ok('envio instantâneo descartado', enviados().length === 0);
  ok('tempo mínimo registrou o descarte', descartes().includes('tempo-minimo'), JSON.stringify(descartes()));

  // 5. Sem _t (sem JS) NÃO é rejeitado
  limpa();
  await post(VALIDO, { Accept: 'application/json' });
  // Desde a Tarefa 6, envio aceito grava DOIS arquivos (venda + auto-resposta).
  ok('ausência de _t não bloqueia quem está sem JS', enviados().length === 2, `gravou ${enviados().length}`);

  // 5b. _t no FUTURO é relógio de aparelho adiantado, não bot. Descartar
  //     nesse caso perderia todo pedido de quem está com o relógio errado,
  //     mostrando a confirmação. Sem timestamp usável = aceita.
  limpa();
  r = await post({ ...VALIDO, _t: String(Math.floor(Date.now() / 1000) + 600) },
                 { Accept: 'application/json' });
  ok('_t no futuro é aceito', r.status === 200 && (await r.json()).ok === true, String(r.status));
  ok('_t no futuro grava os dois e-mails', enviados().length === 2, `gravou ${enviados().length}`);

  // 6. Validação
  limpa();
  for (const [nome, patch, campo, codigo] of [
    ['nome vazio',            { nome: '' },                  'nome',     'obrigatorio'],
    ['e-mail inválido',       { email: 'ana@@example' },     'email',    'invalido'],
    ['mensagem gigante',      { mensagem: 'x'.repeat(2001) },'mensagem', 'longo'],
    ['mês fora da lista',     { mes: '13' },                 'mes',      'opcao'],
    ['pessoas inventado',     { pessoas: '99' },             'pessoas',  'opcao'],
    // Preenchido e malformado não é "obrigatório": dizer "campo obrigatório"
    // sobre um campo preenchido não diz a ninguém o que corrigir.
    ['ano fora da faixa',     { ano: '1999' },               'ano',      'invalido'],
    ['ano não numérico',      { ano: 'abcd' },               'ano',      'invalido'],
    ['ano ausente com mês',   { ano: '' },                   'ano',      'obrigatorio'],
  ]) {
    const rr = await post({ ...VALIDO, ...patch }, { Accept: 'application/json' });
    const jj = await rr.json();
    ok(nome, rr.status === 422 && jj.erros?.[campo] === codigo, JSON.stringify(jj));
  }
  // Sem limpa() dentro do laço de propósito: o contador só é incrementado
  // DEPOIS da validação, então pedido inválido não consome cota, e a linha
  // abaixo só significa algo se nada tiver sido apagado no meio.
  ok('nada inválido foi gravado', enviados().length === 0);

  // 6b. E-mail com local part entre aspas: FILTER_VALIDATE_EMAIL aceita (é
  //     RFC), e ele vai parar dentro de `Reply-To: Nome <...>`. Cliente que
  //     não honra aspas dentro de angle-addr — leitura leniente é a regra —
  //     lê invasor@evil.com como um segundo endereço entregável, e a resposta
  //     da equipe com os dados do hóspede sai para o invasor.
  for (const veneno of [
    '"a>,invasor@evil.com,b<c"@example.com',
    '"invasor@evil.com"@example.com',
    '"a;b:c"@example.com',
  ]) {
    limpa();
    const rr = await post({ ...VALIDO, email: veneno }, { Accept: 'application/json' });
    const jj = await rr.json();
    ok(`e-mail com sintaxe de cabeçalho recusado: ${veneno}`,
       rr.status === 422 && jj.erros?.email === 'invalido', `${rr.status} ${JSON.stringify(jj)}`);
    ok('e-mail envenenado não gravou nada', enviados().length === 0);
  }
  limpa();
  r = await post({ ...VALIDO, email: 'jose.silva+tag@sub.example.co.uk' }, { Accept: 'application/json' });
  ok('e-mail real com + e subdomínio continua passando',
     r.status === 200 && (await r.json()).ok === true, String(r.status));

  // 7. Injeção de cabeçalho — o bloco inteiro, não a ausência de uma string.
  limpa();
  await post({ ...VALIDO, nome: 'Ana\r\nBcc: invasor@example.com' }, { Accept: 'application/json' });
  verificaCabecalho('injeção com @', leEnviado(), [
    'To: reservas@vilaarapiuns.com.br',
    'Bcc: carlos@wecarehosting.com.br',
    'Reply-To: AnaBcc invasorexample.com <ana@example.com>',
    'Subject: [Villa Arapiuns] AnaBcc invasorexample.com — 2 pessoas — março/2027',
  ]);

  // 7b. Mesma injeção SEM nenhum `@`: o caso anterior era o único, e ele só
  //     pegava ataque com arroba. Um Subject plantado não precisa de arroba
  //     nenhuma para estragar o cabeçalho.
  limpa();
  await post({ ...VALIDO, nome: 'Ana\r\nSubject: promocao imperdivel' }, { Accept: 'application/json' });
  verificaCabecalho('injeção sem @', leEnviado(), [
    'To: reservas@vilaarapiuns.com.br',
    'Bcc: carlos@wecarehosting.com.br',
    'Reply-To: AnaSubject promocao imperdivel <ana@example.com>',
    'Subject: [Villa Arapiuns] AnaSubject promocao imperdivel — 2 pessoas — março/2027',
  ]);

  // 8. Mês flexível dispensa o ano
  limpa();
  r = await post({ ...VALIDO, mes: 'flexivel', ano: '' }, { Accept: 'application/json' });
  ok('mes=flexivel não exige ano', (await r.json()).ok === true);
  ok('grava "ainda flexível"', leEnviado().includes('ainda flexível'));

  // 9. Origem — o ponto é o SUFIXO. Um `str_contains($origem, $DOMINIO)`
  //    recusaria evil.example do mesmo jeito, então testar só evil.example
  //    deixava a regressão passar inteira.
  for (const [rotulo, origem] of [
    ['origem de fora recusada',            'https://evil.example'],
    ['sufixo do nosso domínio recusado',   'https://vilaarapiuns.com.br.evil.example'],
    ['prefixo colado no nome recusado',    'https://evil-vilaarapiuns.com.br'],
  ]) {
    limpa();
    r = await post(VALIDO, { Origin: origem, Accept: 'application/json' });
    ok(rotulo, r.status === 403, `${origem} -> ${r.status}`);
  }
  // Sem Origin e sem Referer não há origem para conferir: não passa.
  limpa();
  r = await post(VALIDO, { Origin: null, Accept: 'application/json' });
  ok('sem Origin e sem Referer recusado', r.status === 403, String(r.status));
  // O subdomínio legítimo continua entrando.
  limpa();
  r = await post(VALIDO, { Origin: 'https://www.vilaarapiuns.com.br', Accept: 'application/json' });
  ok('subdomínio nosso aceito', r.status === 200, String(r.status));

  // 9b. Campo em array (`nome[]=x`). O cast direto emitiria "Array to string
  //     conversion" ANTES de qualquer cabeçalho: Location morto em "headers
  //     already sent" e caminho de servidor na tela do visitante.
  limpa();
  const arr = new URLSearchParams(VALIDO);
  arr.delete('nome');
  arr.append('nome[]', 'x');
  arr.append('nome[]', 'y');
  r = await postBruto(arr.toString(), { Accept: 'application/json' });
  let texto = await r.text();
  ok('nome em array não vira aviso do PHP', semRuidoPhp(texto), texto.slice(0, 200));
  ok('nome em array responde 422 obrigatorio',
     r.status === 422 && JSON.parse(texto).erros?.nome === 'obrigatorio', `${r.status} ${texto.slice(0, 200)}`);

  limpa();
  const arr2 = new URLSearchParams(VALIDO);
  arr2.delete('mensagem');
  arr2.append('mensagem[]', 'x');
  r = await postBruto(arr2.toString(), { Accept: 'application/json' });
  texto = await r.text();
  ok('mensagem em array não vira aviso do PHP', semRuidoPhp(texto), texto.slice(0, 200));
  ok('mensagem em array responde limpo',
     r.status === 200 && JSON.parse(texto).ok === true, `${r.status} ${texto.slice(0, 200)}`);
  // (string)['x'] vira o literal "Array" — 5 caracteres, passa reto pelo
  // único limite de tamanho de `mensagem` sem disparar erro nenhum. Sem
  // conferir o CORPO gravado, esta regressão passa despercebida onde
  // display_errors=0 (padrão de produção fora desta máquina): a resposta
  // sai limpa e "Array" foi para dentro do e-mail no lugar do texto do
  // visitante, e a suíte nunca saberia.
  ok('mensagem em array não grava "Array" no corpo, cai em vazio',
     leEnviado().includes('(não escreveu nada)'), leEnviado().slice(0, 400));

  // 10. Limite por IP
  limpa();
  for (let i = 0; i < 5; i++) await post({ ...VALIDO, email: `a${i}@example.com` }, { Accept: 'application/json' });
  r = await post(VALIDO, { Accept: 'application/json' });
  ok('6º envio na mesma hora bloqueado', r.status === 429, String(r.status));

  // 11. GET recusado
  r = await fetch(`${BASE}/enviar.php`, { redirect: 'manual' });
  ok('GET devolve 405', r.status === 405, String(r.status));
} catch (e) {
  // Qualquer estouro no meio da suíte vira FALHA contada, não stack trace com
  // o resumo comido: a saída tem de continuar dizendo quantos casos passaram.
  console.log(` FALHA suíte interrompida — ${e && e.message ? e.message : e}`);
  falhas++;
} finally {
  php.kill();
  rmSync(tmp, { recursive: true, force: true });
}

console.log(falhas ? `\n${falhas} FALHA(S).` : '\nOK — endpoint íntegro.');
process.exit(falhas ? 1 : 0);
