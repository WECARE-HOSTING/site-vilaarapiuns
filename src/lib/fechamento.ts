/**
 * Fechamento de pacote com sinal.
 *
 * O Réveillon tem preço publicado (Leonardo, 22/11/2026): Single R$ 9.000,
 * Duplo R$ 6.000, Triplo R$ 5.000 por pessoa, 5 noites, sinal de 30%.
 * O Detox entra na mesma estrutura, sem número: o preço só aparece aqui
 * quando o dono definir. Nada neste arquivo inventa esse valor.
 */

export type IdOcupacao = 'single' | 'duplo' | 'triplo';

export type Ocupacao = {
  id: IdOcupacao;
  nome: string;
  pessoas: number;
  /** Reais por pessoa, no pacote inteiro (ou por noite, se porNoite). */
  precoPessoa: number;
};

export type PacoteFechamento = {
  id: 'reveillon' | 'detox';
  nome: string;
  datas: string;
  checkIn: string;
  noites: number;
  datasFixas: boolean;
  porNoite: boolean;
  sinalPct: number;
  totalBangalos: number;
  maxHospedes: number;
  /** null = estrutura pronta, preço ainda não publicado. */
  ocupacoes: readonly Ocupacao[] | null;
  publicado: boolean;
};

export const PACOTE_REVEILLON: PacoteFechamento = {
  id: 'reveillon',
  nome: 'Réveillon 2027 no Rio Arapiuns',
  datas: '28/12/2026 a 02/01/2027 · 5 noites',
  checkIn: '2026-12-28',
  noites: 5,
  datasFixas: true,
  porNoite: false,
  sinalPct: 30,
  totalBangalos: 13,
  maxHospedes: 26,
  publicado: true,
  ocupacoes: [
    { id: 'single', nome: 'Single', pessoas: 1, precoPessoa: 9000 },
    { id: 'duplo', nome: 'Duplo', pessoas: 2, precoPessoa: 6000 },
    { id: 'triplo', nome: 'Triplo', pessoas: 3, precoPessoa: 5000 },
  ],
};

/** Mesma forma do Réveillon, de propósito sem diária. */
export const PACOTE_DETOX: PacoteFechamento = {
  id: 'detox',
  nome: 'Detox pós-Réveillon',
  datas: '1 a 10/1/2027',
  checkIn: '2027-01-01',
  noites: 2,
  datasFixas: false,
  porNoite: true,
  sinalPct: 30,
  totalBangalos: 13,
  maxHospedes: 26,
  publicado: false,
  ocupacoes: null,
};

export const PACOTES: Record<PacoteFechamento['id'], PacoteFechamento> = {
  reveillon: PACOTE_REVEILLON,
  detox: PACOTE_DETOX,
};

export type Contagem = Record<IdOcupacao, number> & {
  cri03: number;
  cri412: number;
};

export type Distribuicao = {
  single: number;
  duplo: number;
  triplo: number;
  pessoas: number;
  /** O link pedia mais gente do que a casa comporta. */
  limitado: boolean;
  /** false = parâmetro ausente ou inválido; a página usa o padrão (1 Duplo). */
  informado: boolean;
};

const PADRAO: Distribuicao = {
  single: 0,
  duplo: 1,
  triplo: 0,
  pessoas: 2,
  limitado: false,
  informado: false,
};

/**
 * `?pessoas=N` vira bangalôs. A combinação mais barata por pessoa é a que
 * enche Triplo, depois Duplo, e só então Single. Resto 1 com pelo menos um
 * Triplo vira dois Duplos (3+1 = 2+2): o total em reais é o mesmo e ninguém
 * fica sozinho num Single só por causa do resto.
 */
