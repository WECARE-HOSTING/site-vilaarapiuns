import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('nginx tem location = / com return 301 /en/', () => {
  const src = readFileSync(new URL('../nginx-root-redirect.conf', import.meta.url), 'utf8');
  assert.match(src, /location = \//);
  assert.match(src, /return 301 \/en\//);
});
