import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { conferirPago, faixasVigentes, numero, parseTabela, prazoDiferenca, registrarDiferenca, totalTabela } from '../src/data/tabela-reveillon-2026.ts';
import { lerUtmSessao } from '../src/lib/utm-sessao.ts';
import { WEBHOOK_PAGO_LIGADO, registrarConferencia } from '../src/lib/conferencia-pagamento.ts';

const bruto = readFileSync('src/data/tabela-reveillon-2026-v1.txt', 'utf8');
const mapa = parseTabela(bruto);
const ANTES = Date.parse('2026-11-25T12:00:00-03:00');
const DEPOIS = Date.parse('2026-11-29T00:00:00-03:00');

test('tabela v1: pix 80% do cheio e criança é metade do triplo da faixa', () => {
  assert.equal(mapa.validade_descontos, '2026-11-28T23:59:59-03:00');
  assert.equal(numero(mapa, 'pessoa.pix20.single'), 7200);
  assert.equal(numero(mapa, 'pessoa.pix20.duplo'), 4800);
  assert.equal(numero(mapa, 'pessoa.pix20.triplo'), 4000);
  assert.equal(numero(mapa, 'pessoa.cheio.single'), 9000);
  assert.equal(numero(mapa, 'pessoa.reveillon15.duplo'), 5100);
  assert.equal(numero(mapa, 'pessoa.cheio.crianca_4_12'), 2500);
  assert.equal(numero(mapa, 'pessoa.reveillon15.crianca_4_12'), 2125);
  assert.equal(numero(mapa, 'pessoa.pix20.crianca_4_12'), 2000);
  assert.equal(numero(mapa, 'pessoa.cheio.crianca_ate_3'), 0);
  assert.equal(numero(mapa, 'total_quarto.cheio.duplo'), 12000);
  assert.equal(numero(mapa, 'total_quarto.reveillon15.duplo'), 10200);
  assert.equal(numero(mapa, 'total_quarto.pix20.duplo'), 9600);
  assert.doesNotMatch(bruto, /cliente/i);
});

test('criança é 50% do triplo da faixa, em qualquer ocupação', () => {
  const duplo = { single: 0, duplo: 1, triplo: 0, cri03: 0, cri412: 1 };
  assert.equal(totalTabela(mapa, 'cheio', duplo).total, 14500);
  assert.equal(totalTabela(mapa, 'reveillon15', duplo).total, 12325);
  assert.equal(totalTabela(mapa, 'pix20', duplo).total, 11600);
  const single = { single: 1, duplo: 0, triplo: 0, cri03: 0, cri412: 1 };
  assert.equal(totalTabela(mapa, 'cheio', single).total, 9000 + 2500);
  assert.equal(totalTabela(mapa, 'reveillon15', single).total, 7650 + 2125);
  assert.equal(totalTabela(mapa, 'pix20', single).total, 7200 + 2000);
  const bebe = { single: 1, duplo: 0, triplo: 0, cri03: 1, cri412: 0 };
  assert.equal(totalTabela(mapa, 'cheio', bebe).total, 9000);
  assert.equal(totalTabela(mapa, 'reveillon15', bebe).total, 7650);
  assert.equal(totalTabela(mapa, 'pix20', bebe).total, 7200);
});

test('bebê não entra no limite de 26; criança de 4 a 12 entra', () => {
  const base = { single: 0, duplo: 13, triplo: 0, cri412: 0 };
  const comBebe = totalTabela(mapa, 'cheio', { ...base, cri03: 1 });
  assert.equal(comBebe.pessoas, 27);
  assert.equal(comBebe.acimaDe26, false);
  assert.equal(comBebe.ok, true);
  assert.equal(comBebe.total, 13 * 12000);
  const comCrianca = totalTabela(mapa, 'cheio', { ...base, cri03: 0, cri412: 1 });
  assert.equal(comCrianca.acimaDe26, true);
  assert.equal(comCrianca.ok, false);
  assert.equal(comCrianca.excede, true);
});

test('totais: duplo, duplo com criança, e trava acima de 26', () => {
  const duplo = totalTabela(mapa, 'cheio', { single: 0, duplo: 1, triplo: 0, cri03: 0, cri412: 0 });
  assert.equal(duplo.total, 12000);
  assert.equal(duplo.ok, true);
  const comCrianca = totalTabela(mapa, 'pix20', { single: 0, duplo: 1, triplo: 0, cri03: 1, cri412: 1 });
  assert.equal(comCrianca.total, 9600 + 2000);
  assert.equal(comCrianca.pessoas, 4);
  const cupom = totalTabela(mapa, 'reveillon15', { single: 0, duplo: 1, triplo: 0, cri03: 0, cri412: 1 });
  assert.equal(cupom.total, 10200 + 2125);
  const grupo = totalTabela(mapa, 'cheio', { single: 0, duplo: 0, triplo: 9, cri03: 0, cri412: 0 });
  assert.equal(grupo.pessoas, 27);
  assert.equal(grupo.acimaDe26, true);
  assert.equal(grupo.ok, false);
});

