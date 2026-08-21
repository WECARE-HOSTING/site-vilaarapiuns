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
 * comprimento da lista continua checado à parte: lista curta é conteúdo
 * faltando — e quando o comprimento já diverge, só os índices que ficam
 * a partir do menor dos dois comprimentos deixam de ter par do outro
 * lado (esses sim divergem em cascata só por desalinhamento, sem dizer
 * nada de novo). Índices dentro do alcance comum — de 0 até o menor
 * comprimento — existem nos dois arquivos e continuam comparados e
 * reportados normalmente: um item nessa faixa pode estar genuinamente
 * vazio, e isso é um bug de conteúdo diferente do bug de tamanho.
 *
 * String vazia ("" ou só espaço) conta como faltando, não como presente.
 * Isso é mais estrito que useTranslations() (src/i18n/utils.ts), que
 * checa só value.length > 0: lá, um valor "   " (só espaço) passa como
 * presente e é renderizado como está — em branco na tela — em vez de
 * cair para DEFAULT_LOCALE. Esta ferramenta prefere pegar mais casos,
 * não menos, então trata esse valor como ausente mesmo que o app em
 * produção não o rejeite.
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

/** "" e string só-espaço contam como ausentes — mais estrito que useTranslations() (ver comentário no topo do arquivo). */
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

  // Tamanho de array errado é resolvido antes de tudo. Um array que
  // diverge empurra um índice pra fora do alcance comum (0 até o menor
  // dos dois comprimentos); um array aninhado DENTRO desse índice fora
  // de alcance vai "dar diferente" só por reflexo do desalinhamento —
  // não é um problema novo, é o mesmo problema visto de outro caminho, e
  // por isso é descartado aqui. Mas um array aninhado dentro de um
  // índice que ainda está no alcance comum (o item existe dos dois
  // lados) é um problema independente — pode ser, por exemplo, uma
  // galeria com uma foto a mais ou a menos num capítulo que por si só
  // está alinhado — e por isso ganha sua própria linha e seu próprio
  // alcance, em vez de ser engolido pelo ancestral.
  const candidatos = [...baseTam.entries()]
    .filter(([k, n]) => deleTam.get(k) !== n)
    .sort((a, b) => a[0].split('.').length - b[0].split('.').length);
  const listaCurta = [];
  for (const [k, n] of candidatos) {
    const emCascata = listaCurta.some(([p, , alcance]) => {
      if (!k.startsWith(`${p}.`)) return false;
      const indice = Number(k.slice(p.length + 1).split('.')[0]);
      return indice >= alcance;
    });
    if (emCascata) continue;
    const m = deleTam.has(k) ? deleTam.get(k) : 0;
    listaCurta.push([k, n, Math.min(n, m)]);
  }

  // Só o índice fora do alcance comum é ruído (ver comentário acima). Um
  // array com pt=3 e idioma=2 tem os índices 0 e 1 presentes dos dois
  // lados — item ali pode estar genuinamente vazio, e isso é um bug de
  // conteúdo, não um reflexo do tamanho errado. Só o índice 2 (que só
  // existe no pt) não tem par para comparar; suprimir SÓ esse é o que
  // evita o ruído sem esconder o resto. Idioma sem a chave do array vira
  // comprimento 0 — mesmo efeito de antes: tudo embaixo fica sem par e é
  // todo omitido. A mesma regra vale para "sobrando" (usada mais abaixo):
  // sem ela, um array encurtado faz cada índice que sobra do lado maior
  // reaparecer como chave "órfã" só por ter mudado de posição — nenhuma
  // delas é uma chave nova de verdade, e isso enterra qualquer órfã real
  // no meio da onda.
  const sobArrayCurto = (k) => {
    for (const [p, , alcance] of listaCurta) {
      if (k === p) return true;
      if (k.startsWith(`${p}.`) && Number(k.slice(p.length + 1).split('.')[0]) >= alcance) return true;
    }
    return false;
  };
  const faltando = [...base.keys()].filter((k) => {
    if (sobArrayCurto(k)) return false;
    return !dele.has(k) || vazia(dele.get(k));
  });
  const sobrando = [...dele.keys()].filter((k) => !base.has(k) && !sobArrayCurto(k));

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
