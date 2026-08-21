/**
 * Fonte única de dados operacionais do site.
 * Tudo que o cliente precisa atualizar sem mexer em layout mora aqui.
 *
 * Itens marcados PENDENTE aguardam informação do cliente (ver plano).
 */

import { HTML_LANG, type Locale } from '@/i18n/config';

export const SITE = {
  name: 'Villa Arapiuns',
  domain: 'https://vilaarapiuns.com.br',

  /**
   * DECISÃO ABERTA — ver PRODUCT.md. Não preencher sem confirmação.
   * O antigo `yearsOperating: '5+'` foi removido junto com a alegação
   * "5+ anos, zero incidentes": não havia dado por trás dela, e o site
   * anterior dizia "4 anos". Nada de tempo de operação ou de histórico
   * de segurança volta ao site sem número confirmado.
   */
  yearFounded: null as number | null,

  capacity: {
    /** O panfleto e a tabela comercial dizem "bangalôs", não "cabanas". */
    cabins: 13,
    maxGuests: 26,
    /**
     * CORRIGIDO a partir de "Plano tarifário para agências" (2026), que diz
     * "direito de exclusividade acima de 15 pessoas". Este campo dizia 10.
     */
    minGuestsPrivate: 15,
  },

  /** Arquitetura tapajônica. As unidades variam — ver PRODUCT.md. */
  architecture: 'tapajônica',

  /** Confirmado pelo cliente em 20/08/2026. */
  childrenAllowed: true,

  location: {
    river: 'Rio Arapiuns',
    city: 'Santarém',
    state: 'PA',
    country: 'BR',
    departsFrom: 'Alter do Chão',
    boatMinutes: 90,
  },

  contact: {
    /**
     * CANAL COMERCIAL ÚNICO, definido pelo Carlos em 21/08/2026: toda venda
     * vai para uma pessoa só. Aqui vivia o número do panfleto,
     * +55 11 96976-0096, que saiu do site inteiro na mesma mudança.
     *
     * O nome de quem atende NÃO entra aqui nem em copy nenhuma, por decisão
     * do cliente: contato comercial troca de mão, e com copy impessoal o dia
     * em que trocar é uma linha neste arquivo — não um deploy para consertar
     * oito lugares. `tools/contato-unico.mjs` guarda essa fronteira.
     */
    whatsapp: '5547992067078',
    /**
     * Destino do formulário de reserva e do link no rodapé. Era `null` e
     * marcado PENDENTE desde a Fase 2; o bloco de e-mail do Footer já estava
     * escrito esperando por isto e acende sozinho agora.
     */
    email: 'gabriela@wecarehosting.com.br',
    instagram: '@villaarapiuns',
  },

  /**
   * Duas modalidades, com estrutura de preço diferente. Confirmado pelo
   * cliente em 20/08/2026 e cruzado com os documentos em Assets/Docs.
   *
   * Aqui moram só os NÚMEROS. A condição de cada piso é frase, não dado, e
   * por isso vive no dicionário: `modo.condPousada`, `modo.condPacote` e
   * `modo.condPacote2`. Mexeu no número, confira a condição junto.
   */
  prices: {
    currency: 'BRL',

    /**
     * POUSADA — estadia com alimentação completa. Barco e passeios NÃO inclusos.
     * R$ 796 é o PISO da tabela: por pessoa/noite em quarto duplo, a partir de
     * 4 noites. O plano tarifário amarrava esse piso a um grupo de 20 pax; o
     * cliente confirmou em 20/08/2026 que NÃO precisa ser grupo de 20, e a
     * condição de grupo saiu do site. O que sobra da condição vai junto do
     * número; "a partir de" sem condição seria meia-verdade.
     */
    pousadaMin: 796,

    /**
     * PACOTE COMPLETO — sai de Alter do Chão com barco, atividades e MEIA
     * pensão (café e jantar). A partir de R$ 1.600 para 1 noite.
     */
    pacoteMin: 1600,

    /**
     * IMERSÃO COMPLETA — o mesmo pacote em 2 noites/3 dias, com Samaúma,
     * Coroca e Piracaia. A partir de R$ 2.300 por pessoa.
     */
    pacote2Min: 2300,
  },

  /**
   * PENDENTE: nota, quantidade e as avaliações em si.
   *
   * `itens` fica VAZIO até chegarem avaliações reais. O componente
   * `ListaAvaliacoes` exige `origem` em cada item justamente para que nenhuma
   * entre sem fonte rastreável: prova social sem origem é só afirmação.
   * Depoimento inventado não entra aqui em nenhuma circunstância — ver
   * PRODUCT.md, "Ausências que trabalho futuro não deve fabricar".
   *
   * VERIFICADO NA WEB EM 20/08/2026, e o resultado é o motivo de tudo aqui
   * ainda ser null: a Villa NÃO TEM UMA ÚNICA AVALIAÇÃO PÚBLICA. O perfil do
   * TripAdvisor existe e está vazio ("Este estabelecimento ainda não tem
   * avaliações"); as listagens do grupo Expedia (Hotels.com, OwnerDirect) não
   * têm comentário nem nota; não apareceu perfil do Google Business nem
   * anúncio no Airbnb. Não é que faltou procurar — não existe o que buscar.
   *
   * `tripadvisorUrl` guarda a URL verificada, mas NÃO DEVE SER RENDERIZADA
   * enquanto o perfil estiver vazio: mandar o visitante para uma página de
   * avaliações sem avaliação nenhuma é pior do que não ter link. Ela está
   * aqui porque é para lá que o cliente deve mandar os hóspedes avaliarem —
   * é o canal que o estrangeiro consulta antes de reservar.
   */
  reviews: {
    googleUrl: null as string | null,
    /** Perfil real, porém VAZIO em 20/08/2026. Não linkar até ter avaliação. */
    tripadvisorUrl:
      'https://www.tripadvisor.com.br/Hotel_Review-g673261-d33958784-Reviews-Villa_Arapiuns_Amazon_Lodge-Santarem_State_of_Para.html' as string | null,
    airbnbUrl: null as string | null,
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

/**
 * Escreve um preço. A cobrança é em reais em QUALQUER idioma — o visitante
 * alemão paga em BRL como o brasileiro —, então o símbolo nunca é convertido.
 * O que acompanha o idioma é só a pontuação do milhar: R$ 2.300 em pt/es/de,
 * R$ 2,300 em en/ja. Trocar a moeda por conversão estimada seria inventar
 * um preço que ninguém cobra.
 */
export function preco(valor: number, locale: Locale): string {
  const simbolo = SITE.prices.currency === 'BRL' ? 'R$' : SITE.prices.currency;
  return `${simbolo} ${valor.toLocaleString(HTML_LANG[locale])}`;
}

/** Monta um link de WhatsApp com mensagem já preenchida. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${SITE.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

/**
 * Escreve o WhatsApp para leitura humana: 5547992067078 → +55 47 99206-7078.
 *
 * Deriva dos mesmos dígitos de propósito. Guardar o número formatado num
 * segundo campo é convidar os dois a divergirem, e número de contato errado
 * num site de pousada remota não é erro de formatação, é venda perdida.
 */
export function telefoneLegivel(): string {
  const d = SITE.contact.whatsapp;
  // 55 + DDD(2) + assinante(8 ou 9)
  const pais = d.slice(0, 2);
  const ddd = d.slice(2, 4);
  const resto = d.slice(4);
  const meio = resto.length === 9 ? resto.slice(0, 5) : resto.slice(0, 4);
  const fim = resto.slice(meio.length);
  return `+${pais} ${ddd} ${meio}-${fim}`;
}

/**
 * AS DUAS MODALIDADES. É a estrutura central do produto e o site não a
 * expressava — pior, afirmava "barco incluso" em toda página, o que só é
 * verdade no pacote. O plano tarifário é explícito: na pousada, "não incluso:
 * transfer de barco e passeios".
 */
export const MODALIDADES = [
  {
    key: 'pousada',
    inclui: ['hospedagem', 'alimentacaoCompleta'],
    naoInclui: ['barco', 'passeios'],
    passeiosAvulsos: ['lagoAzul', 'farinhada', 'massagem'],
  },
  {
    key: 'pacote',
    inclui: ['transporte', 'hospedagem', 'meiaPensao', 'atividades'],
    naoInclui: [],
  },
] as const;

/** Os dois pacotes fechados do panfleto, saindo de Alter do Chão. */
export const PACOTES = [
  { key: 'classico', noites: 1, dias: 2, experiencias: 7 },
  { key: 'imersao',  noites: 2, dias: 3, experiencias: 10 },
] as const;

