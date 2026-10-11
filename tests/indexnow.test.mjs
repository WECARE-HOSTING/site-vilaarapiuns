import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { KEY, KEY_LOCATION, HOST } from '../tools/indexnow-ping.mjs';

test('a chave do IndexNow tem o formato do protocolo (8–128 de [a-zA-Z0-9-])', () => {
  assert.match(KEY, /^[a-zA-Z0-9-]{8,128}$/);
});

test('public/<KEY>.txt existe e contém exatamente a chave', () => {
  const arq = new URL(`../public/${KEY}.txt`, import.meta.url);
  assert.ok(existsSync(arq), `falta public/${KEY}.txt`);
  assert.equal(readFileSync(arq, 'utf8').trim(), KEY);
});

test('keyLocation aponta para a raiz do domínio de produção', () => {
  assert.equal(KEY_LOCATION, `https://${HOST}/${KEY}.txt`);
});
