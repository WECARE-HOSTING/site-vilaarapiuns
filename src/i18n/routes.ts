import type { Locale } from './config';

/** Chave interna de cada página. A ordem aqui é a ordem do menu. */
export const PAGE_KEYS = [
  'home',
  'lodge',
  'dining',
  'experiences',
  'packages',
  'privateVilla',
  'reveillon',
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
  /* Página sazonal da virada. O slug EN mira a busca literal ("new years eve
     amazon"); o DE usa a palavra que o alemão de fato digita (Silvester).
     Nasceu fora do menu e entrou nele em 26/08/2026 — ver NAV_KEYS. Tem três
     entradas hoje: a fileira do menu, o destaque na página de Pacotes e a
     coluna Reservar do rodapé. */
  reveillon:    { en: 'new-years-eve', pt: 'reveillon',        es: 'ano-nuevo',      de: 'silvester',      ja: 'new-year' },
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
  // Entrou no menu em 21/08/2026. Era alcançável só pelo rodapé, e é a página
  // que responde a retiro, corporativo, observação de aves e pesca de mergulho —
  // as palavras que um organizador de grupo procura. O rótulo é "Grupos" e não
  // "Villa Privativa" porque a fileira do desktop vai a sete itens; o h1 e o
  // campo de exclusividade já carregam a palavra "privativa" onde ela informa.
  'privateVilla',
  // Entrou no menu em 26/08/2026, a pedido do cliente. É a única chave sazonal
  // da fileira, e fica DEPOIS das duas ofertas perenes (Pacotes e Grupos):
  // as que valem o ano todo vêm primeiro, e a de data fechada fecha o grupo.
  // O rótulo é curto nos cinco idiomas ("Réveillon",
  // "Silvester", "年越し") justamente porque a fileira agora vai a OITO itens —
  // o oitavo é o que aperta entre 1024 e 1280px, e é onde conferir primeiro
  // quando alguém acrescentar o nono.
  'reveillon',
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
