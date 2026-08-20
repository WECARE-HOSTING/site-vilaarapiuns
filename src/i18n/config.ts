export const LOCALES = ['en', 'pt', 'es', 'de', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Os idiomas que têm dicionário COMPLETO e podem ser servidos, anunciados e
 * rotulados como tal.
 *
 * VIRADA DA FASE 6 (20/08/2026). Aqui existia `BUILD_LOCALE: Locale = 'pt'`, que
 * forçava TODOS os prefixos a renderizar em português enquanto o cliente revisava
 * o conteúdo no idioma dele. Isso cumpriu o seu papel e criou um defeito que
 * nenhum gate do projeto pegava: as 40 páginas de /en/, /es/, /de/ e /ja/ saíam
 * em português, com `<html lang="en">` sobre texto português e hreflang dizendo
 * ao Google que existiam cinco versões de idioma. Pior que não ter os idiomas —
 * em leitor de tela, `lang="en"` sobre português é lido com voz inglesa, o que
 * torna a página ininteligível para quem depende dele.
 *
 * O cliente mandou traduzir os cinco e pôr no ar. Com os quatro dicionários
 * preenchidos (194 chaves cada, conferidas contra pt.json), a correção deixou de
 * ser "parar de prometer" e passou a ser "cumprir a promessa".
 *
 * POR QUE É UMA LISTA E NÃO UM BOOLEANO OU UM ESCALAR. A constante anterior era
 * tudo-ou-nada: ou um idioma único forçado, ou nada. Com ela, no dia em que um
 * sexto idioma entrasse pela metade, ele voltaria a ser anunciado sem tradução e
 * o defeito acima renasceria em silêncio — e o guarda teria desaparecido
 * justamente quando cobertura parcial passa a ser possível. Uma lista cobre
 * cobertura parcial, e é UMA fonte de verdade: quem anuncia, quem gera página e
 * quem entra no seletor leem daqui.
 *
 * REGRA DE ADMISSÃO: entra idioma cujo dicionário está completo, não idioma cujo
 * arquivo existe. `LOCALES` é o conjunto de idiomas CONHECIDOS (é dele que sai o
 * tipo); este é o dos idiomas PRONTOS. Hoje são iguais. Um idioma novo nasce em
 * `LOCALES` e só entra aqui quando `npm run i18n:check` (tools/i18n-parity.mjs)
 * acusar zero chave faltando contra o pt.
 */
export const READY_LOCALES: readonly Locale[] = ['pt', 'en', 'es', 'de', 'ja'];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
  de: 'Deutsch',
  ja: '日本語',
};

/** Usado em <html lang> e nas tags hreflang. */
export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  pt: 'pt-BR',
  es: 'es',
  de: 'de',
  ja: 'ja',
};
