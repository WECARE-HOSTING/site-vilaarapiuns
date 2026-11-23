/**
 * Proxy do Checkout Integrado.
 *
 * O site publicado é HTML estático (nginx). PHP não executa — POST /enviar.php
 * responde 405. Este módulo é o que um Worker (ver workers/infinitepay-proxy)
 * executa fora do docroot: recalcula o sinal no servidor, chama a InfinitePay
 * e devolve só a URL. A chave, se existir, fica na variável de ambiente do
 * Worker, nunca no HTML.
 */

import { PACOTES, cotar, type PacoteFechamento } from '@/lib/fechamento';

export type ProxyEnv = {
  INFINITEPAY_HANDLE?: string;
  INFINITEPAY_API_KEY?: string;
  INFINITEPAY_WEBHOOK_URL?: string;
  ALLOWED_ORIGINS?: string;
};

const ORIGENS_PADRAO = [
  'https://villaarapiuns.com.br',
  'https://www.villaarapiuns.com.br',
  'https://vilaarapiuns.com.br',
  'https://www.vilaarapiuns.com.br',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

const CAMINHO_OBRIGADO = '/pt/lp/pagamento-confirmado/';
const API_LINKS = 'https://api.checkout.infinitepay.io/links';
const API_CHECK = 'https://api.checkout.infinitepay.io/payment_check';

type CorpoLink = {
  pacoteId?: string;
  single?: number;
  duplo?: number;
  triplo?: number;
  cri03?: number;
  cri412?: number;
  modo?: string;
  order_nsu?: string;
  redirect_url?: string;
  etiqueta?: string;
};

function origens(env: ProxyEnv): string[] {
  const extra = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return extra.length ? extra : ORIGENS_PADRAO;
}

function cors(res: Response, origin: string | null, permitidas: string[]): Response {
  const headers = new Headers(res.headers);
  if (origin && permitidas.includes(origin)) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
    headers.set('access-control-allow-methods', 'POST, OPTIONS');
    headers.set('access-control-allow-headers', 'content-type, accept');
  }
  return new Response(res.body, { status: res.status, headers });
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export function redirectPermitido(valor: string, permitidas: string[]): boolean {
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return false;
  }
  if (!permitidas.includes(url.origin)) return false;
  const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  return path === CAMINHO_OBRIGADO;
}

function handleDe(env: ProxyEnv): string {
  const h = (env.INFINITEPAY_HANDLE || 'carlospecucci').trim();
  return h || 'carlospecucci';
}

function pacoteDe(id: string | undefined): PacoteFechamento | null {
  if (id === 'reveillon' || id === 'detox') return PACOTES[id];
  return null;
}

function modoDe(valor: string | undefined): 'sinal' | 'total' | null {
  if (valor === 'total') return 'total';
  if (valor === 'sinal' || valor == null || valor === '') return 'sinal';
  return null;
}

export function descreverItem(nome: string, modo: 'sinal' | 'total', linhas: string[], etiqueta: string): string {
  const oQue = modo === 'total' ? 'Pacote' : 'Sinal 30%';
  const miolo = linhas.length ? linhas.join(' + ') : nome;
  const base = `${oQue} · ${nome} · ${miolo}`;
  const com = etiqueta ? `${base} ${etiqueta}` : base;
  return com.replace(/\s+/g, ' ').trim().slice(0, 180);
}

