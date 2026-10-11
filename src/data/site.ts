/**
 * Fonte única de dados operacionais do site.
 * Tudo que o cliente precisa atualizar sem mexer em layout mora aqui.
 *
 * Itens marcados PENDENTE aguardam informação do cliente (ver plano).
 */

import { HTML_LANG, type Locale } from '@/i18n/config';

export const SITE = {
  name: 'Villa Arapiuns',
  domain: 'https://villaarapiuns.com.br',

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

  /**
   * CONFIRMADO pelo Carlos em 26/08/2026: a Villa NÃO aceita animal.
   *
   * Vivia como literal `petsAllowed: false` dentro do BaseLayout, afirmado em
   * todas as 66 páginas sem constar de documento nenhum — era a única linha do
   * bloco de schema sem fonte, e saiu por isso. Voltou como dado, aqui, porque
   * agora é fato: quem for mudar a política muda uma linha neste arquivo, não
   * um literal escondido num layout.
   */
  petsAllowed: false,

  location: {
    river: 'Rio Arapiuns',
    city: 'Santarém',
    state: 'PA',
    country: 'BR',
    departsFrom: 'Alter do Chão',
    boatMinutes: 90,
    /**
     * COORDENADA DO PIN DA FICHA DO GOOGLE (Business Profile), lida em
     * 11/10/2026 na resposta do próprio Google Maps para o cid de
     * `contact.googleMaps` (4567770498331262782 = 0x3f63fb11308b3f3e): a ficha
     * "Villa Arapiuns", com o WhatsApp +55 47 99206-7078 e o link para
     * villaarapiuns.com.br/pt/, está em [-2.3843517, -55.2025123].
     *
     * É a fonte que o dono controla e a que o Google já mostra no topo da busca
     * pela marca — publicar a MESMA coordenada no schema reforça a entidade em
     * vez de criar uma segunda. Se o pin da ficha for movido, esta linha muda
     * junto. `null` tira o `geo` do JSON-LD.
     */
    geo: { latitude: -2.3843517, longitude: -55.2025123 } as { latitude: number; longitude: number } | null,
  },

  /**
   * MEDIÇÃO. Criado em 26/08/2026 por API (propriedade 551708230, conta
   * WeCare Hosting), depois de o site ficar no ar semanas sem medir nada:
   * o HTML não tinha gtag, GTM nem qualquer analytics, e não existia
   * propriedade GA4 para este domínio.
   *
   * POR QUE ISTO É DADO E NÃO VARIÁVEL DE AMBIENTE. O Measurement ID é
   * público por construção — ele sai no HTML de toda página, qualquer
   * visitante o lê. Não há segredo a proteger. E, mais decisivo: quem publica
   * este site roda o build DO LADO DO SERVIDOR (deploy automático no push
   * para `main`), num ambiente onde não existe o `.env` de ninguém. Um
   * `import.meta.env.PUBLIC_GA_ID` sairia vazio em produção e a tag
   * simplesmente não existiria — falha silenciosa, do tipo que só se
   * descobre semanas depois olhando um relatório vazio.
   *
   * `null` desliga a medição inteira. É assim que se roda um fork ou um
   * ambiente de teste sem sujar a propriedade com dado de localhost.
   */
  analytics: {
    measurementId: 'G-YC3JBLLH1P' as string | null,
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
     * Destino do formulário de reserva e do link no rodapé — que RENDERIZA
     * este valor como texto visível em TODA página do site menos uma (ver
     * `Footer.astro`). A exceção é o stub de detecção de idioma em `/`, que o
     * Astro gera sem cabeçalho nem rodapé; `tools/contato-unico.mjs` mantém a
     * lista dessa exceção e falha se qualquer outra página ficar sem o
     * contato. Contado assim, o número não envelhece a cada página nova — e
     * já envelheceu: aqui dizia "51 das 52 páginas" quando o site passou a
     * ter 57. Por isso é um ALIAS de papel (`reservas@...`), não a
     * caixa pessoal de quem atende: o alias encaminha para ela no servidor
     * de e-mail, mas o nome dela não aparece em copy nenhuma — mesma decisão
     * do WhatsApp acima, pelo mesmo motivo.
     *
     * Aqui vivia a caixa pessoal de quem atende, publicada por engano:
     * contato comercial troca de mão, e um endereço PESSOAL publicado não
     * fica só desatualizado quando isso acontecer — ele MORRE, inclusive
     * para um hóspede antigo que salvou o contato. Um alias sobrevive à
     * troca sem o site mudar uma linha.
     */
    email: 'reservas@villaarapiuns.com.br',
    instagram: '@villaarapiuns',
    /** Ficha do Google (Business Profile), pelo cid estável — 25 avaliações, nota 5,0 em 22/09/2026. */
    googleMaps: 'https://www.google.com/maps?cid=4567770498331262782',
  },

  /**
   * PREÇO NÃO É PUBLICADO (decisão do Leonardo, 11/10/2026).
   *
   * Nenhum valor aparece no site, no JSON-LD nem no llms.txt: a Gabriela
   * negocia caso a caso pelo WhatsApp. Os pisos que moravam aqui (pousada por
   * pessoa/noite e os dois pacotes) saíram do repositório para não vazarem
   * por engano em página nenhuma. Onde havia número, o site mostra
   * `cta.condicaoWhatsapp` ("Condição por grupo, consulte no WhatsApp").
   *
   * `currency` fica só para `preco()`, que continua testada, mas não tem
   * consumidor renderizado. Antes de voltar a usar `preco()` em página,
   * confirme com o Leonardo que a decisão mudou.
   */
  prices: {
    currency: 'BRL',
  },

  /**
   * NOTA DA FICHA DO GOOGLE, mostrada como selo com link (SEO W43).
   *
   * Fonte: a própria ficha do Google (Business Profile) em `contact.googleMaps`,
   * lida em 22/09/2026: 25 avaliações, nota 5,0. O mesmo número está no
   * llms.txt. O selo SEMPRE leva o link para a ficha: quem lê confere na fonte.
   *
   * Fica SEPARADO de `reviews` de propósito. `reviews.rating` liga o
   * `aggregateRating` no JSON-LD (BaseLayout), e essa decisão continua aberta;
   * nota de terceiro marcada como avaliação própria é o tipo de schema que o
   * Google trata como autopromoção. Este campo só desenha o selo.
   *
   * Quando a ficha mudar, atualize nota, total e data juntos. `null` tira o selo.
   */
  googleRating: { nota: 5.0, total: 25, lidoEm: '2026-09-22' } as { nota: number; total: number; lidoEm: string } | null,

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
 *
 * Por isso ela FALHA ALTO em vez de fatiar o dígito às cegas: se o valor
 * guardado não for só dígitos, ou não tiver um comprimento que ela sabe
 * formatar (55 + DDD de 2 + assinante de 8 ou 9), ela lança em vez de
 * devolver um número plausível e errado. Isto roda em build time sobre dado
 * estático — um `throw` aqui quebra o build, e é o resultado certo: build
 * quebrado é visível, número mal pontuado no rodapé não é.
 */
export function telefoneLegivel(): string {
  const d = SITE.contact.whatsapp;
  if (!/^\d+$/.test(d)) {
    throw new Error(`telefoneLegivel: SITE.contact.whatsapp tem caractere não numérico — valor "${d}".`);
  }
  // 55 + DDD(2) + assinante(8 ou 9) = 12 ou 13 dígitos no total.
  if (d.length !== 12 && d.length !== 13) {
    throw new Error(
      `telefoneLegivel: SITE.contact.whatsapp "${d}" tem ${d.length} dígito(s); só sei formatar 55 + DDD(2) + assinante(8 ou 9), ou seja, 12 ou 13.`
    );
  }
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

