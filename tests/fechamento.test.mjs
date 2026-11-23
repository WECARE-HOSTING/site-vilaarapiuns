import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PACOTE_DETOX,
  PACOTE_REVEILLON,
  cotar,
  distribuirPessoas,
  interpretarPessoas,
  reaisDeCentavos,
} from '../src/lib/fechamento.ts';

test('?pessoas=2 preenche 1 Duplo', () => {
  const d = distribuirPessoas(interpretarPessoas('2'));
  assert.deepEqual(
    { single: d.single, duplo: d.duplo, triplo: d.triplo, pessoas: d.pessoas, informado: d.informado },
    { single: 0, duplo: 1, triplo: 0, pessoas: 2, informado: true },
  );
});

test('?pessoas ausente ou inválido cai no padrão de 1 Duplo, e a pessoa ainda pode editar', () => {
  for (const entrada of [null, undefined, interpretarPessoas(''), interpretarPessoas('dois'), interpretarPessoas('-1'), 0]) {
    const d = distribuirPessoas(entrada);
    assert.equal(d.informado, false);
    assert.equal(d.duplo, 1);
    assert.equal(d.single, 0);
    assert.equal(d.triplo, 0);
  }
});

test('distribuição mais barata: 1 Single, 4 vira 2 Duplos, 5 vira Triplo+Duplo', () => {
  assert.deepEqual(pick(1), { single: 1, duplo: 0, triplo: 0 });
  assert.deepEqual(pick(3), { single: 0, duplo: 0, triplo: 1 });
  assert.deepEqual(pick(4), { single: 0, duplo: 2, triplo: 0 });
  assert.deepEqual(pick(5), { single: 0, duplo: 1, triplo: 1 });
  assert.deepEqual(pick(7), { single: 0, duplo: 2, triplo: 1 });
});

test('acima de 26 hóspedes o pré-preenchimento para em 26', () => {
  const d = distribuirPessoas(40);
  assert.equal(d.limitado, true);
  assert.equal(d.pessoas, 26);
  assert.equal(d.single + d.duplo * 2 + d.triplo * 3, 26);
  assert.ok(d.single + d.duplo + d.triplo <= 13);
});

test('sinal de 30% em centavos: 1 Duplo é R$ 12.000, sinal R$ 3.600', () => {
  const c = cotar(PACOTE_REVEILLON, { single: 0, duplo: 1, triplo: 0, cri03: 0, cri412: 0 }, 'sinal');
  assert.equal(c.ok, true);
  assert.equal(c.totalCentavos, 1_200_000);
  assert.equal(c.sinalCentavos, 360_000);
  assert.equal(c.cobrancaCentavos, 360_000);
  assert.equal(reaisDeCentavos(c.sinalCentavos), 3600);
});

test('1 Single R$ 9.000, sinal 30% = R$ 2.700; 1 Triplo R$ 15.000, sinal R$ 4.500', () => {
  const single = cotar(PACOTE_REVEILLON, { single: 1, duplo: 0, triplo: 0, cri03: 0, cri412: 0 });
  const triplo = cotar(PACOTE_REVEILLON, { single: 0, duplo: 0, triplo: 1, cri03: 0, cri412: 0 });
  assert.equal(single.totalCentavos, 900_000);
  assert.equal(single.sinalCentavos, 270_000);
  assert.equal(triplo.totalCentavos, 1_500_000);
  assert.equal(triplo.sinalCentavos, 450_000);
});

test('criança 0–3 não soma; 4–12 paga 50% da ocupação mais barata escolhida', () => {
  const soBebe = cotar(PACOTE_REVEILLON, { single: 0, duplo: 1, triplo: 0, cri03: 2, cri412: 0 });
  assert.equal(soBebe.totalCentavos, 1_200_000);
  assert.equal(soBebe.pessoas, 4);
  const meia = cotar(PACOTE_REVEILLON, { single: 1, duplo: 1, triplo: 0, cri03: 0, cri412: 1 });
  // adultos: 9000 + 12000 = 21000; criança na mais barata (duplo 6000) × 50% = 3000
  assert.equal(meia.totalCentavos, 2_400_000);
  assert.equal(meia.sinalCentavos, 720_000);
});

test('modo total cobra o pacote inteiro, não o sinal', () => {
  const c = cotar(PACOTE_REVEILLON, { duplo: 1 }, 'total');
  assert.equal(c.cobrancaCentavos, c.totalCentavos);
  assert.notEqual(c.cobrancaCentavos, c.sinalCentavos);
});

test('capacidade: 14 bangalôs ou 27 pessoas não geram cobrança', () => {
  const bang = cotar(PACOTE_REVEILLON, { single: 14, duplo: 0, triplo: 0, cri03: 0, cri412: 0 });
  assert.equal(bang.ok, false);
  assert.equal(bang.motivo, 'capacidade');
  assert.equal(bang.cobrancaCentavos, 0);
});

test('Detox não tem preço publicado e não produz centavos', () => {
  assert.equal(PACOTE_DETOX.publicado, false);
  assert.equal(PACOTE_DETOX.ocupacoes, null);
  const c = cotar(PACOTE_DETOX, { duplo: 1, cri03: 0, cri412: 0 }, 'sinal');
  assert.equal(c.ok, false);
  assert.equal(c.motivo, 'preco_nao_publicado');
  assert.equal(c.sinalCentavos, 0);
  assert.equal(c.totalCentavos, 0);
});

function pick(n) {
  const d = distribuirPessoas(n);
  return { single: d.single, duplo: d.duplo, triplo: d.triplo };
}
