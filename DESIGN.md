---
name: Villa Arapiuns
description: Painel de marchetaria — a emenda do embutido como régua de layout, sobre paleta de areia e mar.
colors:
  areia-clara: "#fdf8ee"
  areia: "#f4e7cf"
  areia-sol: "#ad7519"
  areia-funda: "#8a5a1e"
  mar-fundo: "#0d3244"
  mar: "#17506a"
  ceu: "#1b6aad"
  ceu-hover: "#12466f"
  espuma: "#cfe3ec"
  sol: "#e9bd68"
  coral-luz: "#efb391"
  erro: "#a3311a"
  erro-luz: "#efb391"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 7vw, 6rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "0"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 2.5vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  lead:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.6vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Archivo Narrow, Archivo, ui-sans-serif, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.14em"
  button:
    fontFamily: "Archivo Narrow, Archivo, ui-sans-serif, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.12em"
  meta:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  none: "0"
  ponto: "9999px"
spacing:
  medida: "1.5rem"
  header: "5.5rem"
  secao: "clamp(4rem, 9vw, 8rem)"
components:
  button-primary:
    backgroundColor: "{colors.ceu}"
    textColor: "{colors.areia-clara}"
    rounded: "{rounded.none}"
    padding: "0.875rem 2rem"
    height: "3rem"
    typography: "{typography.button}"
  button-primary-hover:
    backgroundColor: "{colors.ceu-hover}"
    textColor: "{colors.areia-clara}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.mar}"
    rounded: "{rounded.none}"
    padding: "0.875rem 2rem"
    height: "3rem"
  button-secondary-hover:
    backgroundColor: "{colors.mar}"
    textColor: "{colors.areia-clara}"
  carousel-arrow:
    backgroundColor: "transparent"
    textColor: "{colors.mar}"
    rounded: "{rounded.none}"
    size: "2.75rem"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.mar-fundo}"
    rounded: "{rounded.none}"
    padding: "0.75rem 0.875rem"
    height: "3rem"
  label-tag:
    textColor: "{colors.areia-funda}"
    typography: "{typography.button}"
---

# Design System: Villa Arapiuns

## Overview

**Creative North Star: "O painel de marchetaria"**

Este documento registra o sistema **como ele está implementado hoje**, extraído de `src/styles/global.css` (479 l.), dos 15 componentes em `src/components/` e das 57 páginas construídas. Não é uma direção nova. A Estrela do Norte acima não foi inventada aqui — está escrita literalmente no topo do `global.css` (`MUNDO: painel de marchetaria`), com quatro disciplinas numeradas, e o trabalho deste arquivo foi transcrever, não propor.

A gramática vem de um objeto real e fotografado: a porta de mogno em `gal5.jpg` é um painel radial facetado, com um campo central octogonal e cunhas irradiando, cada uma com o veio em direção diferente, separadas por emendas escuras. Disso o sistema tira três formas e nenhuma metáfora: **a emenda do embutido é a régua do layout** (o filete de 1px que divide seção de seção), **a cunha é a região** (o corte diagonal de 3,5vw no topo e na base de uma faixa), **o octógono é a forma** (o recorte de avatar e do botão de play). Nenhum ornamento é desenhado; todo ornamento é peça.

O mundo é claro-dominante desde 21/08/2026, e essa inversão é recente e estrutural. O site era escuro (chão `#1d2418`, faixas de seção mais claras que o chão); hoje o chão é areia e o escuro ficou raro — o rodapé e a faixa de fecho de cada página. A consequência é que **a escada de texto inverteu de direção**: o corpo é o valor mais forte da página e o título é mais fraco. Isso está no CSS como decisão declarada, não como descuido.

**Key Characteristics:**
- Raio zero em todo o sistema, com `border-radius: 0` escrito explicitamente e comentado peça por peça — "marchetaria não tem raio: a folha é cortada e mitrada".
- Duas sombras no site inteiro, e nenhum token de sombra. A profundidade é junta e valor, não elevação.
- Uma família tipográfica só (Archivo, variável), usada em três registros por largura, peso e tamanho — nunca por troca de família. Nenhuma serifa.
- Cada cor carrega a razão de contraste medida no comentário, e `tools/contraste-dom.mjs` confere os pares no DOM construído. A paleta nasce verificada ou não nasce.
- O site evita cards. As divisões são feitas por junta e por régua.
- Funciona sem JavaScript: navegação, seletor de idioma e todo caminho para o contato.

## Colors

Areia e mar, tirada de uma foto de referência do cliente — banco de areia dourada avançando dentro do rio, água azul dos dois lados, céu forte. Não há terracota no sistema: o quente é a areia em três valores.

