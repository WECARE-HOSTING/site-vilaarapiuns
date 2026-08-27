// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { caminhosNoindex } from './src/i18n/routes.ts';
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
    // O site final é inglês-first para o visitante estrangeiro.
    // A CONSTRUÇÃO, porém, começa em português (ver plano, Fase 2).
    defaultLocale: 'en',
    locales: ['en', 'pt', 'es', 'de', 'ja'],
    routing: {
      prefixDefaultLocale: true,
      // Escrevemos nosso próprio redirect da raiz, que detecta o idioma
      // do navegador em vez de mandar todo mundo para /en/.
      redirectToDefaultLocale: false,
    },
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
      filter: (page) =>
        !page.includes('/styleguide') &&
        !caminhosNoindex().some((c) => page.includes(`/${c}/`)),
      i18n: { defaultLocale: 'en', locales: { en: 'en', pt: 'pt-BR', es: 'es', de: 'de', ja: 'ja' } },
      serialize(item) {
        const data = LASTMOD.get(new URL(item.url).pathname);
        return data ? { ...item, lastmod: data } : item;
      },
    }),
  ],

  vite: { plugins: [tailwindcss()] },
});
