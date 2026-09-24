import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

test('raiz não usa meta refresh nem detecção de idioma no JS', () => {
  const src = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  assert.equal(src.includes('http-equiv="refresh"'), false);
  assert.equal(src.includes('navigator.languages'), false);
  assert.match(src, /Astro\.redirect/);
});

test('astro.config declara 301 / → /en/ e redirectToDefaultLocale', () => {
  const src = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  assert.match(src, /status:\s*301/);
  assert.match(src, /redirectToDefaultLocale:\s*true/);
  assert.match(src, /destination:\s*`\/\$\{DEFAULT_LOCALE\}\/`/);
});

test('nginx tem location = / com return 301 /en/ e não uma regra 302', () => {
  const src = readFileSync(new URL('../nginx-root-redirect.conf', import.meta.url), 'utf8');
  assert.match(src, /location = \//);
  assert.match(src, /return 301 \/en\//);
  assert.equal(/^\s*return\s+302\b/m.test(src), false);
  assert.equal(/^\s*rewrite\b.*\bredirect\s*;/m.test(src), false);
  assert.match(src, /systemctl reload nginx/);
  assert.match(src, /docs\/redirect-raiz\.md/);
});

test('docs do redirect da raiz mandam incluir o snippet e recarregar o nginx', () => {
  const src = readFileSync(new URL('../docs/redirect-raiz.md', import.meta.url), 'utf8');
  assert.match(src, /include \/home\/USUARIO\/public_html\/nginx-root-redirect\.conf/);
  assert.match(src, /sudo nginx -t && sudo systemctl reload nginx/);
  assert.match(src, /curl -sI https:\/\/villaarapiuns\.com\.br\//);
  assert.match(src, /HTTP\/2 301/);
  assert.match(src, /Não 302/);
});

const sitemap = new URL('../dist/sitemap-0.xml', import.meta.url);
const skipSitemap = !existsSync(sitemap);

test('sitemap construído não lista o apex e aponta hreflang en para /en/', { skip: skipSitemap }, () => {
  const xml = readFileSync(sitemap, 'utf8');
  assert.equal(xml.includes('<loc>https://villaarapiuns.com.br/</loc>'), false);
  assert.equal(xml.includes('<loc>https://villaarapiuns.com.br/en/</loc>'), true);
  assert.equal(xml.includes('href="https://villaarapiuns.com.br/"'), false);
});

const fallback = new URL('../dist/index.html', import.meta.url);
const skipFallback = !existsSync(fallback);

test('fallback SSG da raiz é noindex e aponta para /en/, sem sniff de idioma', { skip: skipFallback }, () => {
  const html = readFileSync(fallback, 'utf8');
  assert.match(html, /noindex/);
  assert.match(html, /\/en\//);
  assert.equal(html.includes('navigator.languages'), false);
});
