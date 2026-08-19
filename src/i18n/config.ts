export const LOCALES = ['en', 'pt', 'es', 'de', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Idioma em que estamos construindo e revisando o site agora.
 * Enquanto for 'pt', TODOS os prefixos renderizam em português — é assim que
 * o cliente revisa o conteúdo no idioma dele (plano, Fases 1–5).
 * Na Fase 6 isto passa a ser DEFAULT_LOCALE e cada idioma usa o seu dicionário.
 */
export const BUILD_LOCALE: Locale = 'pt';

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
  de: 'Deutsch',
  ja: '日本語',
};

/** Usado em <html lang> e nas tags hreflang. */
export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  pt: 'pt-BR',
  es: 'es',
  de: 'de',
  ja: 'ja',
};
