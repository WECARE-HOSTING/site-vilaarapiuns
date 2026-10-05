/**
 * LASTMOD REAL DO SITEMAP — a data em que o CONTEÚDO de cada URL mudou.
 *
 * Antes daqui só os posts do diário tinham lastmod, lido do frontmatter
 * (`revisado` ?? `data`). Resultado: em outubro o sitemap inteiro ainda
 * dizia 26–31/08, mesmo depois da troca de títulos de 01/10 (PR #26), e as
 * páginas do site saíam sem data nenhuma. O lastmod é o único sinal de
 * frescor que sobrou depois do fim do ping de sitemap; parado, ele não
 * ajuda o Google a priorizar o recrawl de quem mudou.
 *
 * A REGRA: lastmod de uma URL = data (America/Sao_Paulo) do último commit
 * na main (`--first-parent`, ou seja, quando entrou no ar) que tocou os
 * arquivos de CONTEÚDO dela. Nunca "hoje" para todo mundo — isso anuncia que
 * o site inteiro mudou a cada deploy, e um crawler que percebe passa a
 * ignorar o campo no domínio.
 *
 *   · post do diário      → o próprio .md em src/content/diario/
 *   · índice do diário    → os .md publicados daquele idioma (o índice lista
 *                           título e descrição de cada um)
 *   · página do site      → o componente em src/content-pages/ + o
 *                           dicionário do idioma (src/i18n/<locale>.json),
 *                           de onde sai todo o texto da página
 *
 * Layout, header, rodapé e CSS ficam de fora de propósito: são moldura, não
 * conteúdo da URL, e entrar com eles faria qualquer ajuste de botão mudar a
 * data das 100 URLs.
 *
 * Arquivo com alteração ainda não commitada conta como alterado HOJE (é o
 * caso do build local antes do commit).
 *
 * SEM HISTÓRICO GIT. Se o build rodar num clone raso (`--depth 1`) ou sem
 * git, a data de todo arquivo seria a do último commit — o "sempre hoje"
 * disfarçado. Nesse caso a config lê `src/data/lastmod.json`, o mesmo mapa
 * gerado por `npm run lastmod:gera` num clone com histórico completo e
 * versionado junto. Sem nenhum dos dois, cai no frontmatter do diário
 * (o comportamento anterior). Degrada; não mente.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const MANIFESTO = 'src/data/lastmod.json';
const DIARIO = 'src/content/diario';
const LOCALES = ['en', 'pt', 'es', 'de', 'ja'];

/** Componente de conteúdo de cada página. Espelha PAGINAS em PageRenderer.astro. */
export const COMPONENTE_DA_PAGINA = {
  home: 'Home',
  lodge: 'Pousada',
  dining: 'Mesa',
  experiences: 'Experiencias',
  packages: 'Pacotes',
  privateVilla: 'Privativa',
  reveillon: 'Reveillon',
  gettingHere: 'Chegar',
  gallery: 'Galeria',
  reviews: 'Avaliacoes',
  book: 'Reservar',
  bookSent: 'Enviado',
};

