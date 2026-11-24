import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  MSG_CODIGO_ENCERRADO,
  MSG_CODIGO_INVALIDO,
  MSG_CODIGO_OK,
  MSG_CODIGO_VAZIO,
  MSG_PIX,
  MSG_PIX_PROMO,
  REVEILLON,
  TEXTO_CARTAO,
  TEXTO_PIX,
  TEXTO_PIX_PROMO,
  TEXTO_PROMESSA,
  TEXTO_REFEICOES,
  avaliarCodigo,
  cotar,
  horaDaOrigem,
  instanteEfetivo,
  linkPagamento,
  precoComDesconto,
  promocaoAberta,
  valorLink,
} from '../src/data/reveillon-tabela.ts';

const FIM = Date.parse(REVEILLON.fim);
const ANTES = Date.parse('2026-11-28T12:00:00-03:00');
const DEPOIS = Date.parse('2026-11-29T00:00:00-03:00');

function cotarRev({ single = 0, duplo = 0, triplo = 0, cri03 = 0, cri412 = 0, desconto = false } = {}) {
  const qtd = [single, duplo, triplo];
  return cotar({
    linhas: REVEILLON.ocupacoes.map((o, i) => ({ pessoas: o.pessoas, precoPessoa: o.precoPessoa, qtd: qtd[i] })),
    cri03,
    cri412,
    noites: REVEILLON.noites,
    porNoite: false,
    descontoPct: desconto ? REVEILLON.descontoPct : 0,
    sinalPct: REVEILLON.sinalPct,
    totalBangalos: REVEILLON.totalBangalos,
    maxHospedes: REVEILLON.maxHospedes,
  });
}

test('tabela própria: 5 noites, por pessoa, check-in 28/12, preços cheios', () => {
  assert.equal(REVEILLON.checkIn, '2026-12-28');
  assert.equal(REVEILLON.noites, 5);
  assert.deepEqual(REVEILLON.ocupacoes.map((o) => [o.nome, o.pessoas, o.precoPessoa]), [
    ['Single', 1, 9000],
    ['Duplo', 2, 6000],
    ['Triplo', 3, 5000],
  ]);
  assert.equal(REVEILLON.tag, 'wecarehosting');
  assert.equal(REVEILLON.descontoPct, 15);
  assert.equal(REVEILLON.sinalPct, 30);
});

test('15% em cima do preço cheio, sem uma segunda tabela', () => {
  assert.equal(precoComDesconto(9000, 15), 7650);
  assert.equal(precoComDesconto(6000, 15), 5100);
  assert.equal(precoComDesconto(5000, 15), 4250);
  assert.equal(precoComDesconto(9000, 0), 9000);
});

test('sem código: duplo padrão, sinal de 30% e os três bangalôs', () => {
  const duplo = cotarRev({ duplo: 1 });
  assert.equal(duplo.total, 12000);
  assert.equal(duplo.sinal, 3600);
  assert.equal(duplo.pessoas, 2);
  assert.equal(cotarRev({ single: 1 }).total, 9000);
  assert.equal(cotarRev({ single: 1 }).sinal, 2700);
  assert.equal(cotarRev({ triplo: 1 }).total, 15000);
  assert.equal(cotarRev({ triplo: 1 }).sinal, 4500);
  const tres = cotarRev({ single: 1, duplo: 1, triplo: 1 });
  assert.equal(tres.total, 9000 + 12000 + 15000);
  assert.equal(tres.sinal, 10800);
});

test('com REVEILLON15: single 7650, duplo 5100, triplo 4250, sinal recalculado', () => {
  assert.equal(cotarRev({ single: 1, desconto: true }).total, 7650);
  assert.equal(cotarRev({ single: 1, desconto: true }).sinal, 2295);
  const duplo = cotarRev({ duplo: 1, desconto: true });
  assert.equal(duplo.total, 10200);
  assert.equal(duplo.sinal, 3060);
  assert.equal(cotarRev({ triplo: 1, desconto: true }).total, 12750);
  assert.equal(cotarRev({ triplo: 1, desconto: true }).sinal, 3825);
});

