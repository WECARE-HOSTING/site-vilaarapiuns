import { DEFAULT_LOCALE, LOCALES, type Locale } from './config';
import en from './en.json';
import pt from './pt.json';
import es from './es.json';
import de from './de.json';
import ja from './ja.json';

type Dict = Record<string, unknown>;

const DICTS: Record<Locale, Dict> = { en, pt, es, de, ja } as Record<Locale, Dict>;

function lookup(dict: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Dict)) return (acc as Dict)[part];
    return undefined;
  }, dict);
}

/**
 * Resolve uma chave de texto para o idioma pedido.
 *
 * Cadeia de fallback: idioma pedido → DEFAULT_LOCALE. Cada idioma renderiza
 * com seu próprio dicionário; se uma chave específica ainda faltar nele,
 * cai em DEFAULT_LOCALE em vez de quebrar ou mostrar a chave crua.
 */
export function useTranslations(locale: Locale) {
  return function t(key: string): string {
    for (const candidate of [locale, DEFAULT_LOCALE]) {
      const value = lookup(DICTS[candidate], key);
      if (typeof value === 'string' && value.length > 0) return value;
    }
    if (import.meta.env.DEV) console.warn(`[i18n] chave sem tradução: ${key}`);
    return key;
  };
}

/** Igual a useTranslations, mas para chaves que guardam listas (ex: itens de um roteiro). */
export function useList(locale: Locale) {
  return function tList<T = string>(key: string): T[] {
    for (const candidate of [locale, DEFAULT_LOCALE]) {
      const value = lookup(DICTS[candidate], key);
      if (Array.isArray(value)) return value as T[];
    }
    if (import.meta.env.DEV) console.warn(`[i18n] lista sem tradução: ${key}`);
    return [];
  };
}

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