test('descontos não se somam: o webhook só aceita uma faixa', () => {
  const cfg = { single: 0, duplo: 1, triplo: 0, cri03: 0, cri412: 0 };
  const pix = conferirPago(mapa, 960000, ANTES, { ...cfg, faixa: 'pix20' });
  assert.equal(pix.bate, true);
  const misturado = conferirPago(mapa, Math.round(10200 * 0.8 * 100), ANTES, { ...cfg, faixa: 'pix20' });
  assert.equal(misturado.bate, false);
  assert.equal(misturado.manual, true);
  assert.equal(misturado.acao, 'vendas_registra_diferenca');
  assert.equal(misturado.diferencaCentavos, 960000 - Math.round(10200 * 0.8 * 100));
  assert.deepEqual(faixasVigentes(mapa, DEPOIS), ['cheio']);
  const pixDepois = conferirPago(mapa, 960000, DEPOIS, { ...cfg, faixa: 'pix20' });
  assert.equal(pixDepois.bate, false);
});

test('valor fora da tabela vai para conferência manual e nada é enviado ao cliente', () => {
  const fora = conferirPago(mapa, 123, ANTES);
  assert.equal(fora.bate, false);
  assert.equal(fora.manual, true);
  assert.equal(fora.acao, 'nenhuma');
  const reg = registrarConferencia({ paid: true, paid_amount: 123 }, ANTES);
  assert.equal(WEBHOOK_PAGO_LIGADO, false);
  assert.equal(reg.ligado, false);
  assert.equal(reg.enviadoAoCliente, false);
  assert.equal(reg.manual, true);
});

test('diferença a menor: uma mensagem, prazo de 48h limitado a 28/11 23:59:59 BRT', () => {
  assert.equal(mapa['regra.diferenca.mensagem_unica'], 'true');
  assert.equal(mapa['regra.diferenca.status_ate_pagar'], 'pre_reserva_pendente');
  assert.equal(mapa.taxa_cartao, 'EM_ABERTO');
  assert.equal(mapa['regra.taxa_cartao'], 'EM_ABERTO');
  const cfg = { single: 0, duplo: 1, triplo: 0, cri03: 0, cri412: 0, faixa: 'cheio' };
  const pago = 1000000;
  const cedo = Date.parse('2026-11-25T12:00:00-03:00');
  const dentro = registrarDiferenca(mapa, pago, cedo, Date.parse('2026-11-26T12:00:00-03:00'), cfg);
  assert.equal(dentro.status, 'pre_reserva_pendente');
  assert.equal(dentro.confirmada, false);
  assert.equal(dentro.mensagens, 1);
  assert.equal(dentro.enviada, false);
  assert.equal(dentro.motivoEnvio, 'sem_canal');
  assert.equal(dentro.dentroDoPrazo, true);
  assert.equal(dentro.prazoMs, Date.parse('2026-11-27T12:00:00-03:00'));
  const deNovo = registrarDiferenca(mapa, pago, cedo, Date.parse('2026-11-26T18:00:00-03:00'), cfg);
  assert.equal(deNovo.mensagens, 1);
  const fora = registrarDiferenca(mapa, pago, cedo, Date.parse('2026-11-27T12:00:01-03:00'), cfg);
  assert.equal(fora.dentroDoPrazo, false);
  assert.equal(fora.mensagens, 0);
  assert.equal(fora.motivoEnvio, 'fora_do_prazo');
  assert.equal(fora.status, 'pre_reserva_pendente');
  assert.equal(fora.confirmada, false);
  const pertoDoFim = Date.parse('2026-11-28T20:00:00-03:00');
  const teto = Date.parse('2026-11-28T23:59:59-03:00');
  assert.equal(prazoDiferenca(mapa, pertoDoFim), teto);
  const noTeto = registrarDiferenca(mapa, pago, pertoDoFim, teto, cfg);
  assert.equal(noTeto.dentroDoPrazo, true);
  assert.equal(noTeto.mensagens, 1);
  const depoisDoTeto = registrarDiferenca(mapa, pago, pertoDoFim, teto + 1000, cfg);
  assert.equal(depoisDoTeto.dentroDoPrazo, false);
  assert.equal(depoisDoTeto.mensagens, 0);
});

test('utm da sessão: lê a URL, guarda e usa (none) quando falta', () => {
  const mem = new Map();
  const storage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => mem.set(k, v),
  };
  const primeiro = lerUtmSessao('?utm_source=site&utm_campaign=reveillon2026&utm_content=lp-hero', storage);
  assert.deepEqual(primeiro, { utm_source: 'site', utm_campaign: 'reveillon2026', utm_content: 'lp-hero' });
  const segundo = lerUtmSessao('', storage);
  assert.equal(segundo.utm_content, 'lp-hero');
  const vazio = lerUtmSessao('', { getItem: () => null, setItem: () => {} });
  assert.deepEqual(vazio, { utm_source: '(none)', utm_campaign: '(none)', utm_content: '(none)' });
});
