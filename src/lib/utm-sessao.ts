/** UTM da entrada, guardado na sessão. Sem UTM, o evento leva '(none)'. */
const CHAVES = ['utm_source', 'utm_campaign', 'utm_content'] as const;
export type UtmEvento = Record<(typeof CHAVES)[number], string>;

export function lerUtmSessao(search: string, storage: Pick<Storage, 'getItem' | 'setItem'>): UtmEvento {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  let guardado: Record<string, string> = {};
  try {
    const bruto = JSON.parse(storage.getItem('va_utm') || '{}') as unknown;
    if (bruto && typeof bruto === 'object') guardado = bruto as Record<string, string>;
  } catch { /* sessão ilegível */ }
  const atual: Record<string, string> = {};
  for (const k of CHAVES) {
    const v = q.get(k);
    if (v) atual[k] = v;
  }
  const junto = { ...guardado, ...atual };
  if (Object.keys(atual).length) {
    try { storage.setItem('va_utm', JSON.stringify(junto)); } catch { /* modo privado */ }
  }
  return {
    utm_source: junto.utm_source || '(none)',
    utm_campaign: junto.utm_campaign || '(none)',
    utm_content: junto.utm_content || '(none)',
  };
}
