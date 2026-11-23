import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const checkout = readFileSync('src/components/CheckoutRapido.astro', 'utf8');
const llms = readFileSync('public/llms.txt', 'utf8');
const barra = readFileSync('src/components/BarraPromo.astro', 'utf8');

test('o fechamento diz café, almoço e jantar, e o cartão como está no ar', () => {
  assert.match(checkout, /Café da manhã, almoço e jantar incluídos\./);
  assert.match(checkout, /Cartão de crédito em até 12x, pela InfinitePay \(Pix: fale no WhatsApp\)\./);
  assert.match(checkout, /Sem disponibilidade, devolução integral do valor\./);
  assert.doesNotMatch(checkout, /Todas as refeições/);
  assert.doesNotMatch(checkout, /all meals/i);
  assert.doesNotMatch(checkout, /Pix disponível/);
  assert.doesNotMatch(checkout, /juros absorvidos/);
  assert.doesNotMatch(checkout, /sem acréscimo/);
});

test('llms.txt não chama a estadia de all meals', () => {
  assert.doesNotMatch(llms, /all meals/i);
  assert.match(llms, /breakfast, lunch and dinner/);
});

test('a faixa do topo não usa areia branca', () => {
  assert.doesNotMatch(barra, /areia branca/i);
  assert.match(barra, /Vire o ano no Rio Arapiuns\. Vagas limitadas\./);
});

test('a política, nos cinco idiomas, diz prazo, base, transferência e a lacuna do CNPJ, sem prazo numérico', () => {
  for (const idioma of ['pt', 'en', 'es', 'de', 'ja']) {
    const json = JSON.parse(readFileSync(`src/i18n/${idioma}.json`, 'utf8'));
    const p = json.privacidade;
    for (const chave of ['baseT', 'baseD', 'prazoT', 'prazoD', 'transferenciaT', 'transferenciaD', 'controladorD']) {
      assert.equal(typeof p[chave], 'string', `${idioma} sem ${chave}`);
      assert.ok(p[chave].trim().length > 0, `${idioma} ${chave} vazio`);
    }
    assert.match(p.controladorD, /CNPJ/);
    assert.match(p.controladorD, /reservas@villaarapiuns\.com\.br/);
    assert.doesNotMatch(p.prazoD, /\d+\s*(anos|years|años|Jahre|年)/i);
    assert.doesNotMatch(p.controladorD, /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    const bloco = JSON.stringify({
      base: p.baseD, prazo: p.prazoD, fora: p.transferenciaD, quem: p.controladorD,
    });
    assert.doesNotMatch(bloco, /all meals/i);
    assert.doesNotMatch(bloco, /todas as refeições/i);
  }
});
