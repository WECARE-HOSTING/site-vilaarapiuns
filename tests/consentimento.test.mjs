import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  CHAVE_CONSENTIMENTO,
  aceitarTudo,
  consentModeDe,
  consentModePadrao,
  deveDispararMeta,
  lerEscolha,
  preferencias,
  recusarNaoEssenciais,
  salvarEscolha,
} from '../src/lib/consentimento.ts';

function memoria() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

test('sem escolha, Consent Mode nasce negado para estatística e marketing', () => {
  const e = consentModePadrao();
  assert.equal(e.analytics_storage, 'denied');
  assert.equal(e.ad_storage, 'denied');
  assert.equal(e.ad_user_data, 'denied');
  assert.equal(e.ad_personalization, 'denied');
  assert.equal(e.functionality_storage, 'granted');
  assert.equal(e.security_storage, 'granted');
});

test('aceitar tudo libera estatística e marketing; recusar deixa os dois negados', () => {
  const sim = consentModeDe(aceitarTudo('2026-11-23'));
  assert.equal(sim.analytics_storage, 'granted');
  assert.equal(sim.ad_storage, 'granted');
  const nao = consentModeDe(recusarNaoEssenciais('2026-11-23'));
  assert.equal(nao.analytics_storage, 'denied');
  assert.equal(nao.ad_storage, 'denied');
  assert.equal(nao.ad_user_data, 'denied');
});

test('preferências granulares: estatística sem marketing, e o essencial não desliga', () => {
  const e = preferencias({ estatisticas: true, marketing: false }, '2026-11-23');
  assert.equal(e.essenciais, true);
  const modo = consentModeDe(e);
  assert.equal(modo.analytics_storage, 'granted');
  assert.equal(modo.ad_storage, 'denied');
  assert.equal(modo.ad_personalization, 'denied');
});

test('a escolha sobrevive no storage e o Pixel só dispara com marketing e ID', () => {
  const s = memoria();
  assert.equal(lerEscolha(s), null);
  assert.equal(deveDispararMeta('PageView', null, '123'), false);
  assert.equal(deveDispararMeta('Purchase', aceitarTudo('t'), ''), false);
  salvarEscolha(s, recusarNaoEssenciais('t'));
  assert.equal(s.getItem(CHAVE_CONSENTIMENTO)?.includes('"marketing":false'), true);
  assert.equal(deveDispararMeta('Contact', lerEscolha(s), '123'), false);
  salvarEscolha(s, aceitarTudo('t'));
  for (const evento of ['PageView', 'InitiateCheckout', 'Contact', 'Purchase']) {
    assert.equal(deveDispararMeta(evento, lerEscolha(s), '123'), true);
  }
});

test('o banner fica no pé, abaixo do cabeçalho, e não nasce colado no topo', () => {
  const css = readFileSync('src/components/BannerConsentimento.astro', 'utf8');
  assert.match(css, /bottom:\s*0/);
  assert.match(css, /z-index:\s*40/);
  assert.match(css, /max-height:\s*calc\(100svh - 8rem\)/);
  assert.doesNotMatch(css, /top:\s*0/);
  assert.match(css, /data-lgpd-aceitar/);
  assert.match(css, /data-lgpd-recusar/);
  assert.match(css, /data-lgpd-estatisticas/);
  assert.match(css, /data-lgpd-marketing/);
});