function dataSP(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function git(args) {
  return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

/** Histórico completo disponível? Clone raso ou sem git → false. */
export function temHistoricoGit() {
  try {
    return git(['rev-parse', '--is-shallow-repository']) === 'false';
  } catch {
    return false;
  }
}

function campo(txt, k) {
  return txt.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '');
}

/** Os posts publicados: { arquivo, locale, caminho }. */
function postsDoDiario() {
  let arquivos = [];
  try {
    arquivos = readdirSync(`${RAIZ}${DIARIO}`).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
  return arquivos.flatMap((f) => {
    const txt = readFileSync(`${RAIZ}${DIARIO}/${f}`, 'utf-8');
    if (campo(txt, 'rascunho') === 'true') return [];
    const locale = campo(txt, 'locale');
    const slug = campo(txt, 'slug');
    if (!locale || !slug) return [];
    return [{ arquivo: `${DIARIO}/${f}`, locale, caminho: `/${locale}/diario/${slug}/`, txt }];
  });
}

/** URL → arquivos de conteúdo. `slugs` é o SLUGS de routes.ts. */
export function fontesPorCaminho(slugs) {
  const mapa = new Map();
  for (const [key, porLocale] of Object.entries(slugs)) {
    const comp = COMPONENTE_DA_PAGINA[key];
    if (!comp) continue;
    for (const l of LOCALES) {
      const caminho = porLocale[l] ? `/${l}/${porLocale[l]}/` : `/${l}/`;
      mapa.set(caminho, [`src/content-pages/${comp}.astro`, `src/i18n/${l}.json`]);
    }
  }
  const posts = postsDoDiario();
  for (const p of posts) mapa.set(p.caminho, [p.arquivo]);
  for (const l of LOCALES) {
    const doIdioma = posts.filter((p) => p.locale === l).map((p) => p.arquivo);
    if (doIdioma.length) mapa.set(`/${l}/diario/`, doIdioma);
  }
  return mapa;
}

/** Datas pelo git. Só chamar com temHistoricoGit() verdadeiro. */
export function lastmodPeloGit(slugs) {
  const hoje = dataSP(new Date());
  const sujos = new Set(
    git(['status', '--porcelain', '--untracked-files=all'])
      .split('\n')
      .filter(Boolean)
      .map((l) => l.slice(3).trim()),
  );
  const cache = new Map();
  const dataDoArquivo = (f) => {
    if (cache.has(f)) return cache.get(f);
    let d = null;
    if (sujos.has(f)) d = hoje;
    else {
      const ts = git(['log', '-1', '--first-parent', '--format=%ct', '--', f]);
      if (ts) d = dataSP(new Date(Number(ts) * 1000));
    }
    cache.set(f, d);
    return d;
  };
  const mapa = new Map();
  for (const [caminho, fontes] of fontesPorCaminho(slugs)) {
    const datas = fontes.map(dataDoArquivo).filter(Boolean).sort();
    if (datas.length) mapa.set(caminho, datas[datas.length - 1]);
  }
  return mapa;
}

/** Fallback sem git: o frontmatter do diário, nunca no futuro. */
function lastmodDoFrontmatter() {
  const hoje = dataSP(new Date());
  const mapa = new Map();
  for (const p of postsDoDiario()) {
    const d = campo(p.txt, 'revisado') ?? campo(p.txt, 'data');
    if (d) mapa.set(p.caminho, d > hoje ? hoje : d);
  }
  return mapa;
}

/** O mapa que a config usa: git → manifesto versionado → frontmatter. */
export function lastmodDoSitemap(slugs) {
  if (temHistoricoGit()) {
    try {
      return { origem: 'git', mapa: lastmodPeloGit(slugs) };
    } catch {
      /* git quebrado: segue para o manifesto */
    }
  }
  if (existsSync(`${RAIZ}${MANIFESTO}`)) {
    const obj = JSON.parse(readFileSync(`${RAIZ}${MANIFESTO}`, 'utf-8'));
    return { origem: 'manifesto', mapa: new Map(Object.entries(obj)) };
  }
  return { origem: 'frontmatter', mapa: lastmodDoFrontmatter() };
}

/** `npm run lastmod:gera` — regrava o manifesto. Recusa clone raso. */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!temHistoricoGit()) {
    console.error('Sem histórico git completo (clone raso?). Rode `git fetch --unshallow` antes.');
    process.exit(1);
  }
  const { SLUGS } = await import('../src/i18n/routes.ts');
  const obj = Object.fromEntries([...lastmodPeloGit(SLUGS)].sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(`${RAIZ}${MANIFESTO}`, `${JSON.stringify(obj, null, 2)}\n`);
  console.log(`${MANIFESTO}: ${Object.keys(obj).length} URLs`);
}