test('crianças: 0–3 grátis; 4–12 pagam 50% do adulto, já com desconto', () => {
  const semCrianca = cotarRev({ duplo: 1, cri03: 2 });
  assert.equal(semCrianca.total, 12000);
  assert.equal(semCrianca.pessoas, 4);

  const meiaCheia = cotarRev({ duplo: 1, cri412: 1 });
  assert.equal(meiaCheia.total, 12000 + 3000);
  assert.equal(meiaCheia.sinal, 4500);

  const meiaComCodigo = cotarRev({ duplo: 1, cri412: 1, desconto: true });
  assert.equal(meiaComCodigo.total, 10200 + 2550);
  assert.equal(meiaComCodigo.sinal, 3825);

  const mistura = cotarRev({ single: 1, triplo: 1, cri412: 1, desconto: true });
  assert.equal(mistura.total, 7650 + 12750 + 2125);
});

test('o Pix de 20% não entra na conta e nenhum segundo desconto acumula', () => {
  const com = cotarRev({ single: 1, desconto: true });
  assert.equal(com.total, 7650);
  assert.notEqual(com.total, Math.round(7650 * 0.8));
  assert.equal(cotarRev({ duplo: 1, desconto: true }).total, 10200);
});

test('código: maiúsculas, espaços, inválido e vazio', () => {
  assert.equal(avaliarCodigo('REVEILLON15', ANTES), 'aplicado');
  assert.equal(avaliarCodigo('reveillon15', ANTES), 'aplicado');
  assert.equal(avaliarCodigo('  Reveillon 15 ', ANTES), 'aplicado');
  assert.equal(avaliarCodigo('FOO', ANTES), 'invalido');
  assert.equal(avaliarCodigo('REVEILLON10', ANTES), 'invalido');
  assert.equal(avaliarCodigo('   ', ANTES), 'vazio');
  assert.equal(MSG_CODIGO_INVALIDO, 'Código inválido. O preço continua o cheio.');
  assert.equal(MSG_CODIGO_VAZIO, 'Digite o código.');
  assert.equal(MSG_CODIGO_OK, 'REVEILLON15 aplicado. 15% de desconto.');
});

test('validade: 28/11/2026 23:59:59 BRT vale; o segundo seguinte encerra', () => {
  assert.equal(promocaoAberta(Date.parse('2026-11-28T23:59:58-03:00')), true);
  assert.equal(promocaoAberta(FIM), true);
  assert.equal(promocaoAberta(FIM + 999), true);
  assert.equal(promocaoAberta(FIM + 1000), false);
  assert.equal(promocaoAberta(DEPOIS), false);
  assert.equal(avaliarCodigo('REVEILLON15', FIM), 'aplicado');
  assert.equal(avaliarCodigo('REVEILLON15', DEPOIS), 'encerrado');
  assert.equal(avaliarCodigo('nao-existe', DEPOIS), 'encerrado');
  assert.equal(MSG_CODIGO_ENCERRADO, 'Código encerrado.');
  const depois = cotarRev({ duplo: 1, desconto: false });
  assert.equal(depois.total, 12000);
});

test('link da InfinitePay: vírgula e dois decimais, valor já com desconto', () => {
  assert.equal(valorLink(1234.56), '1234,56');
  assert.equal(valorLink(3600), '3600,00');
  assert.equal(valorLink(10.2), '10,20');
  const sem = cotarRev({ duplo: 1 });
  const com = cotarRev({ duplo: 1, desconto: true });
  assert.equal(linkPagamento('wecarehosting', sem.sinal), 'https://pay.infinitepay.io/wecarehosting/3600,00');
  assert.equal(linkPagamento(REVEILLON.tag, com.sinal), 'https://pay.infinitepay.io/wecarehosting/3060,00');
  assert.equal(linkPagamento(REVEILLON.tag, com.total), 'https://pay.infinitepay.io/wecarehosting/10200,00');
  assert.equal(linkPagamento(REVEILLON.tag, cotarRev({ single: 1, cri412: 1, desconto: true }).sinal), 'https://pay.infinitepay.io/wecarehosting/3442,50');
});

