/**
 * Paridade de dicionário: toda chave de pt.json existe em en/es/de/ja.
 *
 * Prometido pelo comentário de READY_LOCALES em src/i18n/config.ts desde a
 * Fase 6 e nunca escrito. Sem ele, "o dicionário está completo" é opinião —
 * e a Fase 6 já mostrou o custo: quatro idiomas foram ao ar renderizando
 * português com <html lang> errado porque ninguém tinha como conferir.
 *
 * Array conta como UMA chave, mas comprimento diferente é erro: useList()
 * devolve a lista inteira, então lista curta é conteúdo faltando.
 *
 *   npm run i18n:check
 */
import { readFileSync } from 'node:fs';

const BASE = 'pt';
const OUTROS = ['en', 'es', 'de', 'ja'];

const carrega = (l) => JSON.parse(readFileSync(`src/i18n/${l}.json`, 'utf8'));

/** Achata {a:{b:'x'}} em ['a.b']. */
function achata(obj, prefixo = '', saida = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const caminho = prefixo ? `${prefixo}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) achata(v, caminho, saida);
    else saida.set(caminho, Array.isArray(v) ? v.length : null);
  }
  return saida;
}

const base = achata(carrega(BASE));
let falhou = false;

for (const l of OUTROS) {
  const dele = achata(carrega(l));
  const faltando = [...base.keys()].filter((k) => !dele.has(k));
  const sobrando = [...dele.keys()].filter((k) => !base.has(k));
  const listaCurta = [...base.entries()].filter(
    ([k, n]) => n !== null && dele.has(k) && dele.get(k) !== n
  );

  if (faltando.length) {
    falhou = true;
    console.error(`\n${l}.json — ${faltando.length} chave(s) faltando contra ${BASE}:`);
    for (const k of faltando) console.error(`  · ${k}`);
  }
  if (listaCurta.length) {
    falhou = true;
    console.error(`\n${l}.json — lista com tamanho diferente do ${BASE}:`);
    for (const [k, n] of listaCurta) console.error(`  · ${k}: ${BASE} tem ${n}, ${l} tem ${dele.get(k)}`);
  }
  if (sobrando.length) {
    console.warn(`\n${l}.json — ${sobrando.length} chave(s) que o ${BASE} não tem (órfã?):`);
    for (const k of sobrando) console.warn(`  · ${k}`);
  }
}

if (falhou) {
  console.error('\nFALHOU. READY_LOCALES em src/i18n/config.ts só admite idioma com dicionário completo.');
  process.exit(1);
}
console.log(`OK — ${base.size} chaves, paridade completa em ${OUTROS.join(', ')}.`);
