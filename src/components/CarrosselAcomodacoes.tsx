/**
 * CARROSSEL DAS ACOMODAÇÕES — um quadro só, dez folhas.
 *
 * Nasceu de um pedido do cliente em 20/08/2026: a seção "A casa" da home tinha
 * uma foto de um hóspede numa canoa legendada como porta de mogno, e ele pediu
 * "no lugar dessa foto, um carrossel de fotos somente das acomodações, umas 10
 * — inclusive dentro do saiba mais dessa parte".
 *
 * POR QUE NÃO É O `CarrosselHero`. Aquele é uma TIRA: mede o palco por
 * ResizeObserver, deriva a largura de cada card do aspect da própria foto e
 * deixa os vizinhos à vista em meia altura. Aquilo funciona num palco largo, e
 * o lugar desta peça na home é a coluna direita de uma grade de duas colunas —
 * a ~46vw. Uma tira de larguras desiguais dentro de 46vw mostra um card de 200px
 * com dois cotocos ao lado: a mesma queixa de "não dá para ver as imagens" que
 * já custou uma rodada. Aqui o quadro é ÚNICO e a foto ocupa ele inteiro.
 *
 * O que este componente NÃO faz, de propósito:
 *   · Não mede nada. O quadro é `aspect-[3/2]` em CSS e as dez fotos são
 *     2400×1600 de origem, então não há recorte nem pulo de layout — e o HTML de
 *     build já sai com a primeira folha desenhada, o que faz dele o fallback
 *     natural para quem está sem JavaScript.
 *   · Não avança sozinho. O hero autoplaya porque é vitrine acima da dobra;
 *     esta peça fica ao lado de um parágrafo que a pessoa está LENDO, e foto que
 *     troca sozinha no meio da leitura rouba a atenção do texto que ela ilustra.
 *   · Não põe tipo nenhum sobre a fotografia — nem seta, nem contador, nem
 *     legenda. Disciplina 3 do design system, e ela vale aqui igual: o comando e
 *     a legenda moram ABAIXO do quadro, em chão sólido.
 *
 * A transição é FUSÃO, não deslize. Duas razões: deslize num quadro fixo pede
 * medição de largura, que é a fonte dos bugs de hidratação que o hero já pagou;
 * e a página inteira é feita de folhas cortadas e emendadas, sem raio e sem
 * sombra — uma folha que cede lugar à outra no mesmo vão é mais dessa gramática
 * do que uma esteira correndo.
 *
 * O ARRASTE existe e é elástico: `drag="x"` com restrição zero dos dois lados e
 * `dragElastic`, então a pilha cede sob o dedo e volta sozinha; a folha troca na
 * soltura, por deslocamento ou por velocidade. Sem medir nada.
 *
 * SEM SETAS NEM DICA DE ARRASTE (22/08/2026, pedido direto do Carlos: "não
 * gosto do arraste com as setas"). O gesto continua existindo — arrastar ainda
 * troca a folha, e a seta do teclado também —, só a UI que os anunciava saiu:
 * nada de botão de seta, nada de "← arraste →" a desaparecer na primeira
 * interação. O que resta como pista é o cursor `grab`/`grabbing` no quadro e a
 * régua de progresso abaixo dele.
 */
import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';

export interface FolhaCarrossel {
  /** Chave estável. */
  id: string;
  /** URL da imagem já otimizada pelo astro:assets. */
  src: string;
  /** srcset na escala do quadro. */
  srcset?: string;
  /** Descrição real do que está na foto, para leitor de tela. */
  alt: string;
  /** O assunto, em .etiqueta. Ex.: "O bangalô". */
  assunto: string;
  /** O material ou a medida, em .numero. Fato, não elogio. */
  legenda: string;
}

export interface CarrosselAcomodacoesProps {
  folhas: FolhaCarrossel[];
  /** Rótulo acessível do grupo, já traduzido. */
  rotulo: string;
  /** Texto do leitor de tela para "foto X de Y", com {n} e {total}. */
  rotuloPosicao: string;
  /**
   * `sizes` do <img>. Muda com o lugar: na home o quadro é uma coluna de grade,
   * na página da pousada ele é o container inteiro.
   */
  sizes?: string;
  /**
   * A primeira folha entra com prioridade quando o carrossel abre a página — na
   * pousada ele é o elemento de maior área acima da dobra.
   */
  prioridade?: boolean;
  className?: string;
}

/** Quanto o dedo precisa andar, ou arremessar, para a folha virar. */
const LIMIAR_PX = 56;
const LIMIAR_VELOCIDADE = 320;

