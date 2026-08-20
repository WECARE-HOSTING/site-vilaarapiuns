/**
 * CARROSSEL DO HERO — a tira de cunhas.
 *
 * Adaptado de "Hero Carousel" de @crafterui (21st.dev). O que veio de lá é o
 * MECANISMO: geometria medida por ResizeObserver em razões do palco, drag que
 * lê o motion value real no meio da mola, e a tira onde todos os cards dividem
 * uma aresta de topo com o focado abrindo até a altura cheia.
 * Registro: docs/superpowers/specs/2026-08-20-home-carrossel-hero-design.md
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SEGUNDA RODADA (20/08/2026). O cliente olhou a primeira e disse: "não dá para
 * ver direito as imagens no plano de fundo". Estava certo, e a causa era
 * estrutural, não de calibragem.
 *
 * O original desenha a foto focada DUAS VEZES: ampliada e rebaixada como campo
 * de fundo, e nítida dentro do card. Como o <h1> ficava sobre esse campo, ele
 * precisava de véu suficiente para o tipo passar AA — na medição, 0,86 de
 * opacidade efetiva. Contraste de 9,1:1 e a fotografia a 14% de visibilidade.
 * Escurecer menos quebraria o texto; manter o texto ali obrigava a escurecer.
 *
 * O campo de fundo foi então REMOVIDO, e com ele o véu. Consequências:
 *   · O chão do palco é verde sólido da marca. O tipo assenta em terra firme,
 *     sem véu, sem gradiente e sem problema de contraste.
 *   · O card cresce de 26% para 80% da altura do palco e passa a ser a peça
 *     principal — a foto em cor cheia, sem nada por cima.
 *   · A Disciplina 3 do design system volta a valer INTEGRALMENTE, inclusive no
 *     desktop: nenhum tipo sobre fotografia em lugar nenhum da página.
 *
 * O que se perdeu: a assinatura do componente original, em que o fundo inteiro
 * se re-gradua para a foto focada. Era justamente o que causava a reclamação.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * O QUE SAIU do original, e por quê:
 *   · O hue-grading por `accent` (mixBlendMode 'color'). Preservava a luminância
 *     e trocava o matiz: toda foto virava monocromática. O design system nasceu
 *     dos pixels destas fotos; tingir o Arapiuns de violeta inverteria a tese.
 *   · O campo de fundo e o véu (ver acima).
 *   · O grão de filme em SVG. Disciplina 1: ornamento é artefato real do
 *     sistema, nunca floreio desenhado.
 *   · A barra de topo com brand/Back/Menu — colidiria com o Header.astro.
 *   · `font-mono` — o sistema não tem mono. Virou .etiqueta e .numero.
 *   · A captura de `wheel`. O original previne o scroll no meio da tira e só
 *     devolve o gesto nas pontas; com 9 slides o visitante de desktop teria de
 *     ciclar os 9 antes da página andar, e o que está abaixo é o preço.
 *   · O <h2> rotativo. O <h1> vive fora desta island e não gira: título que
 *     troca sozinho é ruim para indexação e pior para quem compara pousadas em
 *     várias abas, que é metade do público.
 *
 * O QUE FOI CORRIGIDO (bugs do original, não gosto):
 *   · O useEffect do autoplay não olhava `useReducedMotion`. Parava a animação e
 *     deixava o timer: quem pede movimento reduzido continuava tendo slides
 *     trocando sozinhos.
 *   · Toda a geometria deriva de `box`, que nasce {0,0} e só é preenchido pelo
 *     ResizeObserver dentro de um effect. No HTML de build isso dava cards
 *     atarracados, pintados antes da hidratação. A tira não desenha até medir.
 *
 * O QUE FOI ACRESCENTADO:
 *   · Largura por card derivada do aspect ratio da própria foto (o original
 *     cravava 3:4 retrato, calibragem de editorial de moda). O acervo da Villa é
 *     93% paisagem. Cunhas de largura desigual dividindo uma emenda é, por
 *     acaso, a gramática de marchetaria do global.css.
 *   · Suporte a vídeo por item, com a foto como poster.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TERCEIRA RODADA (20/08/2026) — PISTA CIRCULAR.
 *
 * O cliente: "não to gostando da galeria da home, quero poder arrastar com o
 * mouse na foto, tipo agarrar — agora só dá pra clicar nas fotos que estão
 * menorzinhas do lado. E outra: quero um loop infinito, não que acabe e tenha
 * que voltar."
 *
 * Duas queixas, e elas têm naturezas diferentes.
 *
 * 1. O ARRASTE JÁ FUNCIONAVA. Foi medido com eventos de ponteiro reais antes de
 *    mexer em qualquer linha: `mousedown` no centro do card focado, doze
 *    movimentos de 25px, `mouseup` — a trilha andou 872px e o foco mudou de card.
 *    O gesto nunca foi o problema; a AFORDÂNCIA era. O que faltava:
 *      · a dica `rotuloArraste` existia na interface e não era passada pela Home,
 *        então nada na tela dizia que dava para arrastar;
 *      · um arraste CURTO (abaixo do limiar do framer) terminava como clique no
 *        card sob o cursor, o que lê como "não respondeu" ou "voltou". Agora um
 *        deslocamento acima de 6px cancela o clique.
 *    Registro do método: medir o gesto antes de reescrever o que o produz.
 *
 * 2. O LOOP NÃO EXISTIA, e a estrutura era ativamente incompatível com ele.
 *    Havia um clamp em dois lugares — `limites` + `xFor` e o `dragConstraints`
 *    — que existia por um bom motivo: centrar o card focado abria meia tela de
 *    vazio no primeiro e no último item, e com fundo sólido isso fica gritante.
 *    Numa pista circular esse motivo desaparece junto com as pontas: não há
 *    primeiro nem último, então o foco pode ficar sempre centrado e o clamp saiu
 *    inteiro.
 *
 * COMO A PISTA CIRCULAR FUNCIONA, porque não é óbvio no código:
 *
 *    A tira desenha o acervo TRÊS vezes seguidas. Como o vão é igual entre todos
 *    os cards, o período da repetição é `W = total + gap`, e a posição do card
 *    `j` num flex em sequência é exatamente `offsets[j % N] + floor(j / N) * W`.
 *    Não há posicionamento absoluto: o próprio flex produz a periodicidade.
 *
 *    O foco mora sempre na cópia do MEIO, que tem um acervo inteiro de conteúdo
 *    de cada lado — é isso que garante que nunca se veja o fim da pista.
 *
 *    Ao trocar de card, o alvo não é `xMid(i)` e sim a cópia EQUIVALENTE mais
 *    perto de onde a trilha está agora: `xMid(i) + k·W`. É esse detalhe que faz
 *    o 30 → 1 andar um passo para frente em vez de varrer a tira inteira de
 *    volta. Quando a mola termina, `x` é recolocado em `xMid(i)` sem animação —
 *    e o salto é invisível porque a tira é periódica: `xMid(i)` e `xMid(i) ± W`
 *    desenham exatamente os mesmos pixels.
 *
 *    Os clones são `aria-hidden` e fora da ordem de tabulação. Quem usa leitor
 *    de tela ou teclado navega N cards, não 3N — a repetição é um artefato da
 *    pista, não conteúdo.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import * as React from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';

export interface CarrosselItem {
  /** Chave estável. */
  id: string;
  /** URL da imagem já otimizada pelo astro:assets. */
  src: string;
  /** srcset na escala do card, que agora é a peça principal do hero. */
  srcset?: string;
  /** Descrição real do que está na foto, para leitor de tela. */
  alt: string;
  /** O assunto, em .etiqueta. Ex.: "O bangalô". */
  assunto: string;
  /**
   * A medida declarada — Disciplina 2 do design system: nenhuma grandeza
   * flutua solta. Ex.: "13 bangalôs". Só fato confirmado entra aqui.
   */
  medida?: string;
  /** Proporção largura ÷ altura da foto. Governa a largura do card. */
  ar: number;
  /** Clipe opcional. A imagem vira poster; nada de autoplay com som. */
  video?: string;
}

