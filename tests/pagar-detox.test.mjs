import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const arquivo = 'dist/pt/lp/pagar-detox/index.html';

test('pagar-detox: condição por grupo, sem preço público', { skip: !existsSync(arquivo) }, () => {
  const html = readFileSync(arquivo, 'utf8');

  for (const proibido of ['R$', 'pay.infinitepay.io', 'Vagas limitadas', 'areia branca', 'Todas as refeições', 'mín. 2 noites']) {
    assert.equal(html.includes(proibido), false, `não deveria conter ${JSON.stringify(proibido)}`);
  }

  assert.ok(html.includes('Condição por grupo, consulte no WhatsApp'));
  assert.ok(html.includes('Café da manhã, almoço e jantar incluídos.'));
  assert.ok(html.includes('o rio, a floresta e o silêncio.'));
  assert.ok(html.includes('https://wa.me/5511968518330?text='));
  assert.ok(html.includes(encodeURIComponent('Oi! Quero saber a condição do Detox de 1 a 10/1/2027.')));
  assert.ok(html.includes('1 a 10/1/2027'));
});

const lp = 'dist/pt/lp/detox-pos-reveillon/index.html';

test('lp detox: sem preço público, condição no WhatsApp', { skip: !existsSync(lp) }, () => {
  const html = readFileSync(lp, 'utf8');

  for (const proibido of ['R$', 'pay.infinitepay.io', 'Vagas limitadas', 'areia branca', 'Todas as refeições', 'mín. 2 noites', 'pôr do sol']) {
    assert.equal(html.includes(proibido), false, `não deveria conter ${JSON.stringify(proibido)}`);
  }

  assert.ok(html.includes('Condição por grupo, consulte no WhatsApp'));
  assert.ok(html.includes('Café da manhã, almoço e jantar incluídos'));
  assert.ok(html.includes('Banho de rio, SUP e fim de tarde à beira do rio.'));
  assert.ok(html.includes(encodeURIComponent('Oi! Quero saber a condição do Detox de 1 a 10/1/2027.')));
  assert.equal(html.includes('"@type":"Offer"'), false);
  assert.equal(html.includes('priceRange'), false);
});
