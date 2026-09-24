// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { reescreveApexDoSitemap, urlEntraNoSitemap } from './src/i18n/routes.ts';
import { ROOT_LOCALE } from './src/i18n/config.ts';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * LASTMOD DO DIÁRIO — só onde existe data de verdade.
 *
 * O ping de sitemap morreu em 2023 e o `lastmod` é o sinal de frescor que
 * sobrou. Mas ele só vale se for verdadeiro: pôr a hora do build em todas as
 * 66 URLs anunciaria que o site inteiro mudou a cada deploy, o que é ruído e
 * não sinal — e é pior que a ausência, porque ausência não mente.
 *
 * As onze páginas do site não têm data de conteúdo em lugar nenhum, então
 * seguem SEM lastmod, de propósito. Os posts têm: `data` e `revisado` no
 * frontmatter, e o próprio schema da coleção já registra por quê ("Data da
 * última revisão de fato. Frescor conta para busca com IA"). É esse par que
 * este mapa lê.
 *
 * Lê o frontmatter com regex em vez de `astro:content` porque isto roda na
 * config, antes de a coleção existir. Só precisa de quatro campos de linha
 * única; se o formato do frontmatter mudar, o mapa fica vazio e as URLs
 * perdem o lastmod — degrada para o estado anterior, não quebra o build.
 */
function lastmodDoDiario() {
  const hoje = new Date().toISOString().slice(0, 10);
  const mapa = new Map();
  const base = './src/content/diario';
  let arquivos;
  try {
    arquivos = readdirSync(base).filter((f) => f.endsWith('.md'));
  } catch {
    return mapa;
  }
  for (const f of arquivos) {
    const txt = readFileSync(`${base}/${f}`, 'utf-8');
    const campo = (k) => txt.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '');
    const locale = campo('locale');
    const slug = campo('slug');
    const data = campo('revisado') ?? campo('data');
    if (!locale || !slug || !data) continue;
    /**
     * NUNCA emitir data futura. Quatro posts estão hoje no ar com `data` em
     * agosto adiante da data corrente — agendamento ou engano, é decisão
     * editorial e não deste arquivo. O que este arquivo não faz é propagar:
     * lastmod no futuro é sinal inválido, e um crawler que o vê tende a
     * ignorar o campo inteiro no domínio.
     */
    mapa.set(`/${locale}/diario/${slug}/`, data > hoje ? hoje : data);
  }
  return mapa;
}

const LASTMOD = lastmodDoDiario();

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
        const data = LASTMOD.get(new URL(reescrito.url).pathname);
        return data ? { ...reescrito, lastmod: data } : reescrito;
      },
    }),
  ],

  vite: { plugins: [tailwindcss()] },
});
