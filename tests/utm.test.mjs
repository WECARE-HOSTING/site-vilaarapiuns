import assert from 'node:assert/strict';
import { test } from 'node:test';

import { comEtiqueta, etiqueta, lerUtm, mesclarUtm, persistirUtm } from '../src/lib/utm.ts';

function memoria() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
  };
}

test('UTM de qualquer origem entra na sessão, não só google', () => {
  const s = memoria();
  const bag = persistirUtm('?utm_source=newsletter&utm_medium=email&utm_campaign=virada&gclid=abc&fbclid=def', s);
  assert.equal(bag.utm_source, 'newsletter');
  assert.equal(bag.utm_medium, 'email');
  assert.equal(bag.utm_campaign, 'virada');
  assert.equal(bag.gclid, 'abc');
  assert.equal(bag.fbclid, 'def');
  assert.deepEqual(lerUtm(s), bag);
});

test('navegar sem query não apaga a UTM já guardada', () => {
  const s = memoria();
  persistirUtm('?utm_source=meta&utm_campaign=reveillon', s);
  const depois = persistirUtm('', s);
  assert.equal(depois.utm_source, 'meta');
  assert.equal(depois.utm_campaign, 'reveillon');
});

test('parâmetro novo substitui só a chave que veio de novo', () => {
  const junto = mesclarUtm({ utm_source: 'google', utm_campaign: 'antiga' }, { utm_campaign: 'nova' });
  assert.equal(junto.utm_source, 'google');
  assert.equal(junto.utm_campaign, 'nova');
});

test('etiquetas: google-reveillon, meta_ads-reveillon e a origem que for', () => {
  assert.equal(etiqueta({ utm_source: 'google' }, '/pt/lp/pagar-reveillon/'), '[google-reveillon]');
  assert.equal(etiqueta({ gclid: '1' }, '/pt/reveillon/'), '[google-reveillon]');
  assert.equal(etiqueta({ utm_source: 'facebook' }, '/pt/lp/reveillon/'), '[meta_ads-reveillon]');
  assert.equal(etiqueta({ utm_source: 'meta', utm_medium: 'cpc' }, '/pt/lp/pagar-reveillon/'), '[meta_ads-reveillon]');
  assert.equal(etiqueta({ fbclid: 'x' }, '/en/new-years-eve/'), '[meta_ads-reveillon]');
  assert.equal(etiqueta({ utm_source: 'google' }, '/pt/lp/detox-pos-reveillon/'), '[google-detox]');
  assert.equal(etiqueta({ utm_source: 'newsletter' }, '/pt/lp/pagar-reveillon/'), '[newsletter-reveillon]');
  assert.equal(etiqueta({}, '/pt/'), '');
});

test('a etiqueta entra no texto do WhatsApp uma vez só', () => {
  const href = 'https://wa.me/5547992067078?text=Oi';
  const uma = comEtiqueta(href, '[meta_ads-reveillon]');
  assert.match(uma, /meta_ads-reveillon/);
  const duas = comEtiqueta(uma, '[meta_ads-reveillon]');
  assert.equal(duas, uma);
});