test('Detox continua por noite e sem desconto: a conta antiga não muda', () => {
  const cot = cotar({
    linhas: [
      { pessoas: 1, precoPessoa: 1800, qtd: 0 },
      { pessoas: 2, precoPessoa: 1200, qtd: 1 },
      { pessoas: 3, precoPessoa: 1000, qtd: 0 },
    ],
    cri03: 0,
    cri412: 1,
    noites: 2,
    porNoite: true,
    descontoPct: 0,
    sinalPct: 30,
    totalBangalos: 13,
    maxHospedes: 26,
  });
  assert.equal(cot.total, 6000);
  assert.equal(cot.sinal, 1800);
  assert.equal(cot.pessoas, 3);
});

test('hora do servidor vem do header Date, sem cache; se falhar, vale o relógio local', async () => {
  let init;
  const ms = await horaDaOrigem('https://villaarapiuns.com.br', async (url, opts) => {
    init = opts;
    assert.equal(url, 'https://villaarapiuns.com.br');
    return new Response(null, { headers: { Date: 'Sat, 28 Nov 2026 15:00:00 GMT' } });
  });
  assert.equal(init.method, 'HEAD');
  assert.equal(init.cache, 'no-store');
  assert.equal(ms, Date.parse('Sat, 28 Nov 2026 15:00:00 GMT'));

  assert.equal(await horaDaOrigem('https://villaarapiuns.com.br', async () => { throw new Error('rede'); }), null);
  assert.equal(await horaDaOrigem('https://villaarapiuns.com.br', async () => new Response(null, { headers: {} })), null);
  assert.equal(await horaDaOrigem('https://villaarapiuns.com.br', async () => new Response(null, { headers: { Date: 'nao-e-data' } })), null);
  assert.equal(await horaDaOrigem('https://villaarapiuns.com.br', (_url, opts) => new Promise((_resolve, reject) => {
    opts?.signal?.addEventListener('abort', () => reject(new Error('abort')));
  }), 30), null);

  assert.equal(instanteEfetivo(1_700_000_000_000, 1), 1_700_000_000_000);
  assert.equal(instanteEfetivo(null, 42), 42);
});

test('textos da página e um código só', () => {
  assert.equal(TEXTO_PROMESSA, '5 noites de rio, floresta e silêncio para começar o ano.');
  assert.equal(TEXTO_CARTAO, 'Cartão de crédito em até 12x, pela InfinitePay.');
  assert.equal(TEXTO_REFEICOES, 'Café da manhã, almoço e jantar incluídos.');
  assert.equal(TEXTO_PIX, 'Pix: fale no WhatsApp');
  assert.equal(TEXTO_PIX_PROMO, 'No Pix, 20%: fale no WhatsApp');
  assert.match(MSG_PIX_PROMO, /Réveillon 28\/12 a 2\/1/);
  assert.match(MSG_PIX_PROMO, /REVEILLON15/);
  assert.doesNotMatch(MSG_PIX, /REVEILLON15/);
  assert.doesNotMatch(MSG_PIX, /20%/);
  const proibidos = [/sem juros/i, /sem acréscimo/i, /sem acrescimo/i, /juros/i];
  const textos = [TEXTO_PROMESSA, TEXTO_CARTAO, TEXTO_REFEICOES, TEXTO_PIX, TEXTO_PIX_PROMO, MSG_PIX, MSG_PIX_PROMO, MSG_CODIGO_OK, MSG_CODIGO_INVALIDO, MSG_CODIGO_ENCERRADO];
  for (const texto of textos) for (const regra of proibidos) assert.doesNotMatch(texto, regra);
});

test('a página do Réveillon lê a tabela e não grava o preço com desconto', () => {
  const pagina = readFileSync('src/pages/pt/lp/pagar-reveillon.astro', 'utf8');
  const tabela = readFileSync('src/data/reveillon-tabela.ts', 'utf8');
  const checkout = readFileSync('src/components/CheckoutRapido.astro', 'utf8');
  assert.match(pagina, /REVEILLON\.ocupacoes/);
  assert.match(pagina, /tag=\{REVEILLON\.tag\}/);
  assert.match(pagina, /promocao/);
  assert.doesNotMatch(pagina, /9000|6000|5000|7650|5100|4250/);
  assert.match(tabela, /precoPessoa: 9000/);
  assert.match(tabela, /precoPessoa: 6000/);
  assert.match(tabela, /precoPessoa: 5000/);
  assert.doesNotMatch(tabela, /7650|5100|4250/);
  assert.doesNotMatch(checkout, /7650|5100|4250/);
  assert.match(checkout, /tag \?\? 'carlospecucci'/);
  assert.match(checkout, /Todas as refeições incluídas/);
  assert.doesNotMatch(readFileSync('src/pages/pt/lp/pagar-detox.astro', 'utf8'), /promocao|wecarehosting/);
});

