import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const arquivo = 'dist/pt/lp/pagar-detox/index.html';

test('pagar-detox: condição por grupo, sem preço público', { skip: !existsSync(arquivo) }, () => {
  const html = readFileSync(arquivo, 'utf8');

  for (const proibido of ['R$', 'pay.infinitepay.io', 'Vagas limitadas', 'areia branca', 'Todas as refeições']) {
    assert.equal(html.includes(proibido), false, `não deveria conter ${JSON.stringify(proibido)}`);
  }

  assert.ok(html.includes('Condição por grupo, consulte no WhatsApp'));
  assert.ok(html.includes('Café da manhã, almoço e jantar incluídos.'));
  assert.ok(html.includes('o rio, a floresta e o silêncio.'));
  assert.ok(html.includes('https://wa.me/5547992067078?text='));
  assert.ok(html.includes(encodeURIComponent('Oi! Quero saber a condição do Detox de 1 a 10/1/2027.')));
});
