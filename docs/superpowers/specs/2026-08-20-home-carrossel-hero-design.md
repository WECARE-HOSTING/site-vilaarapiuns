# Home — carrossel de hero com movimento

Data: 2026-08-20 · branch `redesign` · status: aprovado pelo cliente, pré-implementação

## Problema

A home mostra **três** fotos (`hero2`, `gal5`, `gal3`) e nenhum movimento. O
cliente descreveu como "só uma imagem estática" e pediu mais fotos, movimento e,
se possível, vídeo. O acervo tem ~55 fotos em resolução real paradas em
`Assets/Media/`, nunca importadas.

## Decisão de rota

Três caminhos foram apresentados. O cliente escolheu **B — carrossel React de
verdade**, com a ressalva registrada: custa JavaScript de framework num site que
hoje tem zero, e sacrifica a Disciplina 3 do design system (região reservada onde
tipo nenhum entra). A escolha é dele e está documentada aqui, não relitigada.

Base: [Hero Carousel](https://21st.dev/@crafterui/components/hero-carousel) de
`crafterui` no 21st.dev — filmstrip onde os cards dividem uma aresta de topo, o
card focado abre até a altura cheia e os vizinhos ficam cortados pela metade.

O comparativo com o [Elegant Carousel](https://21st.dev/@dev.yadhakim/components/elegant-carousel)
(split-panel, que preservaria a Disciplina 3) **não foi feito**: o limite de 2
retrievals/dia do 21st foi atingido em 20/08. Se a implementação do crafterui
decepcionar, esse é o primeiro fallback a avaliar.

## Auditoria do acervo (feita, não estimada)

| Pasta | Arquivos | Usáveis | Nota |
|---|---|---|---|
| `Anúncio/` | 49 | **45** | 40 com ≥3000px de largura; uma a 6240×4160. 42 paisagem, 3 retrato. O acervo real. |
| `Site 2026/` | 13 | **10** | Originais >2MB: `hero1.jpg` 9.2MB, `hero3.jpg` 6.7MB, `IMG_5859.jpg` 8.1MB, `IMG_0896.jpg` 7.2MB, `sobre.jpg` 6.9MB. Subpastas `Abertura site/`, `sessao 2/`, `sessao 3/`. |
| `Airbnb/` | 32 | **32** | 1200px, recompressa por Airbnb (webp/avif). 19 paisagem, **13 retrato**. Reserva de baixa resolução. |
| `Site - acomodações/` | 36 | **0** | Capturas de tela do Wix antigo, 1270×848, com chrome de página. |
| `Site - experiências/` | 34 | **0** | Idem. |

64 dos 168 arquivos são `Captura de tela 2025-04-14 *`. **Descartados.**

## Consequência: o card não é 3:4

O componente crava `CARD_AR = 0.75` (3:4 retrato) com `objectPosition: "50% 26%"`
— calibragem de rosto, para editorial de moda. **93% do acervo bom é paisagem**, e
bangalô, rio e mata morrem em corte retrato.

**Decisão:** a largura de cada card passa a ser derivada do aspect ratio da própria
foto. Paisagem gera card largo; retrato gera card estreito; nenhuma foto é cortada
destrutivamente.

A **altura continua exatamente como no original** — o card focado em `fullH`, os
vizinhos em `halfH`, todos dividindo a mesma aresta de topo. Só a largura passa a
variar por item. O gesto central do componente (o focado abrindo inteiro no meio de
uma fileira de cortados) é preservado; é o que faz a tira ler.

Isto não é só acomodação técnica — é *cunhas de largura desigual dividindo uma
emenda*, que é literalmente a gramática de marchetaria declarada no `global.css`.
Ganho colateral: reel vertical de Instagram cabe nativamente como card estreito.

Implementação: `step` e `xFor(i)` deixam de derivar de uma constante única e passam
a ler um array de offsets cumulativos. `dragConstraints`, o snap do `onDragEnd` e o
trilho de posição consomem o mesmo array. ~15 linhas.

## O que sai do componente, e por quê

| No original | Destino | Motivo |
|---|---|---|
| `accent` + `mixBlendMode: "color"` + `multiply` 55% | **Removido.** Fica só um `multiply` leve no verde da marca, para legibilidade. | Preserva a luminância e aplica o matiz do acento: **destrói a cor real da foto**, toda imagem vira monocromática. O `global.css` declara que "as cores saíram dos pixels dessas fotos". Tingir o Arapiuns de `#7b61ff` inverte a tese da marca. |
| Grão de filme SVG, `opacity 0.22`, `mix-blend-overlay` | **Removido.** | Disciplina 1: "Todo ornamento é artefato real do sistema. Nunca um floreio desenhado." |
| `font-mono` em `credit` e `meta` | `.etiqueta` e `.numero` (Archivo Narrow, `tabular-nums`) | O sistema não tem mono. |
| Barra de topo: `brand`, `onBack`, `onMenu` | **Props não passadas.** | Colidem com o `Header.astro` existente. |
| `bg-black`, `text-white` | `--color-mata-funda`, `--color-creme` | Paleta. |
| `CARD_AR = 0.75`, `objectPosition: 50% 26%` | Largura por foto (ver acima) | Acervo é paisagem. |
| `focus-visible:ring-white/40` | `--anel-foco` / `outline` do `global.css` | O sistema já define anel de foco por contexto; `border-radius: 0` é regra ("marchetaria não tem raio"). |

**Preservado sem mexer** (é o que justifica usar o componente): geometria toda
medida por um `ResizeObserver` em razões do palco; `useReducedMotion`; o drag que
lê o motion value real no meio da mola em vez do destino da spring; teclado com
setas/Home/End; `role="group"`, `aria-roledescription="carousel"`, `aria-current`;
scroll chaining nas pontas; `rounded-none` nos cards.

## Decisões de estrutura

**1. O `<h1>` não entra no carrossel.**
O componente troca um `<h2>` dentro de `AnimatePresence`. Se o carrossel virasse o
hero inteiro, o título da página seria texto rotativo — ruim para indexação e pior
para o público #2 do `PRODUCT.md` (estrangeiro comparando pousadas em várias abas).

`t('home.hookA')` / `t('home.hookB')` permanecem num `<h1>` estático sobreposto ao
palco. Cada slide carrega apenas legenda, via os campos `credit` e `meta` que o
componente já tem — encaixam em `.etiqueta` e `.numero` sem violência.

**Aqui a Disciplina 3 cai:** haverá tipo sobre foto. Trade-off aceito
explicitamente pelo cliente. Mitigação: o `<h1>` fica na metade superior, acima da
aresta de topo da tira (`STRIP_TOP = 0.5`), sobre a faixa mais escura do wash — não
espalhado sobre o assunto da imagem.

**2. A captura de `wheel` é desligada.**
O original faz `e.preventDefault()` no `wheel` no meio da tira, devolvendo o gesto
só nas pontas. Com ~9 slides, um visitante de desktop rolando para baixo precisa
ciclar os 9 antes da página andar — e o que está abaixo é o preço.

Drag, clique e setas ficam. A roda do mouse é da página. O handler de `wheel` sai
inteiro (não fica um `if` morto).

**3. O hero não vai a `100svh`.**
Altura `clamp` deixando página visível abaixo, para que exista affordance de
scroll. Sem isto o carrossel lê como página inteira e o resto da home fica
invisível na primeira dobra.

**4. `autoplay` ligado, `autoplayDelay` 5500ms.**
O componente já pausa em hover, drag e foco. 4000ms (default) é apressado para
fotografia de paisagem. `useReducedMotion` já neutraliza a animação; o timer
também deve ser suprimido sob `prefers-reduced-motion` — verificar, porque o
original **não** faz isso (o `useEffect` de autoplay não olha `reduced`). É um bug
a corrigir na adaptação.

## Vídeo

Não existe um único arquivo de vídeo no projeto (`find` por `mp4|webm|mov|m4v`:
zero). O cliente informou que só há material no **Instagram**.

- O tipo do item ganha `video?: string`, usando a foto como `poster`.
- Render: `<video muted loop playsinline preload="none" poster={image}>` no lugar
  do `<img>`, mesma caixa, sem mudança de layout.
- Reel é 9:16 e muito comprimido. Num hero widescreen estica e aparece
  macro-blocking; como **card estreito** da tira (ver "o card não é 3:4") funciona,
  e footage de celular ali lê como autenticidade, não como produção ruim.
- **Pendência do cliente:** o @ da conta, para avaliação clipe por clipe antes de
  qualquer uso. Nada é baixado ou publicado sem essa avaliação e sem ordem dele.
- Nenhum vídeo será gerado por IA. `PRODUCT.md` proíbe alegação falsa, e footage
  sintética de uma pousada real é exatamente isso.

## Curadoria de fotos

8 a 10 slides, escolhidos de `Anúncio/` e `Site 2026/` (resolução real),
priorizando o que a home **ainda não mostra**: bangalô externo, pavilhão na mata,
caiaques, café da manhã, varanda à noite, o rio, a comunidade.

Importados para `src/assets/imgs/` com nomes descritivos (o padrão do repo, não
`IMG_5859`). `astro:assets` gera os derivados; os originais de 6–9MB **não** vão
para o bundle.

Cada slide carrega: `image`, `credit` (o assunto, em `.etiqueta`), `meta` (a medida
declarada — Disciplina 2: "toda grandeza assenta numa medida declarada").

## Dependências novas

`@astrojs/react`, `react`, `react-dom`, `framer-motion`, e um `src/lib/utils.ts`
com `cn` (`clsx` + `tailwind-merge`) — o `registryDependencies` do componente vem
vazio, então esse arquivo é nosso.

Montagem: island Astro com `client:visible`, para não bloquear o first paint.
O `<h1>`, os CTAs e a `Campo` do hero ficam em Astro estático **fora** da island —
renderizam sem JS.

**O tamanho real do bundle será medido depois do `npm run build` e reportado ao
cliente em número, não estimado.** Público #1 é "brasileiro no celular, em rede
móvel instável" (`PRODUCT.md`); se o número for indefensável, a conversa sobre
rota reabre com dado na mão.

## Degradação sem JS — e o flash na primeira pintura

**Correção de uma afirmação errada da primeira versão desta spec.** O componente
não degrada bem sozinho. Toda a geometria deriva de `box`, que começa em
`{w: 0, h: 0}` e só é preenchido pelo `ResizeObserver` dentro de um `useEffect`.
No HTML de build isso dá `fullH = clamp(0 × 0.264, 96, 360) = 96` e `cardW = 72`:
uma fileira de cards de 96px de altura, não "o primeiro slide".

São **dois** problemas, não um:

1. **Sem JS** — fica o layout degenerado, permanentemente.
2. **Com JS** — o mesmo layout degenerado é pintado primeiro e só salta para o
   tamanho certo depois da hidratação e do primeiro callback do observer. Um
   pulo visível, e pior sob `client:visible`.

**Solução, obrigatória na adaptação (não opcional):**

- O hero renderiza um `<Image>` do `astro:assets` do primeiro slide como camada
  estática de base, em Astro puro, fora da island. É o que aparece sem JS e é o
  que é pintado primeiro com JS.
- O palco recebe `aspect-ratio` e `min-height` em CSS, para ter altura real antes
  de qualquer medição.
- A island sobrepõe a camada estática e só se torna visível quando `box.w > 0`
  (opacidade/`visibility` comandada pela medição, com transição curta). Antes
  disso o componente **não** desenha a tira.
- `<h1>`, CTAs e `Campo` já estão fora da island e não dependem disto.

Resultado: sem JS a home mostra uma foto de hero estática de qualidade, com CTA
funcional — pior que o carrossel, mas honesta e nunca quebrada. Com JS não há
pulo de layout.

Isto é item de verificação, não de intenção: ver checklist 6 e 11.

## Fora de escopo

Não se toca em: `FaixaGarantias`, "A travessia", "A casa", "Um dia na Villa",
"Duas maneiras de ficar", o fechamento, nem em qualquer outra página. A tira
"lista de corte" e a mídia sticky do caminho A ficam registradas como ideias
disponíveis, **não implementadas**.

## Verificação antes de entregar

1. `npm run build` passa; `npm run check` sem erro novo de tipo.
2. `npm run dev` e **o cliente abre a URL local** — portão de aprovação da fase.
3. Tamanho do bundle JS medido e reportado.
4. Teclado: Tab chega ao palco, setas/Home/End navegam, anel de foco visível.
5. `prefers-reduced-motion: reduce` — sem movimento **e sem autoplay**.
6. Sem JS (DevTools → desabilitar JavaScript) — foto de hero estática visível em
   tamanho correto, CTAs clicáveis, nenhum card de 96px.
7. Roda do mouse rola a página, não a tira.
8. Contraste do `<h1>` sobre a foto mais clara da tira, medido, ≥4.5:1.
9. Celular estreito (360px): tira com swipe, `<h1>` sem encolher abaixo do mínimo
   do clamp (Disciplina 4).
10. Rede lenta simulada (3G, throttle de CPU 4×): **nenhum pulo de layout** entre
    a primeira pintura e a hidratação. É o cenário do público #1.
11. Nenhum `git push`, nenhum deploy. Publicar é fase separada, só com ordem direta.