export interface CarrosselHeroProps {
  items: CarrosselItem[];
  /** Rótulo acessível do grupo, já traduzido. */
  rotulo: string;
  /** Texto do leitor de tela para "slide X de Y", com {n} e {total}. */
  rotuloPosicao: string;
  /**
   * Dica de arraste ao lado do contador. O gesto sempre existiu no componente,
   * mas nada na tela o anunciava e o cliente concluiu que só dava para clicar.
   * Cursor `grab` não é afordância suficiente, e no celular não existe cursor.
   * Desaparece na primeira interação — dita a regra, sai da frente.
   */
  rotuloArraste?: string;
  /** Avança sozinho. Pausa em hover, drag e foco; morre sob reduced-motion. */
  autoplay?: boolean;
  /** @default 5500 — 4000 é apressado para fotografia de paisagem. */
  autoplayDelay?: number;
  className?: string;
}

/* Razões relativas à caixa do palco. Sem campo de fundo, o card é o hero: ele
   passou de 0,264 para 0,80 da altura, e a tira começa no topo. O resto do
   palco é a legenda e o trilho, em chão sólido. */
const CARD_H = 0.76; // altura do card focado ÷ altura do palco
const GAP = 0.03; // vão ÷ largura média do card


/* O `clamp` que vivia aqui morreu com a pista circular: ele existia só para
   limitar a trilha nas duas pontas, e a pista não tem pontas. */

