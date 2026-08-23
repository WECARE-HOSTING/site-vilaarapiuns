// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { caminhosNoindex } from './src/i18n/routes.ts';

export default defineConfig({
  site: 'https://vilaarapiuns.com.br',
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
    }),
  ],

  vite: { plugins: [tailwindcss()] },
});