### Primary
- **Céu de meio-dia** (`ceu`): a única cor da paleta que grita, e por isso vive no CTA e no link, **em nada mais**. 5,3:1 sobre areia-clara.
- **Céu fundo** (`ceu-hover`): o hover ESCURECE em vez de clarear, subindo para 9,3:1. É também a aresta do CTA em repouso.

### Secondary
- **Areia ao sol** (`areia-sol`): a régua, a borda, o número. É a cor da emenda, e vai sempre a 100% sem alfa — a 85% cai para 2,96:1 e reprova a SC 1.4.11. A régua do layout não pode ser decorativa.
- **Areia funda** (`areia-funda`): a etiqueta e a medida sobre areia. 5,57:1.

### Tertiary
- **Sol** (`sol`): etiqueta e anel de foco sobre escuro, 7,7:1. É também a cor de `::selection`.
- **Coral de luz** (`coral-luz`): acento **com função**, e só sobre escuro. 4,8:1.

### Neutral
- **Areia seca ao sol** (`areia-clara`): o chão da página.
- **Areia da foto** (`areia`): a superfície de seção. Distingue-se do chão por 1,15× de luminância — visível como junta, não como degrau.
- **Mar fundo** (`mar-fundo`): o corpo do texto, 12,7:1, e o chão do rodapé.
- **Mar** (`mar`): o título, 8,3:1, e a faixa de fecho.
- **Espuma** (`espuma`): o corpo sobre mar-fundo, 10,2:1.

### Named Rules

**A Regra da Voz Única.** `ceu` existe no CTA e no link. Em nada mais — nem em título, nem em ícone, nem em régua. Teste: se um `ceu` aparece onde não se pode clicar, está errado.

**A Regra da Escada Invertida.** No chão claro, o corpo (`mar-fundo`, 12,7:1) é mais forte que o título (`mar`, 8,3:1). Isso é deliberado: a massa de texto pequeno precisa da tinta cheia, e um display de 600 em 125% de largura já carrega peso por tamanho e forma. Repetir a hierarquia do tema escuro daria título preto e corpo cinza, que é o modo de falhar do tema claro.

**A Regra do Contexto, não do Componente.** Anel de foco, cor de título, cor de etiqueta e cor de emenda são variáveis de contexto (`--anel-foco`, `--cor-titulo`, `--cor-etiqueta`, `--cor-emenda`), e `.sobre-escuro` inverte as cinco. Nenhum componente sabe em que fundo está, e um anel único não existe — os 3:1 da SC 1.4.11 têm de valer nos dois lados.

## Typography

**Display Font:** Archivo (variável, eixos `wdth 62..125` e `wght 300..700`)
**Body Font:** Archivo
**Label Font:** Archivo Narrow

**Character:** Uma família só, em três registros. O display é a Archivo **expandida a 125% de largura**, fiel ao wordmark largo e condensado da marca; a etiqueta é a Archivo Narrow, que é o registro da lista de corte do marceneiro; o corpo é a Archivo normal. Nenhuma serifa entra neste sistema — a Fraunces foi testada e saiu. A hierarquia é construída por largura, tamanho e peso, nunca por troca de família.

### Hierarchy
- **Display** (600, `clamp(3.25rem, 7vw, 6rem)`, lh 1.02, ls 0.01em): a frase que abre a página. O mínimo do clamp é grande de propósito — Disciplina 4, a palavra não encolhe no celular.
- **Headline** (600, `clamp(2rem, 4.5vw, 3.25rem)`, lh 1.08): o h2 de seção.
- **Title** (600, `clamp(1.375rem, 2.5vw, 1.875rem)`, lh 1.2): o h3.
- **Lead** (400, `clamp(1.25rem, 1.6vw, 1.3125rem)`, lh 1.6): a abertura de seção, na cor do título. 1,25× o corpo no menor viewport — antes era 1,06×, que não dava hierarquia nenhuma no celular.
- **Body** (400, 1rem, lh 1.7): medida de leitura limitada a 68ch por `container-texto`.
- **Meta** (400, 0.875rem, lh 1.55, `color: inherit`): legenda e nota. **Herda a cor do contexto de propósito** — o degrau aqui é o TAMANHO, não a cor. Havia uma cor própria a 6,23:1 contra um corpo a 7,69:1, degrau de 1,15×, imperceptível: hierarquia falsa é pior que nenhuma.
- **Label** (600, 0.75rem, ls 0.14em, caixa alta, Archivo Narrow): navegação, botão e dado.

