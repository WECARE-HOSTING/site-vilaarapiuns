/**
 * Cobrança da Villa na InfinitePay.
 *
 * O caminho no ar é o link estático da conta wecarehosting
 * (https://pay.infinitepay.io/wecarehosting/{valor}). O valor é o sinal ou o
 * total já calculado, com vírgula nos centavos. Esse link não devolve o
 * visitante para a página de obrigado, então não dispara purchase.
 *
 * criarLink e confirmarPagamento ficam para um Checkout Integrado futuro.
 * Sem payment_check com paid === true, nenhuma compra é registrada.
 */

import { reaisDeCentavos } from '@/lib/fechamento';
import type { UtmBag } from '@/lib/utm';

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type ModoCobranca = 'sinal' | 'total';

export type PedidoCheckout = {
  pacoteId: 'reveillon' | 'detox';
  single: number;
  duplo: number;
  triplo: number;
  cri03: number;
  cri412: number;
  modo: ModoCobranca;
  orderNsu: string;
  redirectUrl: string;
  etiqueta: string;
};

export type PedidoSalvo = PedidoCheckout & {
  nome: string;
  resumo: string;
  totalCentavos: number;
  sinalCentavos: number;
  utm: UtmBag;
};

export const CHAVE_PEDIDO = 'va_pedido';
export const HANDLE_INFINITEPAY = 'wecarehosting';

/**
 * Link estático. `reais` tem de ser o sinal ou o total já calculado.
 * 3600 vira 3600,00. Valor inválido não gera link.
 */
export function linkEstaticoInfinitePay(reais: number): string | null {
  if (!Number.isFinite(reais) || reais <= 0) return null;
  const valor = reais.toFixed(2).replace('.', ',');
  return `https://pay.infinitepay.io/${HANDLE_INFINITEPAY}/${valor}`;
}

export function novoOrderNsu(pacoteId: string, agora = Date.now(), aleatorio = Math.random()): string {
  const rnd = Math.floor(Math.abs(aleatorio) * 36 ** 6).toString(36).padStart(6, '0');
  return `${pacoteId}-${agora.toString(36)}-${rnd}`.replace(/[^a-z0-9-]/g, '');
}

export function apiCheckout(): string {
  const w = globalThis as { __VA_CHECKOUT_API__?: string };
  if (typeof w.__VA_CHECKOUT_API__ === 'string') return w.__VA_CHECKOUT_API__.replace(/\/$/, '');
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return (env?.PUBLIC_CHECKOUT_API_BASE || '').replace(/\/$/, '');
}

export function caminhoObrigado(): string {
  return '/pt/lp/pagamento-confirmado/';
}

export function redirectObrigado(origin: string): string {
  return new URL(caminhoObrigado(), origin).href;
}

export type ResultadoLink =
  | { destino: 'checkout'; url: string; orderNsu: string }
  | { destino: 'whatsapp'; motivo: 'sem_endpoint' | 'recusado' | 'rede'; detalhe: string; orderNsu: string };

export async function criarLink(
  pedido: PedidoCheckout,
  deps: { apiBase: string; fetchImpl?: typeof fetch },
): Promise<ResultadoLink> {
  if (!deps.apiBase) {
    return { destino: 'whatsapp', motivo: 'sem_endpoint', detalhe: 'Checkout online ainda não está ligado neste ambiente.', orderNsu: pedido.orderNsu };
  }
  const fetchImpl = deps.fetchImpl ?? fetch;
  try {
    const res = await fetchImpl(`${deps.apiBase}/links`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        pacoteId: pedido.pacoteId,
        single: pedido.single,
        duplo: pedido.duplo,
        triplo: pedido.triplo,
        cri03: pedido.cri03,
        cri412: pedido.cri412,
        modo: pedido.modo,
        order_nsu: pedido.orderNsu,
        redirect_url: pedido.redirectUrl,
        etiqueta: pedido.etiqueta,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; erro?: string };
    if (!res.ok || typeof data.url !== 'string' || !data.url.startsWith('https://')) {
      return {
        destino: 'whatsapp',
        motivo: 'recusado',
        detalhe: data.erro || 'pagamento_recusado',
        orderNsu: pedido.orderNsu,
      };
    }
    return { destino: 'checkout', url: data.url, orderNsu: pedido.orderNsu };
  } catch {
    return { destino: 'whatsapp', motivo: 'rede', detalhe: 'rede', orderNsu: pedido.orderNsu };
  }
}