export function CarrosselAcomodacoes({
  folhas,
  rotulo,
  rotuloPosicao,
  sizes = '100vw',
  prioridade = false,
  className,
}: CarrosselAcomodacoesProps) {
  const [index, setIndex] = React.useState(0);
  const reduzido = useReducedMotion();

  const total = folhas.length;
  const ultima = total - 1;

  /* Circular de propósito: com dez folhas, quem chega na décima e arrasta
     para a frente quer ver a primeira, não travar no fim. */
  const ir = React.useCallback(
    (proxima: number) => {
      setIndex(((proxima % total) + total) % total);
    },
    [total],
  );

  const fusao = reduzido
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.22, 0.61, 0.36, 1] as const };

  const molaArraste = reduzido
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 320, damping: 34 };

  const ativa = folhas[index];
  if (!ativa) return null;

  return (
    <div
      role="group"
      aria-roledescription="carrossel"
      aria-label={rotulo}
      className={cn('select-none', className)}
    >
      {/* ── O QUADRO ──
             3:2, que é o aspect nativo das dez fotos: `object-cover` não corta
             nada e a caixa nunca muda de altura entre folhas. `bg-mar` sob a
             pilha para que, no primeiro quadro de uma fusão, o vão não pisque a
             cor da seção. Foco vive AQUI, não nos botões, porque é o quadro que
             responde às setas do teclado.                                   ── */}
      <motion.div
        tabIndex={0}
        aria-live="off"
        onKeyDown={(e) => {
          const mapa: Record<string, number> = {
            ArrowLeft: index - 1,
            ArrowRight: index + 1,
            Home: 0,
            End: ultima,
          };
          if (!(e.key in mapa)) return;
          e.preventDefault();
          ir(mapa[e.key]!);
        }}
        drag="x"
        dragMomentum={false}
        dragElastic={0.14}
        dragConstraints={{ left: 0, right: 0 }}
        dragTransition={molaArraste}
        onDragEnd={(_, info) => {
          const passou =
            Math.abs(info.offset.x) > LIMIAR_PX ||
            Math.abs(info.velocity.x) > LIMIAR_VELOCIDADE;
          if (!passou) return;
          ir(info.offset.x < 0 ? index + 1 : index - 1);
        }}
        className="relative aspect-[3/2] w-full cursor-grab overflow-hidden bg-areia active:cursor-grabbing"
      >
        {folhas.map((f, i) => (
          <motion.img
            key={f.id}
            src={f.src}
            srcSet={f.srcset}
            sizes={sizes}
            /* A folha à vista é a única que se anuncia; as outras são pilha. O
               texto para leitor de tela vive no aria-live abaixo. */
            alt=""
            aria-hidden
            draggable={false}
            loading={i === 0 && prioridade ? 'eager' : 'lazy'}
            // @ts-expect-error — `fetchpriority` é atributo de HTML, e a
            // definição de tipos do React não o declara em minúsculas.
            fetchpriority={i === 0 && prioridade ? 'high' : undefined}
            decoding={i === 0 && prioridade ? 'sync' : 'async'}
            className="absolute inset-0 h-full w-full object-cover"
            /* `initial` casa com o HTML de build: a folha 0 sai visível e as
               outras transparentes, então não há pisca na hidratação. */
            initial={false}
            style={{ opacity: i === 0 ? 1 : 0 }}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={fusao}
          />
        ))}
      </motion.div>

      {/* ── LEGENDA E COMANDO, em chão sólido ── */}
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
        <p className="etiqueta">{ativa.assunto}</p>
        <p className="meta numero">{ativa.legenda}</p>
      </div>

      <div className="emenda mt-4 flex items-center justify-between gap-6 border-t pt-4">
        {/* O contador e a régua. Mesma emenda do embutido que governa a página:
            um filete claro com o trecho da folha atual em ouro. Sem setas e
            sem dica de arraste — o gesto continua existindo (arrastar e as
            setas do teclado ainda trocam a folha), só a UI que os anunciava
            saiu, a pedido do Carlos em 22/08/2026. */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          <div className="emenda relative hidden h-px w-full max-w-40 border-t sm:block">
            <motion.div
              className="absolute -top-px h-px bg-sol"
              style={{ width: `${100 / total}%` }}
              animate={{ left: `${(index / total) * 100}%` }}
              transition={reduzido ? { duration: 0 } : molaArraste}
            />
          </div>
          <p className="numero etiqueta shrink-0">
            {String(index + 1).padStart(2, '0')}
            <span className="px-1 opacity-60">/</span>
            {String(total).padStart(2, '0')}
          </p>
        </div>
      </div>

      {/* Anúncio de troca. As <img> são todas aria-hidden, então este parágrafo
          é a ÚNICA voz do carrossel para quem não vê — por isso ele carrega o
          alt inteiro, e não só a posição. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {rotuloPosicao.replace('{n}', String(index + 1)).replace('{total}', String(total))}
        {' — '}
        {ativa.assunto}: {ativa.alt}
      </p>
    </div>
  );
}
