import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

test('raiz não usa meta refresh nem detecção de idioma no JS', () => {
  const src = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  assert.equal(src.includes('http-equiv="refresh"'), false);
  assert.equal(src.includes('navigator.languages'), false);
  assert.match(src, /Astro\.redirect/);
});

test('astro.config declara 301 / → /pt/ e mantém o defaultLocale em en', () => {
  const src = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  assert.match(src, /status:\s*301/);
  assert.match(src, /redirectToDefaultLocale:\s*true/);
  assert.match(src, /destination:\s*`\/\$\{ROOT_LOCALE\}\/`/);
  assert.equal(/destination:\s*`\/\$\{DEFAULT_LOCALE\}\/`/.test(src), false);
  assert.equal((src.match(/defaultLocale:\s*'en'/g) ?? []).length, 2);
});

test('nginx tem location = / com return 301 /pt/ e não uma regra 302', () => {
  const src = readFileSync(new URL('../nginx-root-redirect.conf', import.meta.url), 'utf8');
  assert.match(src, /location = \//);
  assert.match(src, /return 301 \/pt\//);
  assert.equal(/return 301 \/en\//.test(src), false);
  assert.equal(/^\s*return\s+302\b/m.test(src), false);
  assert.equal(/^\s*rewrite\b.*\bredirect\s*;/m.test(src), false);
  assert.match(src, /systemctl reload nginx/);
  assert.match(src, /docs\/redirect-raiz\.md/);
});

test('x-default do layout usa ROOT_LOCALE, não o inglês fixo', () => {
  const src = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  assert.match(src, /a\.locale === ROOT_LOCALE/);
  assert.match(src, /href\(ROOT_LOCALE, pageKey\)/);
  assert.equal(src.includes("href('en', pageKey)"), false);
});

test('docs do redirect da raiz mandam /pt/, o bloco inline e a volta ao include', () => {
  const src = readFileSync(new URL('../docs/redirect-raiz.md', import.meta.url), 'utf8');
  assert.match(src, /include \/home\/USUARIO\/public_html\/nginx-root-redirect\.conf/);
  assert.match(src, /sudo nginx -t && sudo systemctl reload nginx/);
  assert.match(src, /curl -sI https:\/\/villaarapiuns\.com\.br\//);
  assert.match(src, /HTTP\/2 301/);
  assert.match(src, /Não 302/);
  assert.match(src, /return 301 \/pt\//);
  assert.match(src, /location = \/ \{ return 301 \/pt\/; \}/);
  assert.match(src, /villaarapiuns\.com\.br\.bak-20260924-181232/);
  assert.match(src, /voltar ao include/);
});

const sitemap = new URL('../dist/sitemap-0.xml', import.meta.url);
const skipSitemap = !existsSync(sitemap);

test('sitemap construído não lista o apex e aponta hreflang en para /en/', { skip: skipSitemap }, () => {
  const xml = readFileSync(sitemap, 'utf8');
  assert.equal(xml.includes('<loc>https://villaarapiuns.com.br/</loc>'), false);
  assert.equal(xml.includes('<loc>https://villaarapiuns.com.br/en/</loc>'), true);
  assert.equal(xml.includes('<loc>https://villaarapiuns.com.br/pt/</loc>'), true);
  assert.equal(xml.includes('href="https://villaarapiuns.com.br/"'), false);
  assert.equal(xml.includes('hreflang="en" href="https://villaarapiuns.com.br/en/"'), true);
});

const fallback = new URL('../dist/index.html', import.meta.url);
const skipFallback = !existsSync(fallback);

test('fallback SSG da raiz é noindex e aponta para /pt/, sem sniff de idioma', { skip: skipFallback }, () => {
  const html = readFileSync(fallback, 'utf8');
  assert.match(html, /noindex/);
  assert.match(html, /http-equiv="refresh" content="0;url=\/pt\/"/);
  assert.match(html, /rel="canonical" href="https:\/\/villaarapiuns\.com\.br\/pt\/"/);
  assert.equal(html.includes('/en/'), false);
  assert.equal(html.includes('navigator.languages'), false);
});

const enHome = new URL('../dist/en/index.html', import.meta.url);
const ptHome = new URL('../dist/pt/index.html', import.meta.url);
const enPackages = new URL('../dist/en/packages/index.html', import.meta.url);
const skipPages = !existsSync(enHome) || !existsSync(ptHome) || !existsSync(enPackages);

test('x-default das páginas vai para o português; canonical e alternates ficam', { skip: skipPages }, () => {
  const en = readFileSync(enHome, 'utf8');
  const pt = readFileSync(ptHome, 'utf8');
  const packs = readFileSync(enPackages, 'utf8');

  assert.match(en, /rel="canonical" href="https:\/\/villaarapiuns\.com\.br\/en\/"/);
  assert.match(en, /hreflang="x-default" href="https:\/\/villaarapiuns\.com\.br\/pt\/"/);
  assert.match(en, /hreflang="en" href="https:\/\/villaarapiuns\.com\.br\/en\/"/);
  assert.match(en, /hreflang="pt-BR" href="https:\/\/villaarapiuns\.com\.br\/pt\/"/);
  assert.match(en, /hreflang="es" href="https:\/\/villaarapiuns\.com\.br\/es\/"/);
  assert.match(en, /hreflang="de" href="https:\/\/villaarapiuns\.com\.br\/de\/"/);
  assert.match(en, /hreflang="ja" href="https:\/\/villaarapiuns\.com\.br\/ja\/"/);

  assert.match(pt, /rel="canonical" href="https:\/\/villaarapiuns\.com\.br\/pt\/"/);
  assert.match(pt, /hreflang="x-default" href="https:\/\/villaarapiuns\.com\.br\/pt\/"/);
  assert.match(pt, /hreflang="en" href="https:\/\/villaarapiuns\.com\.br\/en\/"/);

  assert.match(packs, /rel="canonical" href="https:\/\/villaarapiuns\.com\.br\/en\/packages\/"/);
  assert.match(packs, /hreflang="x-default" href="https:\/\/villaarapiuns\.com\.br\/pt\/pacotes\/"/);
  assert.match(packs, /hreflang="en" href="https:\/\/villaarapiuns\.com\.br\/en\/packages\/"/);
  assert.match(packs, /hreflang="pt-BR" href="https:\/\/villaarapiuns\.com\.br\/pt\/pacotes\/"/);
});
