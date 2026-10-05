import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { PAGE_KEYS, SLUGS } from '../src/i18n/routes.ts';
import { COMPONENTE_DA_PAGINA, fontesPorCaminho } from '../tools/lastmod.mjs';

test('lastmod: toda PageKey tem componente de conteúdo, e o arquivo existe', () => {
  for (const k of PAGE_KEYS) {
    const comp = COMPONENTE_DA_PAGINA[k];
    assert.ok(comp, `PageKey "${k}" sem componente em COMPONENTE_DA_PAGINA`);
    assert.ok(existsSync(`src/content-pages/${comp}.astro`), `src/content-pages/${comp}.astro não existe`);
  }
});

test('lastmod: as fontes de cada URL existem (nenhuma data sai de arquivo fantasma)', () => {
  for (const [caminho, fontes] of fontesPorCaminho(SLUGS)) {
    assert.ok(fontes.length > 0, `${caminho} sem fonte`);
    for (const f of fontes) assert.ok(existsSync(f), `${caminho}: ${f} não existe`);
  }
});

test('lastmod: manifesto versionado cobre as mesmas URLs e só tem datas válidas, nunca no futuro', () => {
  const manifesto = JSON.parse(readFileSync('src/data/lastmod.json', 'utf-8'));
  const hoje = new Date().toISOString().slice(0, 10);
  for (const caminho of fontesPorCaminho(SLUGS).keys()) {
    assert.match(manifesto[caminho] ?? '', /^\d{4}-\d{2}-\d{2}$/, `${caminho} fora do manifesto`);
  }
  for (const d of Object.values(manifesto)) assert.ok(d <= hoje, `data futura no manifesto: ${d}`);
});
