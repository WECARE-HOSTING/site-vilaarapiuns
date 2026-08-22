# Direção visual — Fase 1 do redesign

22/08/2026. Traduz "Amazônia caribenha, com os vídeos em primeiro plano" em decisões que a
Fase 2 vai construir de verdade e o Carlos vai aprovar **olhando**, não lendo. Este
documento não decide a paleta — ver §5, a tensão fica explicitamente para a Fase 2.

## 1. A tese, em uma linha

**Da água larga para a madeira de perto.**

A página abre no que vende a Caribe — luz, escala, água — e cada passo de rolagem estreita
o foco até o material que nenhuma pousada vizinha pode copiar: a marchetaria, a tecelagem, a
fibra trançada. Não são dois assuntos concorrendo por atenção. É uma câmera só, descendo do
rio até a porta. Caribe é a luz e a água; Amazônia é a madeira e a mão — a home literal do
PRODUCT.md, virada em direção de movimento.

Isso resolve a pergunta que "Amazônia caribenha" deixa em aberto: não é escolher entre bioma
e objeto, é uma sequência que visita os dois, na ordem que o produto pede — primeiro o
argumento que atrai (o lugar), depois o argumento que retém e diferencia (a casa).

## 2. O que o acervo já confirmou (matéria-prima da tese, não invenção)

Do PRODUCT.md e do plano, verificado com o cliente — nada aqui é novo, é o que a direção
tem de carregar:

- Água doce transparente e quente o ano todo, praia de rio, quase sem mosquito —
  comparativo com a Amazônia de várzea, **nunca pH, nunca zero**.
- Banco de areia dourada avançando dentro do rio, água azul dos dois lados — a foto que
  origina a paleta atual.
- Botos tucuxi, menores, aparecem pertinho da Villa.
- Duas estações: jan–jul cheia (igapós, a canoa passa entre as copas), ago–dez seca (as
  praias de areia branca aparecem). Transformar "época de chuva" em paisagem que só existe
  naquele semestre é o maior ganho de venda em aberto — e é matéria de vídeo, não de foto
  estática, porque o que vende é a canoa **se movendo** entre as copas.
- Sem TV, Starlink só para comunicação — desconexão como virtude, não carência.
- Chuveiro de poço artesiano, pressão forte, sem aquecedor — vender como "não precisa".
- Energia solar confirmada; nunca "off-grid" ou "autossuficiente".
- O contraponto que segura tudo: mogno, marchetaria radial, tecelagem em xadrez de
  chocolate e aveia, luminária de fibra trançada, arquitetura tapajônica de dois andares.

## 3. Moodboard — 11 referências de galeria de premiação

Buscadas no Awwwards (autorizado pelo §0.3 do plano: direção de movimento e composição, não
código; nenhum site de hotelaria e nenhum 21st.dev consultado nesta rodada). Para cada uma:
o padrão, o que se tira dela, e como ele encontra as restrições deste site — 3G/4G,
sem-JS obrigatório, vertical.

1. **Video / Media Mask Hero** (padrão nomeado; visto em execução no site de vídeo
   "Lightship", que usa uma máscara SVG para revelar vídeo ao rolar). **O que tirar:** o
   tipo como janela para o vídeo, não como legenda sobre ele. **Onde entra:** candidato da
   variante B da Fase 2 — e é a derrubada deliberada da Disciplina 3, que só se testa ali.
   **O que não serve puro:** precisa de fallback sem JS — sem máscara, o vídeo ainda tem
   que estar visível e jogável.

2. **Locomotive / Sequence Scroll** (padrão nomeado; visto em "Zandbeek — The Full Story").
   **O que tirar:** vídeo ou sequência atado à posição de scroll, não ao tempo — é o
   mecanismo literal da tese "água larga → madeira de perto": a câmera dá zoom conforme se
   rola, não conforme o tempo passa. **Onde entra:** a transição entre o hero e "A casa" na
   home. **O que não serve puro:** biblioteca de scroll suave (a maioria implementa com
   `Locomotive Scroll` ou equivalente) reescreve o scroll nativo — o site precisa continuar
   funcionando com o scroll do navegador puro; o efeito visual pode ficar, o mecanismo tem
   que ser CSS (`scroll-timeline` / `animation-timeline`) com fallback estático.

