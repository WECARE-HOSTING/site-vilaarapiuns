import assert from 'node:assert/strict';
import { test } from 'node:test';

import { preco, telefoneLegivel, whatsappUrl } from '../src/data/site.ts';

test('preco: símbolo R$ e separador de milhar por idioma', () => {
  assert.equal(preco(2300, 'pt'), 'R$ 2.300');
  assert.equal(preco(2300, 'en'), 'R$ 2,300');
  assert.equal(preco(2300, 'de'), 'R$ 2.300');
  // ACHADO (não é bug óbvio, é uma decisão de produto pendente): o
  // comentário de preco() promete "R$ 2.300 em pt/es/de", mas o locale
  // "es" puro (sem região) não agrupa milhar no Intl do Node — nem "es-ES"
  // agrupa; só "es-419" (América Latina) dá "2,300". Fixando aqui o
  // comportamento REAL observado, não o prometido no comentário — vale
  // uma decisão consciente do time sobre qual variante de "es" usar.
  assert.equal(preco(2300, 'es'), 'R$ 2300');
});

test('preco: nunca converte a moeda, é sempre BRL', () => {
  assert.ok(preco(100, 'en').startsWith('R$'));
});

test('whatsappUrl: monta o link com a mensagem codificada', () => {
  const url = whatsappUrl('Olá, quero reservar');
  assert.ok(url.startsWith('https://wa.me/'));
  assert.ok(url.includes(encodeURIComponent('Olá, quero reservar')));
});

test('telefoneLegivel: formata o WhatsApp configurado como +55 DD NNNNN-NNNN', () => {
  // Não é possível injetar um valor diferente (a função lê SITE.contact.whatsapp
  // diretamente, por design — ver o comentário da função). Este teste fixa o
  // formato esperado para o número real hoje configurado; se o número mudar
  // pra um comprimento que a função não sabe formatar, é o teste (não só o
  // deploy) que vai avisar.
  const resultado = telefoneLegivel();
  assert.match(resultado, /^\+55 \d{2} \d{4,5}-\d{4}$/);
});