export function CarrosselHero({
  items,
  rotulo,
  rotuloPosicao,
  rotuloArraste,
  autoplay = true,
  autoplayDelay = 5500,
  className,
}: CarrosselHeroProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const [index, setIndex] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [mexeu, setMexeu] = React.useState(false);
  /**
   * Marca que o gesto passou do limiar de arraste. Vive num ref, não em estado:
   * ela é lida no `onClick` do card no mesmo tick do release, e um `setState`
   * aqui só teria efeito no render seguinte — tarde demais para cancelar o
   * clique que se quer cancelar.
   */
  const arrastouRef = React.useRef(false);
  const reduced = useReducedMotion();

  const last = items.length - 1;

  /**
   * Pista circular: o índice dá a volta em vez de bater na ponta. `-1` vira o
   * último e `N` vira o primeiro — o `+ n` antes do módulo existe porque em
   * JavaScript `-1 % 30` é `-1`, não `29`.
   */
  const go = React.useCallback(
    (next: number) => {
      const n = items.length;
      if (n === 0) return;
      setIndex(((next % n) + n) % n);
    },
    [items.length],
  );

  /** Navegação vinda do usuário — ao contrário do autoplay, ela dispensa a dica. */
  const goManual = React.useCallback(
    (next: number) => {
      setMexeu(true);
      go(next);
    },
    [go],
  );

  // Um único observer alimenta toda a medição abaixo.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const read = () => setBox({ w: stage.clientWidth, h: stage.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // `medido` é o portão contra o pulo de layout: antes da primeira leitura do
  // observer toda largura seria 0, e a tira sairia atarracada por um quadro.
  const medido = box.w > 0 && box.h > 0;

  const fullH = Math.max(120, box.h * CARD_H);
  const halfH = fullH * 0.52;

  /**
   * Geometria da tira. A largura sai do aspect de cada foto na ALTURA CHEIA,
   * então o card focado mostra a foto na proporção verdadeira e os vizinhos,
   * em meia altura, ficam sendo uma faixa horizontal da mesma imagem.
   *
   * A largura é limitada a 92% do palco para que, no celular, o card focado
   * ainda deixe ver que existe um vizinho ao lado — sem essa borda a tira não
   * se anuncia como tira e ninguém descobre que dá para arrastar.
   */
  const strip = React.useMemo(() => {
    const teto = box.w > 0 ? box.w * 0.92 : Infinity;
    const larguras = items.map((it) => Math.min(teto, Math.max(48, fullH * it.ar)));
    const media = larguras.reduce((a, b) => a + b, 0) / (larguras.length || 1);
    const gap = Math.max(6, Math.round(media * GAP));
    const offsets: number[] = [];
    let acc = 0;
    for (const w of larguras) {
      offsets.push(acc);
      acc += w + gap;
    }
    const total = offsets.length
      ? offsets[offsets.length - 1]! + larguras[larguras.length - 1]!
      : 0;
    return { larguras, offsets, gap, total };
  }, [items, fullH, box.w]);

  /**
   * O PERÍODO DA PISTA. Como o vão é igual entre todos os cards, repetir o
   * acervo em sequência num flex produz uma tira periódica de passo
   * `total + gap` — e é isso que permite tratar a posição em módulo.
   *
   * Aqui morreu o clamp das duas pontas (`limites` + `dragConstraints`). Ele
   * existia para o primeiro e o último card não abrirem meia tela de vazio ao
   * centrar. Numa pista circular não há primeiro nem último, então o motivo
   * desapareceu junto com as pontas e o foco fica sempre centrado.
   */
  const W = strip.total + strip.gap;

  /** Posição que centra o card `i` da cópia do MEIO — o lar da trilha. */
  const xMid = React.useCallback(
    (i: number) => box.w / 2 - (strip.offsets[i]! + strip.larguras[i]! / 2) - W,
    [box.w, strip, W],
  );

  const x = useMotionValue(0);

  /**
   * A cópia equivalente mais perto de onde a trilha está AGORA. Sem isto, ir do
   * último card para o primeiro varreria a tira inteira de volta — que é
   * exatamente a queixa do cliente ("não que acabe e tenha que voltar").
   */
  const alvoMaisPerto = React.useCallback(
    (i: number, de: number) => {
      const base = xMid(i);
      return base + Math.round((de - base) / W) * W;
    },
    [xMid, W],
  );

  /**
   * A pista desenhada: o acervo três vezes, em sequência num flex. Três é o
   * mínimo que serve — uma cópia à esquerda, a que está em foco, e uma à
   * direita — para que arrastar em qualquer direção sempre encontre conteúdo.
   *
   * Os clones REUSAM o mesmo objeto de item, então `src` e `srcset` são os
   * mesmos e o navegador busca cada foto uma vez, não três. Isso é requisito, e
   * não detalhe: com 30 fotos, errar aqui triplicaria o tráfego do hero.
   */
  const CICLOS = 3;
  const pista = React.useMemo(
    () =>
      Array.from({ length: CICLOS * items.length }, (_, j) => {
        const i = j % items.length;
        return { item: items[i]!, i, j, cyc: Math.floor(j / items.length), chave: `${items[i]!.id}-${j}` };
      }),
    [items],
  );

  /**
   * JANELA DE IMAGENS — e a razão dela existir, que foi medida.
   *
   * `loading="lazy"` NÃO segura uma tira horizontal. A tira inteira está dentro
   * da viewport (ela é só transladada para o lado), então o navegador considera
   * quase tudo "por vir" e baixa. Medido a 390px com 30 fotos: 35 imagens e
   * 1.123 KB na primeira dobra, para um visitante que vê duas fotos.
   *
   * Então o `<img>` só existe para os cards perto do foco. O card em si continua
   * desenhado — a largura vem de `strip.larguras`, não da imagem — então não há
   * pulo de layout quando um vizinho distante entra na janela: o retângulo já
   * estava ali, e só ganha conteúdo.
   *
   * Cinco de cada lado é folga suficiente: um arraste de uma tela mostra dois ou
   * três cards, e o foco (que move a janela) é recalculado ao soltar.
   */
  const JANELA = 5;
  const jFoco = items.length + index; // o foco mora na cópia do meio
  const naJanela = React.useCallback(
    (j: number) => Math.abs(j - jFoco) <= JANELA,
    [jFoco],
  );

  const spring = reduced
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 260, damping: 34, mass: 0.9 };

  /**
   * Pouso inicial, sem animação. `x` nasce em 0, que na pista circular é a
   * ponta ESQUERDA da primeira cópia — abrir ali deixaria a trilha sem conteúdo
   * à esquerda até o primeiro reposicionamento. Na primeira medição ela é posta
   * direto na cópia do meio, que é o lar.
   */
  const pousou = React.useRef(false);
  React.useEffect(() => {
    if (!medido || pousou.current) return;
    pousou.current = true;
    x.set(xMid(index));
  }, [medido, x, xMid, index]);

  /**
   * A trilha é comandada por um motion value, não por uma prop `animate`, para
   * que um drag iniciado no meio da mola leia a posição REAL em vez de onde a
   * mola ia parar — sem isso o card salta ao soltar.
   *
   * O `onComplete` é o fecho da pista circular: ao terminar, `x` volta para a
   * cópia do meio. O salto é invisível porque a tira é periódica — `xMid(i)` e
   * `xMid(i) ± W` desenham os mesmos pixels — e é ele que garante que sobre
   * sempre um acervo inteiro de conteúdo dos dois lados.
   */
  React.useEffect(() => {
    if (dragging || !medido) return;
    const destino = alvoMaisPerto(index, x.get());
    const run = animate(x, destino, {
      ...spring,
      onComplete: () => x.set(xMid(index)),
    });
    return () => run.stop();
    // `spring` é literal; `reduced` é tudo de que ele deriva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, dragging, medido, reduced, x, alvoMaisPerto, xMid]);

  /**
   * Autoplay. O original não olhava `reduced` aqui — parava a animação e
   * deixava o timer, então movimento reduzido ainda trocava de slide sozinho.
   *
   * O `% items.length` é o loop: antes era `index === last ? 0 : index + 1`, que
   * dava o valor certo e a ANIMAÇÃO errada — voltava varrendo a tira. Agora o
   * salto de volta não existe porque a pista não tem fim.
   */
  React.useEffect(() => {
    if (!autoplay || reduced || paused || dragging || !medido || items.length < 2) return;
    const id = window.setTimeout(() => go((index + 1) % items.length), autoplayDelay);
    return () => window.clearTimeout(id);
  }, [autoplay, autoplayDelay, dragging, go, index, items.length, medido, paused, reduced]);

  const ativo = items[index];
  if (!ativo) return null;

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      role="group"
      aria-roledescription="carrossel"
      aria-label={rotulo}
      onKeyDown={(e) => {
        const mapa: Record<string, number> = {
          ArrowLeft: index - 1,
          ArrowRight: index + 1,
          Home: 0,
          End: last,
        };
        if (!(e.key in mapa)) return;
        e.preventDefault();
        goManual(mapa[e.key]!);
      }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn('relative h-full w-full select-none overflow-hidden', className)}
    >
      {/* ── Estado pré-medição, e fallback sem JavaScript ──
             Isto vive DENTRO da island de propósito. Na rodada anterior era um
             <Image> do Astro irmão da island, e duas coisas quebraram: quando o
             autoplay avançava, a foto estática continuava desenhada por cima do
             card focado (duas fotos sobrepostas na tela), e ela interceptava o
             ponteiro, matando o arraste — que sempre existiu no componente, mas
             não chegava a ele.

             Aqui não há como sobrepor: é o MESMO componente decidindo, com a
             mesma flag. E `pointer-events-none` garante que nem durante o fade
             ele roube um gesto. O HTML de build sai com `medido` falso, então
             este bloco é exatamente o que aparece sem JavaScript.          ── */}
      <div
        aria-hidden={medido}
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 flex justify-center',
          'transition-opacity duration-300 motion-reduce:transition-none',
          medido ? 'opacity-0' : 'opacity-100',
        )}
        style={{ height: `${CARD_H * 100}%` }}
      >
        <img
          src={items[0]!.src}
          srcSet={items[0]!.srcset}
          sizes="(min-width: 1024px) 60vw, 92vw"
          alt={items[0]!.alt}
          loading="eager"
          // @ts-expect-error — `fetchpriority` é atributo de HTML, e a definição
          // de tipos do React não o declara em minúsculas.
          fetchpriority="high"
          decoding="sync"
          className="h-full w-auto max-w-[92%] object-cover"
        />
      </div>

      {/* Sem campo de fundo e sem véu. O chão é o verde sólido da seção, e a
          fotografia aparece só uma vez: dentro do card, em cor cheia.

          A tira só entra depois da primeira medição. Sem este portão o HTML de
          build desenha cards fora de escala e a hidratação os arranca de lugar. */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none',
          medido ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="absolute inset-x-0 top-0" style={{ height: fullH }}>
          <motion.div
            className="flex items-start"
            style={{ gap: strip.gap, x, cursor: dragging ? 'grabbing' : 'grab' }}
            drag="x"
            /* `dragMomentum` fica FALSO de propósito. Com inércia ligada o
               framer continua decaindo depois do release enquanto a nossa mola
               tenta pousar no card — duas animações disputando o mesmo valor. O
               arremesso já existe, e vem da projeção da velocidade abaixo. */
            dragMomentum={false}
            /* Subiu de 0,08. Naquele valor o gesto era 1:1 e completamente seco:
               um arraste curto voltava ao lugar e lia como "não respondeu", que
               é metade da queixa do cliente. Sem `dragConstraints`: a pista é
               circular e não tem borda onde travar. */
            dragElastic={0.14}
            onDragStart={() => {
              setDragging(true);
              setMexeu(true);
              arrastouRef.current = false;
            }}
            /* Acima de 6px o gesto é arraste, não clique. Sem esta marca o
               `onClick` do card sob o cursor dispara no release e leva o foco
               para ele, desfazendo o arraste — a outra causa da queixa. */
            onDrag={(_, info) => {
              if (Math.abs(info.offset.x) > 6) arrastouRef.current = true;
            }}
            onDragEnd={(_, info) => {
              setDragging(false);
              // Pousa no card cujo centro ficar mais perto da soltura, com a
              // velocidade do arremesso empurrando — um flick passa de um.
              // Com larguras variáveis não há divisão: é busca pelo mais perto.
              //
              // A busca agora é em MÓDULO do período: a trilha pode ter parado
              // em qualquer uma das três cópias, e o que importa é qual card do
              // acervo ficou sob o centro do palco, não qual clone.
              const solto = x.get() + info.velocity.x * 0.18;
              const centroMod = (((box.w / 2 - solto) % W) + W) % W;
              let melhor = 0;
              let menor = Infinity;
              strip.offsets.forEach((off, i) => {
                const c = off + strip.larguras[i]! / 2;
                // Compara também contra as cópias vizinhas: o card mais perto do
                // centro pode estar do outro lado da costura do módulo.
                const d = Math.min(
                  Math.abs(c - centroMod),
                  Math.abs(c - centroMod - W),
                  Math.abs(c - centroMod + W),
                );
                if (d < menor) {
                  menor = d;
                  melhor = i;
                }
              });
              goManual(melhor);
            }}
          >
            {pista.map(({ item: it, i, j, cyc, chave }) => (
              <motion.button
                key={chave}
                type="button"
                /* Só a cópia do meio é conteúdo. As outras duas são a pista, e
                   quem usa teclado ou leitor de tela não deve percorrer 3N
                   cards para dar uma volta em N. */
                aria-hidden={cyc !== 1 ? true : undefined}
                tabIndex={-1}
                aria-label={cyc === 1 ? it.alt : undefined}
                aria-current={cyc === 1 && i === index ? true : undefined}
                onClick={() => {
                  if (arrastouRef.current) return;
                  goManual(i);
                }}
                className="relative shrink-0 overflow-hidden rounded-none bg-mata"
                style={{ width: strip.larguras[i] }}
                animate={{ height: i === index ? fullH : halfH }}
                transition={spring}
              >
                {/* Fora da janela o card fica sendo só o seu retângulo em
                    `bg-mata`. Ele já tem a largura certa, então entrar na
                    janela não mexe no layout — só preenche. */}
                {!naJanela(j) ? null : it.video ? (
                  <video
                    src={it.video}
                    poster={it.src}
                    muted
                    loop
                    playsInline
                    preload="none"
                    autoPlay={cyc === 1 && i === index && !reduced}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={it.src}
                    srcSet={it.srcset}
                    sizes={`${Math.round(strip.larguras[i]!)}px`}
                    alt=""
                    draggable={false}
                    /* Uma única foto no caminho crítico: a que abre centrada, na
                       cópia do meio. O resto da janela é `lazy` — e o que segura
                       o peso não é o `lazy` (que numa tira horizontal dentro da
                       viewport não segura nada), é a janela acima. */
                    loading={cyc === 1 && i === index ? 'eager' : 'lazy'}
                    // @ts-expect-error — `fetchpriority` é atributo de HTML, e a
                    // definição de tipos do React não o declara em minúsculas.
                    fetchpriority={cyc === 1 && i === index ? 'high' : undefined}
                    decoding={cyc === 1 && i === index ? 'sync' : 'async'}
                    className="h-full w-full object-cover"
                  />
                )}
                {/* O não-focado recua só o suficiente para a hierarquia ficar
                    clara. Em 0,28 ele apagava a foto do vizinho; a queixa do
                    cliente era exatamente sobre não ver as imagens. */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0 bg-mata-funda"
                  animate={{ opacity: i === index ? 0 : 0.16 }}
                  transition={spring}
                />
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* ── Legenda e trilho, em chão sólido, ancorados à base do card.
               Antes o trilho era `bottom-0` e caía fora da primeira dobra —
               junto com a dica de arraste, o que anulava a razão dela existir.
               Agora os dois seguem o card, não a borda do palco.          ── */}
        <div className="absolute inset-x-0" style={{ top: fullH + 14 }}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
            <p className="etiqueta text-ouro">{ativo.assunto}</p>
            {ativo.medida ? (
              <p className="numero etiqueta text-salvia">{ativo.medida}</p>
            ) : null}
          </div>

          <div className="mt-4 w-full max-w-[20rem]">
            <div className="numero etiqueta flex items-baseline justify-between text-salvia">
              <span>{String(index + 1).padStart(2, '0')}</span>
              {rotuloArraste ? (
                <span
                  aria-hidden
                  className={cn(
                    'text-ouro transition-opacity duration-500 motion-reduce:transition-none',
                    mexeu ? 'opacity-0' : 'opacity-100',
                  )}
                >
                  &larr; {rotuloArraste} &rarr;
                </span>
              ) : null}
              <span>{String(items.length).padStart(2, '0')}</span>
            </div>
            {/* A emenda: o filete claro do embutido, que é a régua deste sistema. */}
            <div className="emenda relative mt-2 h-px w-full border-t">
              <motion.div
                className="absolute -top-px h-px bg-ouro"
                style={{ width: `${100 / items.length}%` }}
                animate={{ left: `${(index / items.length) * 100}%` }}
                transition={spring}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Anúncio de troca para leitor de tela. Os botões já têm rótulo, mas
          quem não vê precisa saber que a posição mudou. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {rotuloPosicao.replace('{n}', String(index + 1)).replace('{total}', String(items.length))}
        {' — '}
        {ativo.alt}
      </p>
    </div>
  );
}