export function salvarPedido(storage: StorageLike, pedido: PedidoSalvo): void {
  try {
    storage.setItem(CHAVE_PEDIDO, JSON.stringify(pedido));
  } catch {
    /* segue sem cópia local; a confirmação ainda usa a query da InfinitePay */
  }
}

export function lerPedido(storage: StorageLike): PedidoSalvo | null {
  try {
    const cru = storage.getItem(CHAVE_PEDIDO);
    if (!cru) return null;
    const obj = JSON.parse(cru) as Partial<PedidoSalvo>;
    if (!obj || typeof obj.orderNsu !== 'string') return null;
    return obj as PedidoSalvo;
  } catch {
    return null;
  }
}

export type RetornoInfinite = {
  order_nsu: string;
  transaction_nsu: string;
  slug: string;
  capture_method: string;
  receipt_url: string;
};

export function lerRetorno(params: URLSearchParams): RetornoInfinite | null {
  const order_nsu = params.get('order_nsu')?.trim() || '';
  const transaction_nsu = params.get('transaction_nsu')?.trim() || '';
  const slug = params.get('slug')?.trim() || '';
  if (!order_nsu || !transaction_nsu || !slug) return null;
  return {
    order_nsu,
    transaction_nsu,
    slug,
    capture_method: params.get('capture_method')?.trim() || '',
    receipt_url: params.get('receipt_url')?.trim() || '',
  };
}

export type RespostaCheck = {
  paid?: boolean;
  amount?: number;
  paid_amount?: number;
  receipt_url?: string;
  capture_method?: string;
};

export type EstadoConfirmacao =
  | { estado: 'pago'; valorBRL: number; receiptUrl: string; captureMethod: string; orderNsu: string }
  | { estado: 'nao_pago'; orderNsu: string }
  | { estado: 'incompleto' }
  | { estado: 'sem_endpoint' }
  | { estado: 'erro' };

/**
 * A InfinitePay cobra em centavos (o mesmo campo `price` do link).
 * Se o comprovante devolver o valor já em reais, e ele bater com o sinal
 * salvo, usamos esse número. Sem referência, centavos.
 */
export function valorPagoBRL(check: RespostaCheck, sinalCentavosSalvo: number | null): number {
  const bruto = check.paid_amount ?? check.amount;
  if (typeof bruto === 'number' && Number.isFinite(bruto) && bruto > 0) {
    const inteiro = Math.round(bruto);
    if (sinalCentavosSalvo && sinalCentavosSalvo > 0) {
      if (inteiro === sinalCentavosSalvo) return reaisDeCentavos(inteiro);
      if (Math.round(bruto * 100) === sinalCentavosSalvo) return bruto;
    }
    return reaisDeCentavos(inteiro);
  }
  if (sinalCentavosSalvo && sinalCentavosSalvo > 0) return reaisDeCentavos(sinalCentavosSalvo);
  return 0;
}