3. **Text Mask Reveal** (padrão nomeado; visto em "Mediterranean Dream" — imagem grande com
   texto revelado ao rolar). **O que tirar:** o título como recorte que deixa a fotografia
   passar por dentro da letra, em vez de flutuar por cima. **Onde entra:** mesmo candidato
   da variante B, para o gancho "Um Caribe de água doce e quente". **Risco:** é o padrão
   mais fácil de cair no genérico "hero cinematográfico de agência" que a frontend-design
   adverte — só sobrevive se o material dentro da máscara for a marchetaria ou a água real
   da Villa, nunca stock.

4. **Horizontal Scroll Hijack / rolagem mista** (padrão nomeado; visto em "Ognissanti",
   scrollytelling horizontal com Locomotive Scroll). **O que tirar:** dar ao vídeo vertical
   o próprio eixo de movimento, em vez de espremê-lo numa tira horizontal pensada para
   paisagem. **Onde entra:** candidato de mecanismo para a variante C (a coluna de reels).
   **Risco medido:** o site já paga 149 KB de framer-motion por dois carrosséis (Fase 0,
   §3.3); um segundo eixo de scroll sequestrado em JS dobraria a aposta. A alternativa mais
   barata — `scroll-snap-type` nativo — entra na mesa como candidata igual, não descartada
   por conveniência (o plano já manda avaliar isso na Fase 4).

5. **Scroll Video Gallery Selector** (padrão nomeado; visto em "BADASS films", seletor de
   vídeo por scroll com navegação incomum). **O que tirar:** deixar o visitante escolher
   entre vários vídeos sem abrir um player pesado — o próprio scroll troca o clipe em foco.
   **Onde entra:** a Fase 3 tem 37 vídeos e só 1 no ar; este é o padrão que evita construir
   uma "sala de vídeos" que o cliente já recusou (§0.3) — a escolha vive dentro da página,
   não numa tela dedicada.

6. **Vídeo como âncora de navegação, não decoração** (visto em "Isra Design", introdução em
   vídeo que também organiza o about-us). **O que tirar:** o vídeo do drone hoje está
   encostado no mapa como extra (Home.astro:469-513); este padrão sugere dar a ele uma cena
   própria, com a legenda de peso e MB que já existe, mas sem competir com o mapa pela
   mesma régua visual.

7. **Índice vertical de vídeo** (visto em "We Were Kids", listagem vertical de projetos que
   revela vídeo por item). **O que tirar:** a coluna de reels não precisa ser um carrossel
   com setas — pode ser uma lista que se rola, cada item revelando o próprio clipe. É o
   candidato mais barato em JS para a variante C, porque a interação é rolagem, não
   arrasto.

8. **Sticky-Stack Sections** (vocabulário `design-taste-frontend` §10 — seções que fixam e
   empilham no scroll). **O que tirar:** é o mecanismo natural para "Duas maneiras de
   ficar" e para o `LinhaDoDia` ("o rio que desce a página") — o conteúdo avança sobre um
   painel que já existe fixo, em vez de duas seções soltas. Já existe no vocabulário do
   projeto como skeleton canônico (design-taste-frontend §5.A), então entra sem trazer
   biblioteca nova.

9. **Zoom Parallax** (vocabulário §10 — imagem de fundo central que dá zoom ao rolar). **O
   que tirar:** é a implementação mecânica mais simples da tese: uma imagem ou vídeo aéreo
   que aproxima até a cunha entrar. Mais barato que Locomotive Scroll porque não precisa de
   uma sequência de quadros, só de um `transform: scale()` ligado ao scroll.

10. **Immersive Photo Gallery, minimal fullscreen** (padrão observado em galeria de
    fotografia em tela cheia, sem cromo de interface). **O que tirar:** para a Galeria —
    hoje 30 fotos em grade `<figure>` sem lightbox, de propósito (§2.7 do plano) — este
    padrão sugere manter a ausência de lightbox mas dar a cada foto mais ar: menos grade,
    mais tela, texto reduzido ao mínimo. Reforça a decisão já tomada de não construir
    lightbox nenhum.

11. **Coverflow / Accordion Image Slider** (vocabulário §10). **O que tirar:** duas
    alternativas de baixo custo ao `CarrosselHero` atual para exibir muitas fotos em
    retrato sem arrasto contínuo — cada uma com seu próprio custo de JS, ambas mais leves
    que framer-motion. Ficam registradas como opção da Fase 4, não escolhidas aqui.

