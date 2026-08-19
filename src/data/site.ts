/**
 * Fonte única de dados operacionais do site.
 * Tudo que o cliente precisa atualizar sem mexer em layout mora aqui.
 *
 * Itens marcados PENDENTE aguardam informação do cliente (ver plano).
 */

export const SITE = {
  name: 'Villa Arapiuns',
  domain: 'https://vilaarapiuns.com.br',

  /** PENDENTE: ano exato de fundação. O texto usa "5+ anos" até chegar. */
  yearFounded: null as number | null,
  yearsOperating: '5+',

  capacity: {
    cabins: 13,
    maxGuests: 26,
    minGuestsPrivate: 10,
  },

  location: {
    river: 'Rio Arapiuns',
    city: 'Santarém',
    state: 'PA',
    country: 'BR',
    departsFrom: 'Alter do Chão',
    boatMinutes: 90,
  },

  contact: {
    whatsapp: '5511969760096',
    /** PENDENTE: e-mail de destino do formulário de reserva. */
    email: null as string | null,
    instagram: null as string | null,
  },

  /**
   * PENDENTE: valores reais. Exibidos como "a partir de".
   * Deixe em null para o site mostrar "sob consulta" em vez de um número falso.
   */
  prices: {
    currency: 'BRL',
    package1Night: null as number | null,
    package2Nights: null as number | null,
    privateVilla: null as number | null,
  },

  /** PENDENTE: nota e nº de avaliações, para o JSON-LD e o selo de confiança. */
  reviews: {
    googleUrl: null as string | null,
    tripadvisorUrl: null as string | null,
    rating: null as number | null,
    count: null as number | null,
  },
} as const;

/** Atividades opcionais pagas diretamente às comunidades ribeirinhas. */
export const COMMUNITY_ACTIVITIES = [
  { key: 'massage',     priceBRL: 150, community: 'Comunidade' },
  { key: 'weaving',     priceBRL: 20,  community: 'Comunidade' },
  { key: 'farinhada',   priceBRL: 70,  community: 'Comunidade' },
  { key: 'trailSmall',  priceBRL: 30,  community: 'Atodi' },
  { key: 'trailLarge',  priceBRL: 50,  community: 'Atodi' },
  { key: 'coroca',      priceBRL: 30,  community: 'Coroca' },
] as const;

/** Monta um link de WhatsApp com mensagem já preenchida. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${SITE.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
