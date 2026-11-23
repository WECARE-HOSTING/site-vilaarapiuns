/**
 * Origem da visita, para qualquer anúncio — não só utm_source=google.
 * Vive na sessão: a navegação interna não precisa repetir a query string.
 */

export const CHAVES_UTM = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
] as const;

export type ChaveUtm = (typeof CHAVES_UTM)[number];
export type UtmBag = Partial<Record<ChaveUtm, string>>;

export const CHAVE_UTM_SESSAO = 'va_utm';

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function lerUtmDeParams(params: URLSearchParams): UtmBag {
  const out: UtmBag = {};
  for (const k of CHAVES_UTM) {
    const v = params.get(k);
    if (!v) continue;
    const limpo = v.trim().slice(0, 120);
    if (limpo) out[k] = limpo;
  }
  return out;
}

export function lerUtm(storage: StorageLike): UtmBag {
  try {
    const cru = storage.getItem(CHAVE_UTM_SESSAO);
    if (!cru) return {};
    const obj = JSON.parse(cru) as Record<string, unknown>;
    const out: UtmBag = {};
    for (const k of CHAVES_UTM) {
      const v = obj[k];
      if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 120);
    }
    return out;
  } catch {
    return {};
  }
}

/** Chave nova da URL substitui a da sessão. Chave ausente na URL não apaga a sessão. */
export function mesclarUtm(anterior: UtmBag, daUrl: UtmBag): UtmBag {
  return { ...anterior, ...daUrl };
}

export function persistirUtm(search: string, storage: StorageLike): UtmBag {
  const junto = mesclarUtm(lerUtm(storage), lerUtmDeParams(new URLSearchParams(search)));
  try {
    storage.setItem(CHAVE_UTM_SESSAO, JSON.stringify(junto));
  } catch {
    /* sessão bloqueada: a visita segue sem etiqueta */
  }
  return junto;
}

export function sanitizarOrigem(valor: string): string {
  const s = valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const limpo = s.replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24);
  return limpo;
}

/**
 * Fonte explícita ganha do clique. Sem fonte, gclid é Google e fbclid é Meta.
 * Qualquer outro utm_source vira a própria etiqueta, saneada.
 */
export function origemDaEtiqueta(utm: UtmBag): string {
  const src = (utm.utm_source || '').toLowerCase().trim();
  if (/^(meta|facebook|instagram|fb|meta_ads)$/.test(src)) return 'meta_ads';
  if (src === 'google' || src === 'adwords' || src === 'google_ads') return 'google';
  if (utm.gclid) return 'google';
  if (utm.fbclid) return 'meta_ads';
  if (src) return sanitizarOrigem(src);
  return '';
}

export function pacoteDaRota(pathname: string, pacoteExplicito?: string): string {
  if (pacoteExplicito === 'reveillon' || pacoteExplicito === 'detox') return pacoteExplicito;
  const p = pathname.toLowerCase();
  if (p.includes('detox')) return 'detox';
  if (/reveillon|new-years-eve|ano-nuevo|silvester|new-year/.test(p)) return 'reveillon';
  return '';
}

/** [google-reveillon], [meta_ads-reveillon], [instagram-detox], ou '' se não há origem. */
export function etiqueta(utm: UtmBag, pathname: string, pacoteExplicito?: string): string {
  const origem = origemDaEtiqueta(utm);
  if (!origem) return '';
  const pacote = pacoteDaRota(pathname, pacoteExplicito);
  return pacote ? `[${origem}-${pacote}]` : `[${origem}]`;
}

export function comEtiqueta(href: string, marca: string): string {
  if (!marca || !href.includes('wa.me')) return href;
  try {
    const u = new URL(href);
    const txt = u.searchParams.get('text') || '';
    if (txt.includes(marca)) return href;
    u.searchParams.set('text', txt ? `${txt} ${marca}` : marca);
    return u.toString();
  } catch {
    return href;
  }
}
