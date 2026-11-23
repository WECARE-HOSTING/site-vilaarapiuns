import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { handleCheckoutRequest } from '../src/lib/checkout-proxy.ts';
import {
  confirmarPagamento,
  criarLink,
  linkEstaticoInfinitePay,
  itemCompra,
  lerRetorno,
  marcarDisparo,
  novoOrderNsu,
  planoDeConversoes,
  valorPagoBRL,
} from '../src/lib/checkout.ts';

function memoria() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

const pedidoDuplo = {
  pacoteId: 'reveillon',
  single: 0,
  duplo: 1,
  triplo: 0,
  cri03: 0,
  cri412: 0,
  modo: 'sinal',
  order_nsu: 'reveillon-abc123',
  redirect_url: 'https://villaarapiuns.com.br/pt/lp/pagamento-confirmado/',
  etiqueta: '[google-reveillon]',
};

test('o proxy cobra 30% em centavos na conta wecarehosting e não usa o preço do navegador', async () => {
  let enviado;
  const fetchImpl = async (url, init) => {
    enviado = { url, body: JSON.parse(init.body), headers: init.headers };
    return new Response(JSON.stringify({ url: 'https://checkout.infinitepay.io/abc' }), { status: 200 });
  };
  const res = await handleCheckoutRequest(new Request('https://proxy.test/links', {
    method: 'POST',
    headers: { origin: 'https://villaarapiuns.com.br', 'content-type': 'application/json' },
    body: JSON.stringify({ ...pedidoDuplo, price: 1 }),
  }), { INFINITEPAY_API_KEY: 'segredo-teste', INFINITEPAY_WEBHOOK_URL: 'https://hooks.example/villa' }, fetchImpl);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.price, 360_000);
  assert.equal(json.total, 1_200_000);
  assert.equal(enviado.url, 'https://api.checkout.infinitepay.io/links');
  assert.equal(enviado.body.handle, 'wecarehosting');
  assert.equal(enviado.body.order_nsu, 'reveillon-abc123');
  assert.equal(enviado.body.items[0].price, 360_000);
  assert.equal(enviado.body.items[0].quantity, 1);
  assert.match(enviado.body.items[0].description, /Sinal 30%/);
  assert.match(enviado.body.items[0].description, /google-reveillon/);
  assert.equal(enviado.body.webhook_url, 'https://hooks.example/villa');
  assert.equal(enviado.headers['X-Api-Key'], 'segredo-teste');
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://villaarapiuns.com.br');
});

test('Detox sem preço publicado não vira link', async () => {
  let chamou = false;
  const fetchImpl = async () => { chamou = true; return new Response('{}'); };
  const res = await handleCheckoutRequest(new Request('https://proxy.test/links', {
    method: 'POST',
    body: JSON.stringify({ ...pedidoDuplo, pacoteId: 'detox' }),
  }), {}, fetchImpl);
  assert.equal(res.status, 409);
  assert.equal((await res.json()).erro, 'preco_nao_publicado');
  assert.equal(chamou, false);
});

test('redirect fora do site é recusado', async () => {
  const res = await handleCheckoutRequest(new Request('https://proxy.test/links', {
    method: 'POST',
    body: JSON.stringify({ ...pedidoDuplo, redirect_url: 'https://evil.example/pt/lp/pagamento-confirmado/' }),
  }), {}, async () => new Response('{}'));
  assert.equal(res.status, 400);
  assert.equal((await res.json()).erro, 'redirect_invalido');
});

test('payment_check só devolve paid quando a InfinitePay diz true', async () => {
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    assert.equal(url, 'https://api.checkout.infinitepay.io/payment_check');
    assert.equal(body.handle, 'wecarehosting');
    assert.equal(body.order_nsu, 'reveillon-abc123');
    return new Response(JSON.stringify({ paid: true, paid_amount: 360000, capture_method: 'pix', receipt_url: 'https://checkout.infinitepay.io/r/1' }), { status: 200 });
  };
  const res = await handleCheckoutRequest(new Request('https://proxy.test/payment-check', {
    method: 'POST',
    body: JSON.stringify({ order_nsu: 'reveillon-abc123', transaction_nsu: 'tx-1', slug: 'slug-1' }),
  }), {}, fetchImpl);
  const json = await res.json();
  assert.equal(json.paid, true);
  assert.equal(json.paid_amount, 360000);
});

test('criarLink sem endpoint cai no WhatsApp e não finge URL de checkout', async () => {
  const r = await criarLink({
    pacoteId: 'reveillon', single: 0, duplo: 1, triplo: 0, cri03: 0, cri412: 0,
    modo: 'sinal', orderNsu: 'reveillon-x', redirectUrl: 'https://villaarapiuns.com.br/pt/lp/pagamento-confirmado/', etiqueta: '',
  }, { apiBase: '' });
  assert.equal(r.destino, 'whatsapp');
  assert.equal(r.motivo, 'sem_endpoint');
});

