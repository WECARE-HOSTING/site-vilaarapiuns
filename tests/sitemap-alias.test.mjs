import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).sort();

test('robots.txt continua anunciando o sitemap-index.xml, não o alias', () => {
  const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /^Sitemap: https:\/\/villaarapiuns\.com\.br\/sitemap-index\.xml$/m);
  assert.equal(/^Sitemap: .*\/sitemap\.xml$/m.test(robots), false);
});

test('public/sitemap.xml é um sitemapindex que aponta para sitemaps do próprio domínio', () => {
  const alias = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  assert.match(alias, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const lista = locs(alias);
  assert.ok(lista.length > 0);
  for (const l of lista) assert.match(l, /^https:\/\/villaarapiuns\.com\.br\/sitemap-\d+\.xml$/);
});

const indice = new URL('../dist/sitemap-index.xml', import.meta.url);
test('alias lista os mesmos sitemaps que o sitemap-index.xml do build', { skip: !existsSync(indice) && 'rode npm run build antes' }, () => {
  const alias = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  assert.deepEqual(locs(alias), locs(readFileSync(indice, 'utf8')));
});
