# O mapa de situação do Arapiuns

Data: 2026-08-20 · branch `redesign` · status: implementado

## Problema

O cliente trouxe `Assets/Docs/Mapa Arapiuns.png` — um mapa ilustrado da região,
já na paleta da marca — e disse por que importa:

> "quem vai para a amazonia, quer saber onde esta indo"

O site não respondia isso em lugar nenhum. A lista de três etapas da travessia
responde a **sequência** (voo → traslado → lancha) e nunca responde o **lugar**.
São perguntas diferentes, e ninguém processa uma sequência de três baldeações
sem antes ter o lugar na cabeça.

## O ativo

1120 × 955, PNG, 1,86 MB. Moldura ornamentada fechando em `#192815` — a dois
passos de `--color-mata-funda` (`#1d2418`). Não foi feito para este site e
combina com ele por acidente feliz: a borda da ilustração **é** a borda da
página, sem anel nosso em volta.

Cinco rótulos: `VILLA ARAPIUNS`, `RIO ARAPIUNS`, `RIO AMAZONAS` (duas vezes),
`RIO TAPAJÓS`, `SANTARÉM`, `ALTER DO CHÃO`. Todos topônimos — iguais nos cinco
idiomas do site, então **não existem cinco versões do mapa** e não vai existir.
Só a palavra "RIO" mudaria, e ela está dentro do desenho.

Copiado para `src/assets/imgs/mapa-arapiuns.png`, porque `Assets/` é
gitignorado: é acervo bruto, e os derivados versionados moram em
`src/assets/imgs/`. O `astro:assets` gera 3 escalas em webp — **45 KB / 94 KB /
164 KB** contra 1,86 MB do original.

## Onde entra, e por quê

### 1. Como chegar — antes da lista de etapas

A página tem no cabeçalho a nota "sem foto grande de propósito: aqui o visitante
quer resposta, não atmosfera". O mapa é a exceção e a nota foi ampliada para
dizer por quê: **o mapa não é atmosfera, é a resposta**. Fica na seção própria
"Onde a Villa fica", *antes* de "A travessia".

Consequência de estrutura: a lista de etapas ganhou o seu próprio `<h2>` e os
itens caíram para `h3`. Antes a lista era a primeira coisa depois do `<h1>` e
por isso os itens eram `h2` — com uma seção de mapa na frente, aquilo passaria
a pular nível no outline.

### 2. Home — fechando a seção "A travessia"

Em largura cheia do container, embaixo da grade de duas colunas, seguido do link
para Como chegar. **Não** dentro da cunha estreita da esquerda (0,8fr ≈ 400px):
ali os rótulos ficariam ilegíveis, e mapa ilegível é decoração — decoração aqui
seria mentira.

### 3. Onde NÃO entra

Reservar e Pacotes. O mapa responde "onde fica", e quem chegou nessas páginas já
sabe. Repetir diluiria.

## Não é um Google Maps

O mapa da casa não tem escala nem estrada, porque ali **não há estrada** — o
último trecho é rio. Um mapa de navegação prometeria uma rota que não existe.
Este orienta, e orientar é o que o visitante pede neste momento.

## O componente

`src/components/MapaSituacao.astro`, uma peça para os dois usos.

- **Legenda** na régua da lista de corte, com as medidas saindo de
  `src/data/site.ts` (`river`, `boatMinutes`, `departsFrom`) e não do texto —
  Disciplina 2. `boatMinutes: 90` é formatado como `1h30` no componente.
- **`alt`** carrega a informação, não a descrição visual: é o que o leitor de
  tela ouve e o que aparece quando a imagem não carrega no 3G do rio. Diz as
  relações espaciais na ordem em que importam.
- **Lupa só abaixo de `lg`.** A partir de 1024px o mapa já sai perto do tamanho
  desenhado; a lupa ali seria botão que não faz diferença.
- **`<dialog>` nativo**, sem biblioteca e sem island: Esc fecha, clique na
  margem fecha.

## Duas correções que só apareceram no screenshot

Vistas em Playwright a 390px e 1440px, depois da primeira implementação:

1. **O rótulo "AMPLIAR O MAPA" tapava Alter do Chão.** Estava no canto inferior
   direito da ilustração e escondia justamente o ponto de partida da última
   etapa. Desceu para a régua da legenda. O mapa inteiro continua clicável, com
   `cursor-zoom-in` e sem tinta nossa em cima — Disciplina 3 ao pé da letra.
2. **A lupa abria a 260vw, no canto superior esquerdo.** Duas falhas juntas:
   o canto é floresta sem rótulo, e a 260vw a viewport do telefone deixa de
   conter Villa e Alter do Chão ao mesmo tempo — e é a **relação** entre os dois
   que o mapa existe para mostrar. Ampliar até perder a relação é ampliar contra
   o próprio propósito. Ficou 180vw, aberto já rolado para o eixo entre os dois.

Uma terceira, de CSS: o preflight do Tailwind zera a margem de todo elemento, e
é a margem `auto` que centra um `<dialog>` nativo. Sem `m-auto` explícito ele
encostava no topo e a página aparecia atenuada embaixo.

## Verificação

- `astro build` — 52 páginas, sem erro. Os 4 erros de `astro check` são
  pré-existentes, em `styleguide.astro`, e não têm relação com esta mudança.
- `tools/classes-fantasma.mjs` — 410 classes, nenhuma sem regra.
- `tools/contraste-dom.mjs` — 4999 nós, nenhum abaixo de 4,5:1.
- Screenshots a 390px e 1440px, mapa e diálogo, nas duas páginas.

## i18n

Chaves novas em `src/i18n/pt.json`, bloco `mapa`: `alt`, `ampliar`, `fechar`,
`dialogo`, `aeroporto`, `ondeT`, `ondeI`. **Só em português** — os outros quatro
dicionários seguem stubs e caem no `BUILD_LOCALE`, que é o estado atual do
projeto (tradução é a Fase 2).
