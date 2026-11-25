/**
 * Tabela própria do Réveillon no site. Pacote de 5 noites, por pessoa,
 * check-in 28/12/2026 (saída 2/1). Os números são os mesmos que a página
 * de fechamento já mostrava. Não vêm do Hostaway e não há segunda tabela:
 * o desconto de 15% é conta em cima destes preços cheios.
 *
 * O link da InfinitePay só nasce na hora do clique, com o valor já
 * calculado. Nada aqui é um URL pronto de pagamento.
 */

export const REVEILLON = {
  nome: 'Réveillon 2027 no Rio Arapiuns',
  datas: '28/12 a 2/1 · 5 noites',
  /** Conta InfinitePay desta página. Decisão do dono em 23/11/2026. */
  tag: 'wecarehosting',
  codigo: 'REVEILLON15',
  descontoPct: 15,
  /** Último instante válido: 28/11/2026 23:59:59 no horário de Brasília. */
  fim: '2026-11-28T23:59:59-03:00',
  checkIn: '2026-12-28',
  noites: 5,
  sinalPct: 30,
  totalBangalos: 13,
  maxHospedes: 26,
  ocupacoes: [
    { nome: 'Single', pessoas: 1, precoPessoa: 9000 },
    { nome: 'Duplo', pessoas: 2, precoPessoa: 6000 },
    { nome: 'Triplo', pessoas: 3, precoPessoa: 5000 },
  ],
} as const;

export const TEXTO_PROMESSA = '5 noites de rio, floresta e silêncio para começar o ano.';
export const TEXTO_CARTAO = 'Cartão de crédito em até 12x, pela InfinitePay.';
export const TEXTO_REFEICOES = 'Café da manhã, almoço e jantar incluídos.';
export const TEXTO_PIX_CONFERE = 'A reserva só fica confirmada depois que a Villa conferir o pagamento.';
export const TEXTO_ABRINDO = 'Abrindo o pagamento…';
export const TEXTO_GRUPO = 'Para grupos acima de 26 pessoas, a Villa monta uma proposta à parte.';
export const MSG_CODIGO_OK = 'REVEILLON15 aplicado. 15% de desconto.';
export const MSG_CODIGO_INVALIDO = 'Código inválido. O preço continua o cheio.';
export const MSG_CODIGO_ENCERRADO = 'Código encerrado.';
export const MSG_CODIGO_VAZIO = 'Digite o código.';
export const MSG_NAO_ACUMULA = 'Um código só. Não acumula com outro desconto.';
/** 4–12: 50% do triplo da mesma faixa, qualquer ocupação. 0–3: zero. */
export const NOTA_CRIANCAS = 'Crianças de 4 a 12 anos pagam 50% do valor por pessoa do triplo. Até 3 anos não pagam.';

export type EstadoCodigo = 'vazio' | 'encerrado' | 'invalido' | 'aplicado';

export interface LinhaOcupacao {
  pessoas: number;
  precoPessoa: number;
  qtd: number;
}

export interface Cotacao {
  ok: boolean;
  excede: boolean;
  total: number;
  sinal: number;
  pessoas: number;
  bangalos: number;
}

/** Tira espaço (inclusive no meio) e ignora maiúsculas. */
export function normalizarCodigo(entrada: string): string {
  return entrada.replace(/\s+/g, '').toUpperCase();
}

export function fimEmMs(fimIso: string = REVEILLON.fim): number {
  return Date.parse(fimIso);
}

/**
 * Vale o segundo inteiro de 23:59:59 em Brasília. O segundo seguinte
 * (00:00:00 de 29/11) já encerrou. O header Date do servidor não traz
 * milissegundo, então a comparação é por segundo.
 */
export function promocaoAberta(agoraMs: number, fimIso: string = REVEILLON.fim): boolean {
  return Math.floor(agoraMs / 1000) <= Math.floor(fimEmMs(fimIso) / 1000);
}

