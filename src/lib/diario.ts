import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/i18n/config';

export type Post = CollectionEntry<'diario'>;

/** O prefixo do diário é o mesmo em todos os idiomas — a palavra é curta e viaja. */
export const DIARIO = 'diario';

export function caminhoDoPost(locale: Locale, slug: string): string {
  return `/${locale}/${DIARIO}/${slug}/`;
}

export function caminhoDoIndice(locale: Locale): string {
  return `/${locale}/${DIARIO}/`;
}

/** Posts publicados, do mais novo para o mais velho. */
export async function posts(locale?: Locale): Promise<Post[]> {
  const todos = await getCollection('diario', ({ data }) => !data.rascunho);
  const filtrados = locale ? todos.filter((p) => p.data.locale === locale) : todos;
  return filtrados.sort((a, b) => b.data.data.valueOf() - a.data.data.valueOf());
}

/**
 * Os idiomas que TÊM post publicado.
 *
 * É esta lista que decide onde o diário existe, e é por isso que ela é
 * calculada e não escrita à mão: o dia em que sair o primeiro post em alemão,
 * o índice alemão passa a ser gerado e o link aparece no rodapé sem que
 * ninguém precise lembrar de mexer aqui.
 */
export async function idiomasComDiario(): Promise<Locale[]> {
  const todos = await posts();
  return [...new Set(todos.map((p) => p.data.locale))];
}

/** As versões de idioma do mesmo texto, para o hreflang recíproco. */
export async function alternativasDoGrupo(grupo: string) {
  const todos = await posts();
  return todos
    .filter((p) => p.data.grupo === grupo)
    .map((p) => ({ locale: p.data.locale, caminho: caminhoDoPost(p.data.locale, p.data.slug) }));
}

/**
 * Leituras seguintes: outros posts do MESMO idioma, mais novos primeiro,
 * excluindo o atual. Sem invenção de "relacionado" — o site não tem tags e
 * fingir afinidade temática com três posts no ar seria enfeite.
 */
export async function proximasLeituras(atual: Post, quantas = 3): Promise<Post[]> {
  const todos = await posts(atual.data.locale);
  return todos.filter((p) => p.id !== atual.id).slice(0, quantas);
}

export function dataLegivel(locale: Locale, d: Date): string {
  const tag = locale === 'pt' ? 'pt-BR' : locale;
  return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}