**O que nenhuma das 11 resolve, e fica registrado como trabalho novo desta direção:** poster
por vídeo (hoje 1 para 37), o peso declarado por clipe na legenda, e o comportamento sob
`prefers-reduced-motion` de um vídeo de fundo — que a Fase 3 já sabe que não é "pausar", é
decidir se o vídeo existe. Nenhuma referência de galeria de premiação resolve isso porque é
uma restrição de produto (celular em 3G/4G instável), não uma questão de composição.

## 4. Os dials

| Dial | Valor de partida | Por quê |
|---|---|---|
| `DESIGN_VARIANCE` | **7** (de 10) | O sistema atual já não é simetria perfeita — tem cunha, octógono, emenda — mas é disciplinado. Leitura do site de hoje: ~6. O cliente autorizou "nova direção visual" (§0.3: tipografia, formas, grid e densidade voltam à mesa), o que a `design-taste-frontend` §1.A classifica como redesign-overhaul (+2 sobre a leitura atual). Fica em 7, não em 9-10: o preset "trust-first / celular em sinal ruim" (§1.A) empurra para baixo, porque a decisão em jogo é reservar uma pousada remota, não impressionar por 5 segundos numa agência. |
| `MOTION_INTENSITY` | **5** (de 10) | Hoje o site tem framer-motion só nos dois carrosséis e transições CSS de 0,2–0,55s — leitura ~3. +2 do overhaul dá 5: cinematográfico o bastante para o vídeo em primeiro plano ganhar peso, mas abaixo do "8-10 / Awwwards experimental" que o próprio vocabulário reserva para agência, não para decisão de viagem. A Fase 5 tem o filtro (`find-animation-opportunities`) que corta isto para 5-7 momentos reais no site inteiro, então este número é o teto, não a meta por seção. |
| `VISUAL_DENSITY` | **4** (de 10) | Sem mudança da leitura atual. A Disciplina 4 do sistema — "coragem de densidade: uma palavra em corpo que não encolhe no celular" — já é uma decisão de produto, não de estilo, e nenhuma das quatro perguntas do cliente em §0.3 pediu para abrir mão dela. |

Os três valores são ponto de partida para a Fase 2, não veredito. As três variantes vão
materializar leituras ligeiramente diferentes destes dials — A mais próxima de 6/4/4, B mais
próxima de 8/7/4, C testando densidade abaixo de 4 porque a coluna de reels precisa de mais
ar por item.

## 5. A tensão — resolvida, olhando, em 22/08/2026

A paleta areia-e-mar é decisão do cliente, de 21/08, tirada de uma foto dele. A leitura
recomendada era que a paleta sobrevive como o eixo caribenho, e o que muda é forma,
tipografia, escala, densidade e movimento. **Confirmado, ao vivo, não por captura**: o Carlos
escolheu a variante **C — "O vertical manda"**. A paleta sobrevive intacta — C não troca
nenhum token. A Disciplina 3 também sobrevive aqui: diferente de B, o título de C não fica
sobre mídia nenhuma, fica sobre `areia-clara` plana, acima da tira.

### 5.1 A especificação da direção escolhida, para a Fase 3 em diante

Registrado aqui porque a superfície de exploração (`src/pages/prototypes/hero-fase2.astro`)
foi apagada por Hard Rule da skill `prototype` assim que a escolha foi feita — o código de
rascunho não é a fonte de verdade, este parágrafo é.

- **A coluna de retrato é a estrutura da página, não um carrossel a mais.** Resolve os dois
  achados do §1 item 4 do plano na mesma decisão: as ~1.100 fotos em retrato do acervo E os
  vídeos verticais, na mesma tira, sem tratamento especial por tipo de mídia.
- **Mecanismo, testado e funcionando sem JavaScript nenhum**: `scroll-snap-type: x mandatory`
  no contêiner, `scroll-snap-align: start` em cada cartão. O arrasto, o toque e a rolagem por
  teclado (o contêiner leva `tabindex="0"`) vêm todos do navegador. Os vídeos usam
  `autoplay muted loop playsinline preload="none"` — os quatro atributos nativos, e é por
  isso que a tira inteira funciona sem uma linha de script. Isto responde direto à
  preocupação de orçamento de JS da Fase 0/1 (§3.3 da revisão: 149 KB de framer-motion só
  para dois carrosséis hoje) — aqui o candidato mais caro (`Horizontal Scroll Hijack` com
  biblioteca) foi descartado a favor do nativo, como o moodboard (§3, referência 4) já
  recomendava.
