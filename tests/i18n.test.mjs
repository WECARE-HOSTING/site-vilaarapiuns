import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_LOCALE, HTML_LANG, LOCALES, READY_LOCALES } from '../src/i18n/config.ts';
import { isLocale, useList, useTranslations } from '../src/i18n/utils.ts';

test('isLocale: aceita só os códigos configurados em LOCALES', () => {
  for (const locale of LOCALES) {
    assert.equal(isLocale(locale), true);
  }
  assert.equal(isLocale('fr'), false);
  assert.equal(isLocale(''), false);
  assert.equal(isLocale(undefined), false);
});

test('READY_LOCALES é sempre um subconjunto de LOCALES', () => {
  for (const locale of READY_LOCALES) {
    assert.ok(LOCALES.includes(locale), `${locale} está em READY_LOCALES mas não em LOCALES`);
  }
});

test('HTML_LANG tem uma entrada por Locale (usado no <html lang=…>)', () => {
  for (const locale of LOCALES) {
    assert.equal(typeof HTML_LANG[locale], 'string');
    assert.ok(HTML_LANG[locale].length > 0);
  }
});

test('useTranslations: chave totalmente inexistente devolve a própria chave (nunca quebra)', () => {
  const t = useTranslations(DEFAULT_LOCALE);
  assert.equal(t('essa.chave.nao.existe.em.lugar.nenhum'), 'essa.chave.nao.existe.em.lugar.nenhum');
});

test('useTranslations: uma chave real e estável resolve pra um texto (não pra si mesma)', () => {
  // nav.lodge é usado no menu principal — chave estrutural, baixa chance de sumir.
  const t = useTranslations('pt');
  const resultado = t('nav.lodge');
  assert.notEqual(resultado, 'nav.lodge');
  assert.ok(resultado.length > 0);
});

test('useList: chave inexistente devolve lista vazia, não quebra', () => {
  const tList = useList(DEFAULT_LOCALE);
  assert.deepEqual(tList('essa.lista.nao.existe'), []);
});
