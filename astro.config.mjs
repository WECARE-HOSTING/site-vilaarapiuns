// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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

  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', pt: 'pt-BR', es: 'es', de: 'de', ja: 'ja' } } })],

  vite: { plugins: [tailwindcss()] },
});