export function avaliarCodigo(entrada: string, agoraMs: number, fimIso: string = REVEILLON.fim, codigo: string = REVEILLON.codigo): EstadoCodigo {
  if (!promocaoAberta(agoraMs, fimIso)) return 'encerrado';
  const normal = normalizarCodigo(entrada);
  if (!normal) return 'vazio';
  if (normal !== normalizarCodigo(codigo)) return 'invalido';
  return 'aplicado';
}

/** Preço de uma pessoa, em centavos, com o desconto já aplicado. 0% devolve o cheio. */
export function unitarioCentavos(precoReais: number, descontoPct: number): number {
  const cheio = Math.round(precoReais * 100);
  if (descontoPct <= 0) return cheio;
  return Math.round((cheio * (100 - descontoPct)) / 100);
}

export function precoComDesconto(precoReais: number, descontoPct: number): number {
  return unitarioCentavos(precoReais, descontoPct) / 100;
}

/**
 * Mesma conta do fechamento: crianças de 0–3 não entram no valor; de 4–12
 * pagam 50% da ocupação mais barata que a pessoa escolheu. O desconto do
 * código, quando há, já está no preço do adulto antes dessa metade.
 * Noites só multiplicam quando o pacote é por noite (Detox). O Réveillon
 * é pacote fechado: porNoite falso, o total é o das 5 noites.
 */
export function cotar(input: {
  linhas: readonly LinhaOcupacao[];
  cri03: number;
  cri412: number;
  noites: number;
  porNoite: boolean;
  descontoPct: number;
  sinalPct: number;
  totalBangalos: number;
  maxHospedes: number;
}): Cotacao {
  const mult = input.porNoite ? input.noites : 1;
  let totalCent = 0;
  let bang = 0;
  let pessoas = 0;
  const precos: number[] = [];
  for (const linha of input.linhas) {
    const qtd = Math.max(linha.qtd || 0, 0);
    if (!qtd) continue;
    bang += qtd;
    const unit = unitarioCentavos(linha.precoPessoa, input.descontoPct);
    pessoas += qtd * linha.pessoas;
    totalCent += qtd * linha.pessoas * unit * mult;
    precos.push(unit);
  }
  const cri03 = Math.max(input.cri03 || 0, 0);
  const cri412 = Math.max(input.cri412 || 0, 0);
  if (cri412 && precos.length) {
    const menor = Math.min(...precos);
    totalCent += Math.round((cri412 * menor * mult) / 2);
  }
  pessoas += cri03 + cri412;
  const excede = bang > input.totalBangalos || pessoas > input.maxHospedes;
  const total = totalCent / 100;
  const ok = total > 0 && !excede;
  const sinal = ok ? Math.round(total * input.sinalPct) / 100 : 0;
  return { ok, excede, total, sinal, pessoas, bangalos: bang };
}

/** Formato que a InfinitePay lê no caminho: 1234,56 — vírgula, sem milhar. */
export function valorLink(reais: number): string {
  const cent = Math.round(reais * 100);
  const negativo = cent < 0;
  const abs = Math.abs(cent);
  const inteiro = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return `${negativo ? '-' : ''}${inteiro},${frac}`;
}

export function linkPagamento(tag: string, reais: number): string {
  return `https://pay.infinitepay.io/${tag}/${valorLink(reais)}`;
}

/**
 * Hora do servidor, pelo header Date de um HEAD na própria origem.
 * Sem cache. Se a rede falhar, o header não vier ou passar do tempo, devolve null
 * e quem chama usa o relógio do aparelho.
 */
export async function horaDaOrigem(origem: string, fetchImpl: typeof fetch = fetch, timeoutMs = 4000): Promise<number | null> {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), timeoutMs);
  try {
    const resposta = await fetchImpl(origem, { method: 'HEAD', cache: 'no-store', signal: controle.signal });
    const bruto = resposta.headers.get('Date');
    if (!bruto) return null;
    const ms = Date.parse(bruto);
    return Number.isNaN(ms) ? null : ms;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function instanteEfetivo(servidorMs: number | null, localMs: number): number {
  return servidorMs === null ? localMs : servidorMs;
}