export async function confirmarPagamento(
  params: URLSearchParams,
  deps: { apiBase: string; fetchImpl?: typeof fetch; sinalCentavosSalvo?: number | null },
): Promise<EstadoConfirmacao> {
  const retorno = lerRetorno(params);
  if (!retorno) return { estado: 'incompleto' };
  if (!deps.apiBase) return { estado: 'sem_endpoint' };
  const fetchImpl = deps.fetchImpl ?? fetch;
  try {
    const res = await fetchImpl(`${deps.apiBase}/payment-check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        order_nsu: retorno.order_nsu,
        transaction_nsu: retorno.transaction_nsu,
        slug: retorno.slug,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as RespostaCheck;
    if (!res.ok) return { estado: 'erro' };
    if (data.paid !== true) return { estado: 'nao_pago', orderNsu: retorno.order_nsu };
    const receipt = (typeof data.receipt_url === 'string' && data.receipt_url) || retorno.receipt_url;
    return {
      estado: 'pago',
      valorBRL: valorPagoBRL(data, deps.sinalCentavosSalvo ?? null),
      receiptUrl: receipt,
      captureMethod: (typeof data.capture_method === 'string' && data.capture_method) || retorno.capture_method,
      orderNsu: retorno.order_nsu,
    };
  } catch {
    return { estado: 'erro' };
  }
}

export type PlanoConversoes = {
  ga4: boolean;
  ads: boolean;
  meta: boolean;
};

function chave(canal: string, orderNsu: string): string {
  return `va_purchase_${canal}:${orderNsu}`;
}

export function jaDisparou(storage: StorageLike, canal: 'ga4' | 'ads' | 'meta', orderNsu: string): boolean {
  try {
    return storage.getItem(chave(canal, orderNsu)) === '1';
  } catch {
    return false;
  }
}

export function marcarDisparo(storage: StorageLike, canal: 'ga4' | 'ads' | 'meta', orderNsu: string): void {
  try {
    storage.setItem(chave(canal, orderNsu), '1');
  } catch {
    /* se a sessão não guarda, o próximo reload pode repetir; o transaction_id ainda deduplica no GA4 */
  }
}

/**
 * purchase só com paid === true, uma vez por canal e por pedido.
 * Recarregar a página de obrigado não conta de novo.
 * Meta ainda exige consentimento de marketing e o ID do Pixel.
 * Google Ads exige as duas variáveis; sem label não há send_to quebrado.
 */
export function planoDeConversoes(args: {
  pago: boolean;
  orderNsu: string;
  storage: StorageLike;
  adsId: string;
  adsLabel: string;
  pixelId: string;
  marketingConsent: boolean;
}): PlanoConversoes {
  if (!args.pago || !args.orderNsu) return { ga4: false, ads: false, meta: false };
  return {
    ga4: !jaDisparou(args.storage, 'ga4', args.orderNsu),
    ads: !!(args.adsId.trim() && args.adsLabel.trim()) && !jaDisparou(args.storage, 'ads', args.orderNsu),
    meta: !!(args.marketingConsent && args.pixelId.trim()) && !jaDisparou(args.storage, 'meta', args.orderNsu),
  };
}

export type ItemCompra = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
};

export function itemCompra(pacoteId: string, nome: string, valorBRL: number): ItemCompra {
  return {
    item_id: `${pacoteId}-sinal`,
    item_name: nome,
    price: valorBRL,
    quantity: 1,
  };
}

export function contagemDeInputs(valores: { pessoas: number; q: number }[], cri03: number, cri412: number): {
  single: number; duplo: number; triplo: number; cri03: number; cri412: number;
} {
  const porPessoas = new Map<number, number>();
  for (const v of valores) {
    const q = Math.max(0, Math.floor(v.q) || 0);
    porPessoas.set(v.pessoas, (porPessoas.get(v.pessoas) || 0) + q);
  }
  return {
    single: porPessoas.get(1) || 0,
    duplo: porPessoas.get(2) || 0,
    triplo: porPessoas.get(3) || 0,
    cri03: Math.max(0, Math.floor(cri03) || 0),
    cri412: Math.max(0, Math.floor(cri412) || 0),
  };
}

export function mensagemFallback(nome: string, resumo: string, marca: string): string {
  const base = `Oi! Quero seguir com o sinal de ${nome}. ${resumo}`.trim();
  return marca ? `${base} ${marca}` : base;
}
