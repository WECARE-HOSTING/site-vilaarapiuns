/**
 * Paridade de dicionário: toda chave de pt.json existe em en/es/de/ja.
 *
 * Prometido pelo comentário de READY_LOCALES em src/i18n/config.ts desde a
 * Fase 6 e nunca escrito. Sem ele, "o dicionário está completo" é opinião —
 * e a Fase 6 já mostrou o custo: quatro idiomas foram ao ar renderizando
 * português com <html lang> errado porque ninguém tinha como conferir.
 *
 * Array não é uma chave opaca: os itens são objetos com campos próprios
 * (ex.: a legenda de cada foto em galeria.capitulos), e um item sem
 * tradução é exatamente o tipo de falha silenciosa que esta ferramenta
 * existe para pegar. achata() desce dentro de cada elemento e cada campo
 * vira um caminho comparável (galeria.capitulos.0.fotos.2.leg). O
 * comprimento da lista continua checado à parte: useList() devolve a
 * lista inteira, então lista curta é conteúdo faltando — e quando o
 * comprimento já diverge, os caminhos por índice sob aquele array
 * divergem em cascata só por causa do desalinhamento (item 0 do pt não é
 * o item 0 do idioma), sem dizer nada de novo. Esses caminhos são
 * omitidos para não afogar o sinal real embaixo de ruído.
 *
 * String vazia ("" ou só espaço) conta como faltando, não como presente:
 * é o mesmo critério de useTranslations() (src/i18n/utils.ts), que trata
 * "" como ausente e cai para DEFAULT_LOCALE. Sem essa regra, um idioma
 * com "whatsapp": "" passava aqui como OK e ainda renderizava português
 * na tela.
 *
 *   npm run i18n:check
 */
import { readFileSync } from 'node:fs';

const BASE = 'pt';
const OUTROS = ['en', 'es', 'de', 'ja'];

function carrega(l) {
  const caminho = `src/i18n/${l}.json`;
  let texto;
  try {
    texto = readFileSync(caminho, 'utf8');
  } catch (e) {
    console.error(`Não consegui ler ${caminho}: ${e.message}`);
    process.exit(1);
  }
  try {
    return JSON.parse(texto);
  } catch (e) {
    console.error(`${caminho} não é um JSON válido: ${e.message}`);
    process.exit(1);
  }
}

/** "" e string só-espaço contam como ausentes — mesmo critério de useTranslations(). */
const vazia = (v) => typeof v === 'string' && v.trim() === '';

/**
 * Achata um dicionário em dois mapas indexados por caminho ("a.b.0.c"):
 *   folhas   — o valor de cada folha (string/número/bool/null/objeto
 *              vazio), usado para presença e para a checagem de vazio;
 *   tamanhos — o comprimento de cada array, checado separadamente do
 *              conteúdo dos elementos.
 * Array desce nos próprios elementos (cada índice ganha um caminho, e
 * dentro dele os campos descem de novo) em vez de parar no comprimento —
 * senão um item sem tradução dentro de uma lista fica invisível.
 * Objeto vazio ({}) entra em folhas pelo próprio caminho: sem isso, descer
 * nele não gera nenhum filho e a chave desaparece da comparação inteira,
 * sem nunca ser sinalizada como faltando nem como presente.
 */
function achata(valor, caminho = '', folhas = new Map(), tamanhos = new Map()) {
  if (Array.isArray(valor)) {
    tamanhos.set(caminho, valor.length);
    folhas.set(caminho, null); // marca a presença do array; o conteúdo é checado por elemento
    valor.forEach((item, i) => achata(item, `${caminho}.${i}`, folhas, tamanhos));
    return { folhas, tamanhos };
  }
  if (valor && typeof valor === 'object') {
    const chaves = Object.keys(valor);
    if (chaves.length === 0) folhas.set(caminho, valor);
    for (const k of chaves) achata(valor[k], caminho ? `${caminho}.${k}` : k, folhas, tamanhos);
    return { folhas, tamanhos };
  }
  folhas.set(caminho, valor);
  return { folhas, tamanhos };
}

const { folhas: base, tamanhos: baseTam } = achata(carrega(BASE));
let falhou = false;

for (const l of OUTROS) {
  const { folhas: dele, tamanhos: deleTam } = achata(carrega(l));

  // Tamanho de array errado é resolvido antes de tudo: uma vez que um
  // array diverge, qualquer array aninhado dentro dele também vai "dar
  // diferente" só por reflexo do desalinhamento de índice — não é um
  // problema novo, é o mesmo problema visto de outro caminho. Mantém só
  // a divergência mais externa de cada ramo.
  const candidatos = [...baseTam.entries()]
    .filter(([k, n]) => deleTam.get(k) !== n)
    .sort((a, b) => a[0].split('.').length - b[0].split('.').length);
  const listaCurta = [];
  for (const par of candidatos) {
    const [k] = par;
    if (!listaCurta.some(([p]) => k.startsWith(`${p}.`))) listaCurta.push(par);
  }
  const raizesCurtas = listaCurta.map(([k]) => k);
  const sobArrayCurto = (k) => raizesCurtas.some((p) => k === p || k.startsWith(`${p}.`));

  // Caminhos por índice sob um array já reportado em listaCurta são
  // ruído (ver comentário acima) — omitidos daqui, não do próprio erro
  // de tamanho.
  const faltando = [...base.keys()].filter((k) => {
    if (sobArrayCurto(k)) return false;
    return !dele.has(k) || vazia(dele.get(k));
  });
  const sobrando = [...dele.keys()].filter((k) => !base.has(k));

  if (faltando.length) {
    falhou = true;
    console.error(`\n${l}.json — ${faltando.length} chave(s) faltando contra ${BASE}:`);
    for (const k of faltando) console.error(`  · ${k}`);
  }
  if (listaCurta.length) {
    falhou = true;
    console.error(`\n${l}.json — lista com tamanho diferente do ${BASE}:`);
    for (const [k, n] of listaCurta) {
      const tamDele = deleTam.has(k) ? deleTam.get(k) : 'ausente';
      console.error(`  · ${k}: ${BASE} tem ${n}, ${l} tem ${tamDele}`);
    }
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