export function distribuirPessoas(
  entrada: number | null | undefined,
  limites: { maxHospedes: number } = { maxHospedes: PACOTE_REVEILLON.maxHospedes },
): Distribuicao {
  if (entrada == null || !Number.isFinite(entrada) || entrada < 1) return { ...PADRAO };
  const pedido = Math.floor(entrada);
  const limitado = pedido > limites.maxHospedes;
  const pessoas = Math.min(pedido, limites.maxHospedes);
  let triplo = Math.floor(pessoas / 3);
  const resto = pessoas % 3;
  let duplo = 0;
  let single = 0;
  if (resto === 2) duplo = 1;
  else if (resto === 1) {
    if (triplo > 0) {
      triplo -= 1;
      duplo = 2;
    } else single = 1;
  }
  return { single, duplo, triplo, pessoas, limitado, informado: true };
}

export function interpretarPessoas(valor: string | null | undefined): number | null {
  if (valor == null) return null;
  const t = valor.trim();
  if (!/^\d+$/.test(t)) return null;
  return Number(t);
}

export type Cotacao = {
  ok: boolean;
  motivo?: 'preco_nao_publicado' | 'vazio' | 'capacidade';
  totalCentavos: number;
  sinalCentavos: number;
  cobrancaCentavos: number;
  pessoas: number;
  bangalos: number;
  adultos: number;
  cri03: number;
  cri412: number;
  linhas: string[];
};

function inteiro(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function cotar(
  pacote: PacoteFechamento,
  contagem: Partial<Contagem>,
  modo: 'sinal' | 'total' = 'sinal',
): Cotacao {
  const vazio: Cotacao = {
    ok: false,
    motivo: 'preco_nao_publicado',
    totalCentavos: 0,
    sinalCentavos: 0,
    cobrancaCentavos: 0,
    pessoas: 0,
    bangalos: 0,
    adultos: 0,
    cri03: 0,
    cri412: 0,
    linhas: [],
  };
  if (!pacote.publicado || !pacote.ocupacoes) return vazio;

  const mult = pacote.porNoite ? Math.max(pacote.noites, 1) : 1;
  let totalCentavos = 0;
  let adultos = 0;
  let bangalos = 0;
  const linhas: string[] = [];
  const precosEscolhidos: number[] = [];

  for (const oc of pacote.ocupacoes) {
    const q = inteiro(contagem[oc.id] ?? 0);
    if (!q) continue;
    bangalos += q;
    adultos += q * oc.pessoas;
    totalCentavos += q * oc.pessoas * oc.precoPessoa * 100 * mult;
    precosEscolhidos.push(oc.precoPessoa);
    linhas.push(`${q} ${oc.nome}`);
  }

  const cri03 = inteiro(contagem.cri03 ?? 0);
  const cri412 = inteiro(contagem.cri412 ?? 0);
  if (cri412 && precosEscolhidos.length) {
    const menor = Math.min(...precosEscolhidos);
    totalCentavos += Math.round(cri412 * menor * 100 * 0.5 * mult);
    linhas.push(`${cri412} criança(s) 4–12`);
  }
  if (cri03) linhas.push(`${cri03} criança(s) 0–3`);

  const pessoas = adultos + cri03 + cri412;
  const excede = bangalos > pacote.totalBangalos || pessoas > pacote.maxHospedes;
  if (excede) {
    return { ...vazio, motivo: 'capacidade', pessoas, bangalos, adultos, cri03, cri412, linhas };
  }
  if (totalCentavos <= 0) {
    return { ...vazio, motivo: 'vazio', pessoas, bangalos, adultos, cri03, cri412, linhas };
  }

  const sinalCentavos = Math.round((totalCentavos * pacote.sinalPct) / 100);
  const cobrancaCentavos = modo === 'total' ? totalCentavos : sinalCentavos;
  return {
    ok: true,
    totalCentavos,
    sinalCentavos,
    cobrancaCentavos,
    pessoas,
    bangalos,
    adultos,
    cri03,
    cri412,
    linhas,
  };
}

export function reaisDeCentavos(centavos: number): number {
  return Math.round(centavos) / 100;
}

export function formatarBRL(centavos: number): string {
  return reaisDeCentavos(centavos).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