### Named Rules

**A Regra dos 12px.** A etiqueta é 12px, não 11px. Abaixo disso o alvo de toque e a legibilidade em kanji quebram, e este site tem japonês.

**A Regra da Etiqueta que não é Olho.** `.etiqueta` **nunca** vai acima de um título. O título carrega o próprio peso. A etiqueta serve navegação, botão e dado.

**A Regra do Japonês.** Em `:lang(ja)` o tracking do display vai a 0, as entrelinhas abrem (display 1.35, título 1.4), a etiqueta perde a caixa alta e sobe para 14px — caixa alta é no-op em kana e 12px com tracking fica ilegível. A stack ganha Hiragino Sans e Noto Sans JP porque a Archivo não tem cobertura CJK e, sem isso, cada kanji cai no system-ui glifo a glifo.

## Layout

Grid de container editorial: `max-width: 84rem`, com padding que abre em dois degraus (`1.25rem` → `2.5rem` a 48rem → `4rem` a 80rem). O texto corrido tem container próprio de `68ch`. O ritmo vertical de seção é `clamp(4rem, 9vw, 8rem)`.

**Breakpoints:** os defaults do Tailwind v4, sem nenhum `--breakpoint-*` customizado. As media queries escritas à mão usam `48rem` e `80rem`.

O header é fixo e reserva `5.5rem`, exposto como a classe `pt-header` que as páginas internas aplicam. A densidade é deliberadamente alta — Disciplina 4, "informação empacotada densa em vez de arejada em nada".

### Named Rules

**A Regra da Região Reservada** (Disciplina 3). A composição reserva uma região onde tipo nenhum entra, para a fotografia da casa nunca ser sobrescrita. Consequência hoje: **não existe tipo sobre fotografia em nenhuma página**, nem no celular.

**A Regra da Medida Declarada** (Disciplina 2). Toda grandeza assenta numa medida declarada — `--spacing-medida: 1.5rem`. Nenhum número flutua solto, e todo dado de campo (1h30, 13 bangalôs, os quilômetros, o preço) entra por um componente que o declara.

## Elevation & Depth

O sistema é **plano por convicção, não por omissão**. Existem exatamente duas sombras em todo o site e nenhum token de sombra:

- `0 10px 26px -12px rgb(0 0 0 / 0.6)` — nas polaroides giradas de `ListaExperiencias.astro:84`, onde a sombra existe porque a peça está fisicamente jogada sobre a mesa.
- `shadow-lg` do Tailwind — no dropdown do seletor de idioma em `Header.astro:81`, onde a sombra separa uma camada que flutua de verdade.

Em todo o resto, a profundidade é feita por **junta e valor**: a emenda de 1px, o degrau de 1,15× entre as duas areias, e o contraste do bloco `.sobre-escuro`.

### Named Rules

**A Regra da Junta que Divide.** Onde outro sistema poria dois cards, este põe uma junta. "Duas maneiras de ficar" (`Home.astro:581`) é comentada no código como "não dois cards: sem raio, sem sombra, a junta é que divide".

## Shapes

**Raio zero, em todo o sistema.** `border-radius: 0` está escrito explicitamente em `:focus-visible`, `.btn`, `.seta-carrossel` e `.campo-form`, cada um com o comentário "marchetaria não tem raio: a folha é cortada e mitrada". As duas únicas exceções são os pontos de 8–10px do `LinhaDoDia` (`rounded-full`) e o `rounded-none` explícito do card do `CarrosselHero`.

Três formas recorrentes, todas `clip-path` e todas derivadas do painel:

- **Cunha** (`cunha-topo` / `cunha-base`): o corte diagonal de `3.5vw` que faz uma faixa entrar e sair do painel como peça mitrada.
- **Octógono** (`octogono`): o campo central da porta, usado no recorte de iniciais e no botão de play.
- **Emenda** (`emenda`): o filete de 1px em `--cor-emenda`. É estrutura, não enfeite — e é por isso que uma linha reta é honesta aqui e um traço ondulado "desenhado à mão" não seria.

## Components

### Buttons
- **Shape:** aresta reta, sem raio (`border-radius: 0`). Altura mínima 3rem, padding `0.875rem 2rem`.
- **Tipo:** Archivo Narrow 600 a 0.8125rem, caixa alta, `letter-spacing: 0.12em`.
- **Primary:** preenchimento `ceu` com texto `areia-clara`; a aresta em `ceu-hover` reforça o limite. O hover **escurece** para `ceu-hover`.
- **Secondary:** transparente, texto na cor do título, aresta a 55% do título. No hover inverte — preenche com a cor do título e o texto vira areia.
- **Transição:** 0,25s em `background-color`, `color` e `border-color`.