test('criarLink usa o proxy e só aceita https de volta', async () => {
  const r = await criarLink({
    pacoteId: 'reveillon', single: 0, duplo: 1, triplo: 0, cri03: 0, cri412: 1,
    modo: 'sinal', orderNsu: 'reveillon-x', redirectUrl: 'https://villaarapiuns.com.br/pt/lp/pagamento-confirmado/', etiqueta: '[meta_ads-reveillon]',
  }, {
    apiBase: 'https://proxy.test',
    fetchImpl: async () => new Response(JSON.stringify({ url: 'https://checkout.infinitepay.io/ok' }), { status: 200 }),
  });
  assert.equal(r.destino, 'checkout');
  assert.equal(r.url, 'https://checkout.infinitepay.io/ok');
});

test('obrigado: paid true vira pago; paid false e reload não geram outra compra', async () => {
  const params = new URLSearchParams('order_nsu=reveillon-abc123&transaction_nsu=tx-1&slug=slug-1&capture_method=credit_card&receipt_url=https://checkout.infinitepay.io/r/1');
  assert.equal(lerRetorno(params)?.order_nsu, 'reveillon-abc123');
  assert.equal(lerRetorno(new URLSearchParams('order_nsu=1')), null);

  const pago = await confirmarPagamento(params, {
    apiBase: 'https://proxy.test',
    sinalCentavosSalvo: 360000,
    fetchImpl: async () => new Response(JSON.stringify({ paid: true, paid_amount: 360000, receipt_url: 'https://checkout.infinitepay.io/r/1' }), { status: 200 }),
  });
  assert.equal(pago.estado, 'pago');
  assert.equal(pago.valorBRL, 3600);

  const nao = await confirmarPagamento(params, {
    apiBase: 'https://proxy.test',
    fetchImpl: async () => new Response(JSON.stringify({ paid: false }), { status: 200 }),
  });
  assert.equal(nao.estado, 'nao_pago');

  const storage = memoria();
  const base = { pago: true, orderNsu: 'reveillon-abc123', storage, adsId: 'AW-1', adsLabel: 'rotulo', pixelId: '99', marketingConsent: true };
  const primeiro = planoDeConversoes(base);
  assert.deepEqual(primeiro, { ga4: true, ads: true, meta: true });
  marcarDisparo(storage, 'ga4', base.orderNsu);
  marcarDisparo(storage, 'ads', base.orderNsu);
  marcarDisparo(storage, 'meta', base.orderNsu);
  assert.deepEqual(planoDeConversoes(base), { ga4: false, ads: false, meta: false });
  assert.deepEqual(planoDeConversoes({ ...base, pago: false }), { ga4: false, ads: false, meta: false });
  const semAds = planoDeConversoes({ ...base, orderNsu: 'outro', adsId: '', adsLabel: '', marketingConsent: false });
  assert.equal(semAds.ga4, true);
  assert.equal(semAds.ads, false);
  assert.equal(semAds.meta, false);
});

test('valor em centavos vira BRL; o item de purchase carrega transaction em reais', () => {
  assert.equal(valorPagoBRL({ paid_amount: 360000 }, 360000), 3600);
  assert.equal(valorPagoBRL({ paid: true }, 270000), 2700);
  const item = itemCompra('reveillon', 'Sinal Réveillon', 3600);
  assert.equal(item.item_id, 'reveillon-sinal');
  assert.equal(item.price, 3600);
  assert.equal(item.quantity, 1);
});

test('order_nsu é único e só tem caracteres seguros', () => {
  const a = novoOrderNsu('reveillon', 1000, 0.1);
  const b = novoOrderNsu('reveillon', 1000, 0.2);
  assert.notEqual(a, b);
  assert.match(a, /^reveillon-[a-z0-9-]+$/);
});

test('o botão de pagar abre o link estático da wecarehosting, com vírgula nos centavos', () => {
  assert.equal(linkEstaticoInfinitePay(3600), 'https://pay.infinitepay.io/wecarehosting/3600,00');
  assert.equal(linkEstaticoInfinitePay(3600.5), 'https://pay.infinitepay.io/wecarehosting/3600,50');
  assert.equal(linkEstaticoInfinitePay(0), null);
  assert.match(readFileSync('src/lib/checkout.ts', 'utf8'), /https:\/\/pay\.infinitepay\.io\/wecarehosting\//);
  for (const f of ['src/components/CheckoutRapido.astro', 'src/components/LandingPacote.astro']) {
    const texto = readFileSync(f, 'utf8');
    assert.match(texto, /linkEstaticoInfinitePay/);
    assert.doesNotMatch(texto, /carlospecucci/);
  }
});

test('a cobrança deste checkout usa só o handle wecarehosting', () => {
  const arquivos = [
    'src/lib/checkout.ts',
    'src/lib/checkout-proxy.ts',
    'workers/infinitepay-proxy/wrangler.toml',
    'docs/checkout-infinitepay.md',
  ];
  for (const f of arquivos) {
    const texto = readFileSync(f, 'utf8');
    assert.match(texto, /wecarehosting/);
    assert.doesNotMatch(texto, /carlospecucci/);
  }
});
