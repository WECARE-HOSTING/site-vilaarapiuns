import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { LOCALES } from '@/i18n/config';

/**
 * O DIÁRIO — os textos que existem para ser encontrados na busca.
 *
 * As onze páginas do site respondem a quem JÁ conhece a Villa. O diário
 * responde a quem procura o Arapiuns, Alter do Chão, um lugar para um retiro
 * ou a virada do ano — e não sabe que a Villa existe. É o único conteúdo do
 * site cuja métrica é entrada de tráfego, e não conversão direta.
 *
 * POR QUE COLEÇÃO E NÃO PageKey. As páginas vivem num mapa fechado em
 * `routes.ts`, com slug nos cinco idiomas. Um post não tem isso: nasce em um
 * idioma, às vezes ganha par em outro, e a lista cresce toda semana. Pôr post
 * em `routes.ts` seria reescrever o roteador do site a cada texto novo.
 *
 * `grupo` é o que amarra as versões de idioma de um MESMO texto. Dois arquivos
 * com o mesmo `grupo` são o mesmo post em idiomas diferentes, e é dele que sai
 * o hreflang recíproco. Post sem par fica sozinho e anuncia só a si mesmo —
 * que é o correto: hreflang para página inexistente é promessa falsa.
 */
const diario = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/diario' }),
  schema: z.object({
    /** Idioma DESTE arquivo. */
    locale: z.enum(LOCALES),
    /** Amarra as versões de idioma do mesmo texto. */
    grupo: z.string(),
    /** Slug final na URL, no idioma do arquivo. Sem barras. */
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug em minúsculas, números e hífen'),
    titulo: z.string(),
    /** Vira <title> e og:title. Curto — o site já acrescenta a marca. */
    tituloCurto: z.string().optional(),
    descricao: z.string(),
    /**
     * A RESPOSTA DIRETA, de 40 a 90 palavras, que abre o post.
     *
     * Não é resumo nem chamada: é a resposta completa à pergunta do título,
     * escrita para ser extraída inteira por quem lê a página — pessoa ou
     * modelo de linguagem. O resto do texto sustenta e detalha; esta parte
     * tem de fazer sentido sozinha, fora de contexto, com o nome do lugar e
     * um número dentro dela.
     */
    resposta: z.string(),
    data: z.coerce.date(),
    /** Data da última revisão de fato. Frescor conta para busca com IA. */
    revisado: z.coerce.date().optional(),
    /** Nome do arquivo em src/assets/imgs, sem extensão. */
    imagem: z.string(),
    imagemAlt: z.string(),
    legenda: z.string(),
    /** Perguntas do fim do post; saem em FAQPage. */
    duvidas: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    /** Para onde o post empurra: chave de página do site. */
    destino: z.string().default('book'),
    /** Fora do índice enquanto for rascunho. */
    rascunho: z.boolean().default(false),
  }),
});

export const collections = { diario };
