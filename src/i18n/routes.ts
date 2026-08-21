import type { Locale } from './config';

/** Chave interna de cada página. A ordem aqui é a ordem do menu. */
export const PAGE_KEYS = [
  'home',
  'lodge',
  'dining',
  'experiences',
  'packages',
  'privateVilla',
  'gettingHere',
  'gallery',
  'reviews',
  'book',
  'bookSent',
] as const;

export type PageKey = (typeof PAGE_KEYS)[number];

/**
 * Slug de cada página em cada idioma. Fonte única — mudar aqui muda a URL,
 * o menu, o seletor de idioma e o hreflang de uma vez só.
 */
export const SLUGS: Record<PageKey, Record<Locale, string>> = {
  home:         { en: '',              pt: '',                 es: '',               de: '',               ja: '' },
  lodge:        { en: 'lodge',         pt: 'pousada',          es: 'posada',         de: 'lodge',          ja: 'lodge' },
  dining:       { en: 'dining',        pt: 'gastronomia',      es: 'gastronomia',    de: 'kulinarik',      ja: 'dining' },
  experiences:  { en: 'experiences',   pt: 'experiencias',     es: 'experiencias',   de: 'erlebnisse',     ja: 'experiences' },
  packages:     { en: 'packages',      pt: 'pacotes',          es: 'paquetes',       de: 'pakete',         ja: 'packages' },
  privateVilla: { en: 'private-villa', pt: 'villa-privativa',  es: 'villa-privada',  de: 'private-villa',  ja: 'private-villa' },
  gettingHere:  { en: 'getting-here',  pt: 'como-chegar',      es: 'como-llegar',    de: 'anreise',        ja: 'access' },
  gallery:      { en: 'gallery',       pt: 'galeria',          es: 'galeria',        de: 'galerie',        ja: 'gallery' },
  reviews:      { en: 'reviews',       pt: 'avaliacoes',       es: 'opiniones',      de: 'bewertungen',    ja: 'reviews' },
  book:         { en: 'book',          pt: 'reservar',         es: 'reservar',       de: 'buchen',         ja: 'book' },
  bookSent:     { en: 'book/sent',     pt: 'reservar/enviado', es: 'reservar/enviado', de: 'buchen/gesendet', ja: 'book/sent' },
};

/** Páginas que aparecem no menu principal. As demais são alcançadas por CTA. */
export const NAV_KEYS: PageKey[] = [
  'lodge',
  'dining',
  'experiences',
  'packages',
  'gettingHere',
  'gallery',
];

/**
 * Páginas que existem para o visitante mas não para o índice de busca.
 *
 * Fonte única: o `<meta robots>` do BaseLayout e o filtro do sitemap em
 * astro.config.mjs leem daqui. Antes desta constante o filtro era a string
 * '/styleguide' escrita à mão na config — o que funciona até a segunda
 * página noindex, que em cinco idiomas são cinco strings soltas para
 * alguém esquecer.
 */
export const NOINDEX_KEYS: readonly PageKey[] = ['bookSent'];

/** Os caminhos noindex em todos os idiomas, para o filtro do sitemap. */
export function caminhosNoindex(): string[] {
  return NOINDEX_KEYS.flatMap((k) => Object.values(SLUGS[k]));
}

/** Monta a URL final de uma página num idioma: /pt/pacotes/ */
export function href(locale: Locale, key: PageKey): string {
  const slug = SLUGS[key][locale];
  return slug ? `/${locale}/${slug}/` : `/${locale}/`;
}
