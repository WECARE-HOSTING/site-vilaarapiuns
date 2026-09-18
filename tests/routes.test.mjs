import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LOCALES } from '../src/i18n/config.ts';
import { PAGE_KEYS, SLUGS, caminhosNoindex, href, reescreveApexDoSitemap, urlEntraNoSitemap } from '../src/i18n/routes.ts';

test('href: página "home" (slug vazio) vira só a raiz do idioma', () => {
  assert.equal(href('pt', 'home'), '/pt/');
  assert.equal(href('en', 'home'), '/en/');
});

test('href: página com slug monta /idioma/slug/', () => {
  assert.equal(href('pt', 'packages'), '/pt/pacotes/');
  assert.equal(href('en', 'packages'), '/en/packages/');
  assert.equal(href('de', 'gettingHere'), '/de/anreise/');
});

test('href: slugs com barra (bookSent) não quebram a URL', () => {
  assert.equal(href('pt', 'bookSent'), '/pt/reservar/enviado/');
});

test('caminhosNoindex: um caminho por idioma pra cada chave noindex', () => {
  const caminhos = caminhosNoindex();
  // Hoje só bookSent é noindex — 5 idiomas = 5 caminhos.
  assert.equal(caminhos.length, LOCALES.length);
  assert.ok(caminhos.includes(SLUGS.bookSent.pt));
  assert.ok(caminhos.includes(SLUGS.bookSent.en));
});

test('SLUGS: toda PageKey tem slug definido pra todo Locale (sem buraco na tabela)', () => {
  // Distinto do i18n:check (que valida os DICIONÁRIOS de texto) — este
  // confere a tabela de ROTEAMENTO, que é uma fonte de dados separada.
  for (const key of PAGE_KEYS) {
    for (const locale of LOCALES) {
      const slug = SLUGS[key][locale];
      assert.notEqual(
        slug, undefined,
        `SLUGS.${key}.${locale} está faltando`
      );
    }
  }
});

test('urlEntraNoSitemap: apex fora; /en/ entra; styleguide e noindex fora', () => {
  assert.equal(urlEntraNoSitemap('https://villaarapiuns.com.br/'), false);
  assert.equal(urlEntraNoSitemap('https://villaarapiuns.com.br/en/'), true);
  assert.equal(urlEntraNoSitemap('https://villaarapiuns.com.br/pt/'), true);
  assert.equal(urlEntraNoSitemap('https://villaarapiuns.com.br/pt/styleguide/'), false);
  assert.equal(urlEntraNoSitemap('https://villaarapiuns.com.br/en/book/sent/'), false);
});

test('reescreveApexDoSitemap: loc e hreflang en saem do apex para /en/', () => {
  const item = reescreveApexDoSitemap({
    url: 'https://villaarapiuns.com.br/',
    links: [
      { lang: 'en', url: 'https://villaarapiuns.com.br/' },
      { lang: 'en', url: 'https://villaarapiuns.com.br/en/' },
      { lang: 'pt-BR', url: 'https://villaarapiuns.com.br/pt/' },
    ],
  });
  assert.equal(item.url, 'https://villaarapiuns.com.br/en/');
  assert.deepEqual(item.links, [
    { lang: 'en', url: 'https://villaarapiuns.com.br/en/' },
    { lang: 'pt-BR', url: 'https://villaarapiuns.com.br/pt/' },
  ]);
});

test('SLUGS: slugs não-home não têm barra inicial nem final (href já adiciona)', () => {
  for (const key of PAGE_KEYS) {
    if (key === 'home') continue;
    for (const locale of LOCALES) {
      const slug = SLUGS[key][locale];
      assert.ok(!slug.startsWith('/'), `${key}.${locale} não deveria começar com /`);
      assert.ok(!slug.endsWith('/'), `${key}.${locale} não deveria terminar com /`);
    }
  }
});