- **Cartão**: `aspect-ratio: 9/16`, largura `min(72vw, 19rem)` — no celular mostra quase um
  cartão cheio com uma fatia do próximo, convidando a arrastar; no desktop mostra vários por
  vez. Legenda no canto inferior esquerdo, no estilo `.etiqueta` já existente, com o sufixo
  "· vídeo" só nos cartões de vídeo (via atributo `data-video`, não uma segunda variante de
  componente).
- **O título fica quieto de propósito**: `var(--text-titulo)` exato (não um novo passo de
  escala) — o eixo de C é estrutural, não tipográfico. A tira é a protagonista.
- **O que a Fase 2 não resolveu, e é bloqueio real da Fase 3 antes de aplicar de verdade —
  este é o achado mais importante para quem assumir a partir daqui**: o único material em
  vídeo **vertical** do acervo inteiro são os 5 Reels institucionais, e os 5 têm o título de
  capítulo **queimado no pixel, em PT/EN**, não em faixa de legenda separada (memória de
  projeto `villa-arapiuns-reels-legenda-queimada`, confirmado extraindo quadros de três
  Reels diferentes). Isso quebra a paridade de 5 idiomas que o resto do site garante
  (`tools/i18n-parity.mjs`) para qualquer cartão de vídeo que use esse material direto. Duas
  saídas, nenhuma testada ainda: (a) recortar 9:16 a partir do material horizontal SEM
  legenda que existe em `Capas - Home LP/` (perde largura, ganha paridade de idioma); ou
  (b) aceitar os 5 Reels como conteúdo bônus só em PT/EN, fora do rodízio dos outros idiomas.
  A Fase 3 decide isso antes de qualquer cartão de vídeo entrar em produção.
- **Também não resolvido**: quantos vídeos autoplayando ao mesmo tempo a página aguenta. O
  protótipo tocava os três de uma vez, sem janela — aceitável para 3 cartões de teste, não
  para a coluna real com dezenas. O `CarrosselHero` já tem a disciplina certa para isto (só
  os cartões a até 5 posições do foco existem de verdade no DOM — Fase 0 §3, achado do
  `loading="lazy"` que não segura tira horizontal); a Fase 4 aplica a mesma janela aqui, por
  `IntersectionObserver` ou pelo equivalente sem JS de só carregar o vídeo quando o cartão
  entra na área visível.
- **Curadoria de conteúdo**: os 8 cartões do protótipo (boto tucuxi, canoa na cheia, banco de
  areia, massagem, tecelagem, comunidades a remo, redário, trilha da Samaúma) foram escolhidos
  rápido, para testar a composição — não é a seleção final. A Fase 3 recura do acervo de 2.201
  fotos e 37 vídeos com o método de folha de contato já existente
  (`tools/acervo-folhas.mjs`).

## 6. O intocável

Herdado da Fase 0 e do plano, mais um item novo que a auditoria de mídia descobriu:

- AA de contraste medido (`tools/contraste-dom.mjs`, com os arquivos como argumento).
- Funcionar sem JavaScript: navegação, seletor de idioma, todo caminho para o contato.
- Cobertura CJK — o japonês não pode virar glifo-a-glifo do system-ui.
- Conferir a 500px via viewport (não 390 via `--window-size`).
- Os cinco verificadores do projeto, todos passando com os arquivos construídos.
- **Nitidez em DPR 2 — item novo.** A Fase 0 mediu que hoje toda imagem do site entrega
  ~0,54× dos pixels que um aparelho retina precisa (`docs/revisao-2026-08-22.md` §3.1). Não
  se filma ou fotografa nada de novo para este redesign sem o `widths`/`sizes` cobrir 2×.
- **Não ampliar imagem nova por modelo.** As 24 fotos já ampliadas em 20/08 ficam, por
  decisão do cliente (`PRODUCT.md`, "Procedência da fotografia"); nenhuma foto ou quadro de
  vídeo novo desta direção é ampliado por IA. Fonte maior vem do acervo bruto.
- Orçamento de JS declarado antes de escrever cada componente novo, com a alternativa CSS
  avaliada de propósito — não descartada por conveniência (Fase 4 do plano).
- O peso da home no celular não pode voltar a superar o do desktop (hoje 1.689,6 KB contra
  1.364,8 KB — Fase 0, §3.2).

## 7. O que este documento não fez

Não escolheu a paleta, não desenhou nenhum componente, e não construiu nada. A tese e o
moodboard aqui são a direção para a Fase 2 materializar em três variantes reais — com foto e
vídeo do acervo, atrás de um picker, fora do build de produção. É olhando essas três que a
tese acima se confirma ou se corrige.