### Carousel Arrow
Quadrado de 2,75rem (44px) para satisfazer a SC 2.5.8, e **não** herda `.btn`, porque o padding de 2rem daria um retângulo de 100px para uma seta de 16. A aresta é a **70%** da cor do título, não os 55% do `.btn-secundario`: sem rótulo de texto, a aresta é a única coisa que delimita a área clicável, e a 55% ela reprovaria a SC 1.4.11 sobre um dos chãos escuros do sistema.

### Inputs / Fields
- **Style:** fundo em 5% de `mar-fundo`, aresta de 1px na cor da emenda, sem raio. Altura mínima 3rem.
- **Focus:** o anel global (`--anel-foco`, 2px, offset 3px) vale sem override.
- **Error:** `erro` (#a3311a) sobre areia e `erro-luz` sobre mar — dois valores porque o formulário existe nos dois contextos. **Erro nunca é comunicado só por cor:** vem com texto e com `aria-invalid`.

### Navigation
Header fixo que passa de transparente a sólido no scroll. Os itens são `.etiqueta` (Archivo Narrow, caixa alta, tracked), com `aria-current="page"` na página corrente. O seletor de idioma e o menu mobile são `<details>` nativos, e o menu mobile é um painel `.sobre-escuro` em tela cheia. **Ambos funcionam sem JavaScript** — o script só adiciona a trava de scroll, o foco e o Esc.

### Signature: A emenda e a régua de legenda
O elemento que mais identifica este sistema não é um card: é a **régua de legenda** — uma linha de `emenda` com informação à esquerda e comando à direita, em `.etiqueta` e `.numero`. Ela aparece sob o mapa, sob o vídeo e sob o carrossel, e é o que faz um bloco de mídia ler como aparelho em vez de mais uma foto na página.

### Signature: LinhaDoDia
"O rio que desce a página": um SVG de meandro com uma timeline ancorada, usado em "Um dia na Villa". É o único lugar do sistema com `rounded-full`, nos pontos de 8–10px da linha.

### Signature: ListaCorte
A "lista de corte do marceneiro": `<dl>` de peça · descrição · medida, com os números em `tabular-nums`. É o componente que materializa a Disciplina 2.

## Do's and Don'ts

### Do:
- **Do** escrever a razão de contraste medida no comentário de cada token novo. `tools/contraste-dom.mjs` lê os hexes do `@theme` e confere os pares no DOM construído.
- **Do** manter `border-radius: 0` e declará-lo explicitamente, com o motivo, em cada peça nova.
- **Do** usar `--cor-titulo` / `--cor-etiqueta` / `--cor-emenda` / `--anel-foco` em vez de cor literal, para a peça funcionar na areia e em `.sobre-escuro` sem saber onde está.
- **Do** manter todo estilo de base **dentro** de `@layer base`. Estilo sem camada vence qualquer utilitário do Tailwind — foi assim que um `h2 { color }` apagou um título claro sobre fundo escuro.
- **Do** dar a cada grandeza uma medida declarada, e a cada legenda o nome da peça e o que acontece ("A piracaia · o grupo em roda na areia, à luz de velas"), nunca o clima.
- **Do** rodar `node tools/classes-fantasma.mjs $(find dist -name "*.html")` a cada rodada de CSS. **Com os arquivos como argumento** — sem eles o script checa zero classes e passa em falso.

### Don't:
- **Don't** usar `ceu` fora de CTA e link.
- **Don't** pôr `.etiqueta` acima de um título.
- **Don't** cair no agrupamento que este CSS recusa por escrito: fundo creme + serifa de alto contraste + acento terracota. É o agrupamento em que interfaces geradas por máquina caem, e a fase anterior deste site acertava os três alvos ao mesmo tempo.
- **Don't** introduzir cor nova sem auditar a paleta — cada token deste tema carrega uma medida, e um vermelho inventado obriga a refazer a conta.
- **Don't** desenhar ornamento. Todo ornamento é artefato real do sistema: emenda de folha, número de peça, borda de corte (Disciplina 1). Sem isso, marchetaria vira textura de madeira de fundo, que é o modo de falhar desta direção.
- **Don't** pôr tipo sobre fotografia sem derrubar a Disciplina 3 de propósito e por escrito.
- **Don't** assumir comprimento de string do português: cinco idiomas, incluindo japonês.
- **Don't** exigir JavaScript para navegar, trocar idioma ou chegar ao contato.
