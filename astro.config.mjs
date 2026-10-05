// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { reescreveApexDoSitemap, urlEntraNoSitemap, SLUGS, href } from './src/i18n/routes.ts';
import { ROOT_LOCALE, LOCALES, HTML_LANG } from './src/i18n/config.ts';
import { readdirSync, readFileSync } from 'node:fs';
import { lastmodDoSitemap } from './tools/lastmod.mjs';

/**
 * LASTMOD — data real da última mudança de conteúdo de cada URL, pelo git
 * (com fallback para o manifesto versionado e, por último, o frontmatter).
 * A regra e o porquê estão em tools/lastmod.mjs.
 */
const { origem: ORIGEM_LASTMOD, mapa: LASTMOD } = lastmodDoSitemap(SLUGS);
console.log(`[lastmod] ${LASTMOD.size} URLs com data, origem: ${ORIGEM_LASTMOD}`);

/**
 * HREFLANG DO SITEMAP — o mesmo cluster que o <head> da página anuncia.
 *
 * O i18n do @astrojs/sitemap agrupa as versões de idioma pelo caminho
 * IDÊNTICO depois do prefixo. Funciona para /en/lodge/ ↔ /de/lodge/, mas
 * erra em tudo o que tem slug traduzido: /pt/pousada/ ficava fora do
 * cluster de /en/lodge/, /pt/galeria/ só via /es/galeria/, os posts do
 * diário (slug diferente em cada idioma) saíam sem alternativa nenhuma,
 * e nenhum cluster trazia x-default. O Search Console via então dois
 * conjuntos de hreflang divergentes para a mesma página (sitemap × HTML).
 *
 * Este mapa monta os clusters a partir das MESMAS fontes do BaseLayout:
 * SLUGS (routes.ts) para as páginas, `grupo` do frontmatter para os posts,
 * e os idiomas com post para o índice do diário. x-default = ROOT_LOCALE
 * quando existe, senão a primeira versão — a mesma regra do BaseLayout.
 */
function clustersHreflang() {
  const mapa = new Map();
  const registra = (versoes) => {
    if (versoes.length === 0) return;
    const xd = versoes.find((v) => v.locale === ROOT_LOCALE) ?? versoes[0];
    const links = [
      ...versoes.map((v) => ({ lang: HTML_LANG[v.locale], url: new URL(v.caminho, 'https://villaarapiuns.com.br').href })),
      { lang: 'x-default', url: new URL(xd.caminho, 'https://villaarapiuns.com.br').href },
    ];
    for (const v of versoes) mapa.set(v.caminho, links);
  };
  for (const key of Object.keys(SLUGS)) {
    registra(LOCALES.map((l) => ({ locale: l, caminho: href(l, key) })));
  }
  const grupos = new Map();
  const idiomasComPost = new Set();
  let arquivos = [];
  try {
    arquivos = readdirSync('./src/content/diario').filter((f) => f.endsWith('.md'));
  } catch {
    /* sem diário: só as páginas */
  }
  for (const f of arquivos) {
    const txt = readFileSync(`./src/content/diario/${f}`, 'utf-8');
    const campo = (k) => txt.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '');
    if (campo('rascunho') === 'true') continue;
    const locale = campo('locale');
    const slug = campo('slug');
    const grupo = campo('grupo');
    if (!locale || !slug || !grupo) continue;
    idiomasComPost.add(locale);
    if (!grupos.has(grupo)) grupos.set(grupo, []);
    grupos.get(grupo).push({ locale, caminho: `/${locale}/diario/${slug}/` });
  }
  for (const versoes of grupos.values()) registra(versoes);
  registra(LOCALES.filter((l) => idiomasComPost.has(l)).map((l) => ({ locale: l, caminho: `/${l}/diario/` })));
  return mapa;
}

const HREFLANG = clustersHreflang();

export default defineConfig({
  site: 'https://villaarapiuns.com.br',
  trailingSlash: 'always',

  i18n: {
    // Inglês continua o defaultLocale do Astro, prefixado. O mercado
    // principal é o Brasil: a raiz `/` vai para ROOT_LOCALE (`/pt/`),
    // não para este defaultLocale. Ver `redirects` abaixo.
    defaultLocale: 'en',
    locales: ['en', 'pt', 'es', 'de', 'ja'],
    routing: {
      prefixDefaultLocale: true,
      // Caminho sem prefixo cai em /en/. A raiz é exceção e vai para /pt/.
      // 200 + meta refresh na raiz fazia o Search Console ver canonical
      // mismatch (a página declara um idioma, o Google às vezes fica no apex).
      redirectToDefaultLocale: true,
    },
  },

  // SSG emite HTML de fallback (200 + meta refresh para /pt/). `astro dev`
  // honra o status 301 abaixo. No ar, quem responde `GET /` é o nginx:
  // bloco inline desde 24/09/2026 18:12 BRT. Depois do deploy dá para
  // voltar ao include de nginx-root-redirect.conf. Runbook:
  // docs/redirect-raiz.md.
  redirects: {
    '/': { status: 301, destination: `/${ROOT_LOCALE}/` },
  },

  integrations: [
    // React é só para o carrossel de fotos das acomodações
    // (`CarrosselAcomodacoes.tsx`), montado em duas páginas — Home
    // (`client:visible`) e Pousada (`client:load`). Nada mais da árvore
    // hidrata.
    react(),
    sitemap({
      // '/styleguide' é a página interna de aprovação de design; os caminhos
      // noindex vêm de NOINDEX_KEYS, uma fonte só para os cinco idiomas.
      filter: (page) => urlEntraNoSitemap(page),
      // O defaultLocale do plugin é o inglês, o mesmo de DEFAULT_LOCALE e
      // não ROOT_LOCALE: reescreveApexDoSitemap devolve o apex para `/en/`.
      i18n: { defaultLocale: 'en', locales: { en: 'en', pt: 'pt-BR', es: 'es', de: 'de', ja: 'ja' } },
      serialize(item) {
        const reescrito = reescreveApexDoSitemap(item);
        const caminho = new URL(reescrito.url).pathname;
        const links = HREFLANG.get(caminho) ?? reescrito.links;
        const data = LASTMOD.get(caminho);
        return { ...reescrito, links, ...(data ? { lastmod: data } : {}) };
      },
    }),
  ],

  vite: { plugins: [tailwindcss()] },
});