test('bypass de data só existe no módulo de dev', () => {
  const dev = readFileSync('src/scripts/reveillon-simula-dev.ts', 'utf8');
  assert.match(dev, /va_simula/);
  const visitar = (dir) => {
    for (const nome of readdirSync(dir)) {
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) {
        if (nome === 'node_modules' || nome === 'dist') continue;
        visitar(caminho);
        continue;
      }
      if (!/\.(astro|ts|mjs|js)$/.test(nome)) continue;
      if (caminho.endsWith('src/scripts/reveillon-simula-dev.ts') || caminho.endsWith('tests/reveillon-promo.test.mjs')) continue;
      const texto = readFileSync(caminho, 'utf8');
      assert.doesNotMatch(texto, /va_simula/, caminho);
    }
  };
  visitar('src');
  const checkout = readFileSync('src/components/CheckoutRapido.astro', 'utf8');
  const inicio = checkout.indexOf('if (import.meta.env.DEV)');
  const fimBloco = checkout.indexOf('return ms;', inicio);
  assert.ok(inicio > 0 && fimBloco > inicio);
  const bloco = checkout.slice(inicio, fimBloco);
  assert.match(bloco, /reveillon-simula-dev/);
  assert.doesNotMatch(checkout.slice(0, inicio) + checkout.slice(fimBloco), /reveillon-simula-dev/);
});

function listar(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) listar(caminho, acc);
    else acc.push(caminho);
  }
  return acc;
}

const FRASES = [
  /areia branca/i,
  /pôr do sol/i,
  /por do sol/i,
  /pé na areia/i,
  /pe na areia/i,
  /caribe/i,
  /perto de/i,
  /lancha/i,
  /barco/i,
  /sound healing/i,
  /\bcura\b/i,
  /pensão/i,
  /pensao/i,
  /half board/i,
  /todas as refeições incluídas/i,
];

test('build de produção não leva bypass nem link pronto com valor', { skip: !existsSync('dist') }, () => {
  const arquivos = listar('dist');
  const nomes = arquivos.map((f) => f.replaceAll('\\', '/'));
  assert.ok(!nomes.some((f) => /va_simula|reveillon-simula/.test(f)), nomes.filter((f) => /simula/.test(f)).join('\n'));
  const blobs = arquivos.filter((f) => /\.(html|js|mjs|css|map)$/.test(f)).map((f) => readFileSync(f, 'utf8'));
  const tudo = blobs.join('\n');
  assert.doesNotMatch(tudo, /va_simula/);
  assert.doesNotMatch(tudo, /reveillon-simula-dev/);
  assert.match(tudo, /click_reservar/);
  assert.match(tudo, /codigo_aplicado/);

  const html = readFileSync('dist/pt/lp/pagar-reveillon/index.html', 'utf8');
  assert.match(html, /data-tag="wecarehosting"/);
  assert.doesNotMatch(html, /carlospecucci/);
  assert.match(html, /data-promo="1"/);
  assert.match(html, /data-preco="9000"/);
  assert.match(html, /data-preco="6000"/);
  assert.match(html, /data-preco="5000"/);
  assert.doesNotMatch(html, /7650|5100|4250/);
  assert.doesNotMatch(html, /pay\.infinitepay\.io\/[a-z0-9]+\/\d/);
  assert.match(html, new RegExp(TEXTO_CARTAO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, new RegExp(TEXTO_REFEICOES.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, new RegExp(TEXTO_PIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /5547992067078/);
  for (const frase of FRASES) assert.doesNotMatch(html, frase, frase.toString());

  const detox = readFileSync('dist/pt/lp/pagar-detox/index.html', 'utf8');
  assert.match(detox, /data-tag="carlospecucci"/);
  assert.match(detox, /Todas as refeições incluídas/);
  assert.doesNotMatch(detox, /data-promo="1"/);
  assert.doesNotMatch(detox, /wecarehosting/);
});