async function criarLink(corpo: CorpoLink, env: ProxyEnv, fetchImpl: typeof fetch): Promise<Response> {
  const pacote = pacoteDe(corpo.pacoteId);
  const modo = modoDe(corpo.modo);
  const order = (corpo.order_nsu || '').trim();
  if (!pacote || !modo || !order || order.length > 80 || !/^[-a-zA-Z0-9]+$/.test(order)) {
    return json({ erro: 'pedido_invalido' }, 400);
  }
  if (!redirectPermitido(corpo.redirect_url || '', origens(env))) {
    return json({ erro: 'redirect_invalido' }, 400);
  }
  const cotacao = cotar(pacote, {
    single: Number(corpo.single) || 0,
    duplo: Number(corpo.duplo) || 0,
    triplo: Number(corpo.triplo) || 0,
    cri03: Number(corpo.cri03) || 0,
    cri412: Number(corpo.cri412) || 0,
  }, modo);
  if (!cotacao.ok) {
    return json({ erro: cotacao.motivo || 'pedido_invalido' }, cotacao.motivo === 'preco_nao_publicado' ? 409 : 400);
  }

  const etiqueta = (corpo.etiqueta || '').trim().slice(0, 40);
  const payload: Record<string, unknown> = {
    handle: handleDe(env),
    order_nsu: order,
    redirect_url: corpo.redirect_url,
    items: [{
      quantity: 1,
      price: cotacao.cobrancaCentavos,
      description: descreverItem(pacote.nome, modo, cotacao.linhas, etiqueta),
    }],
  };
  if (env.INFINITEPAY_WEBHOOK_URL) payload.webhook_url = env.INFINITEPAY_WEBHOOK_URL;

  const headers: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json' };
  if (env.INFINITEPAY_API_KEY) headers['X-Api-Key'] = env.INFINITEPAY_API_KEY;

  let upstream: Response;
  try {
    upstream = await fetchImpl(API_LINKS, { method: 'POST', headers, body: JSON.stringify(payload) });
  } catch {
    return json({ erro: 'upstream' }, 502);
  }
  const data = (await upstream.json().catch(() => ({}))) as { url?: string };
  if (!upstream.ok || typeof data.url !== 'string') {
    return json({ erro: 'upstream' }, 502);
  }
  return json({
    url: data.url,
    order_nsu: order,
    price: cotacao.cobrancaCentavos,
    total: cotacao.totalCentavos,
    sinal: cotacao.sinalCentavos,
  }, 200);
}

async function checar(corpo: { order_nsu?: string; transaction_nsu?: string; slug?: string }, env: ProxyEnv, fetchImpl: typeof fetch): Promise<Response> {
  const order_nsu = (corpo.order_nsu || '').trim();
  const transaction_nsu = (corpo.transaction_nsu || '').trim();
  const slug = (corpo.slug || '').trim();
  if (!order_nsu || !transaction_nsu || !slug) return json({ erro: 'pedido_invalido', paid: false }, 400);

  const headers: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json' };
  if (env.INFINITEPAY_API_KEY) headers['X-Api-Key'] = env.INFINITEPAY_API_KEY;

  let upstream: Response;
  try {
    upstream = await fetchImpl(API_CHECK, {
      method: 'POST',
      headers,
      body: JSON.stringify({ handle: handleDe(env), order_nsu, transaction_nsu, slug }),
    });
  } catch {
    return json({ erro: 'upstream', paid: false }, 502);
  }
  const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;
  if (!upstream.ok) return json({ erro: 'upstream', paid: false }, 502);
  return json({ ...data, paid: data.paid === true }, 200);
}

export async function handleCheckoutRequest(request: Request, env: ProxyEnv = {}, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const permitidas = origens(env);
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') {
    return cors(new Response(null, { status: 204 }), origin, permitidas);
  }
  if (request.method !== 'POST') {
    return cors(json({ erro: 'method' }, 405), origin, permitidas);
  }
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '') || '/';
  let corpo: Record<string, unknown> = {};
  try {
    corpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return cors(json({ erro: 'pedido_invalido' }, 400), origin, permitidas);
  }
  const resposta = path.endsWith('/links')
    ? await criarLink(corpo as CorpoLink, env, fetchImpl)
    : path.endsWith('/payment-check')
      ? await checar(corpo as { order_nsu?: string; transaction_nsu?: string; slug?: string }, env, fetchImpl)
      : json({ erro: 'nao_encontrado' }, 404);
  return cors(resposta, origin, permitidas);
}
