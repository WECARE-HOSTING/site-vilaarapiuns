# O acervo de mídia — inventário e destinos

Levantado em 21/08/2026 sobre `Assets/Media/Fotos - Villa Arapiuns/`.
**2.201 imagens (~1,5 GB) e 37 vídeos.** O diretório é gitignorado (`/Assets/`);
os derivados versionados vivem em `src/assets/imgs/`.

Este documento existe porque o conhecimento do acervo, se ficar numa conversa,
morre com ela — e a próxima rodada de foto recomeça do zero.

## Como foi lido, e por quanto

Ler 2.201 imagens uma a uma custaria a ordem de um milhão de tokens de visão.
O caminho usado custou ~43 mil, e está em dois scripts reutilizáveis:

1. **`tools/acervo-inventario.mjs`** — metadados e dHash 8×8 de cada arquivo,
   **sem visão nenhuma**. Agrupa por distância de Hamming ≤ 5 e diz quantos
   *momentos distintos* existem. Resultado: 2.201 arquivos → 1.986 momentos.
   A redução de 10% é o achado, não o fracasso: **este acervo já vem catado**,
   quase não tem rajada. Amostrar, e não desduplicar, é o que economiza aqui.
2. **`tools/acervo-folhas.mjs`** — folhas de contato de 24 miniaturas numeradas
   numa imagem de 1920×1040. O custo de uma imagem é proporcional à área, então
   24 fotos numa folha custam ~2,7k tokens em vez de ~52k. Vídeo entra pelo mesmo
   caminho: um quadro extraído a 40% da duração via `ffmpeg`.

Lidas 16 folhas cobrindo **354 arquivos**: as curadorias inteiras, as pastas
pequenas inteiras, os 37 vídeos, e amostra espalhada das pastas grandes.

    node tools/acervo-inventario.mjs "Assets/Media" inventario.json
    node tools/acervo-folhas.mjs manifesto.txt folhas/ 6 4

## O que existe

| Pasta | Arq. | Retrato | Resolução | O que é |
|---|---:|---:|---|---|
| `4 Grupos e Retiros/*/Captação completa` | 900 | 746 | 3000px+ | Um retiro inteiro em reportagem: chegada, mesa, shala, trilha, canoa, banho de ervas, yoga na praia. **O maior e mais útil bloco do acervo.** |
| `3 Acervo/Casa e Acomodações/Área Externa` | 222 | 85 | 2–3k / 3k+ | Bangalôs por fora e por dentro, varandas, quartos, a marchetaria em close, ipê florido |
| `3 Acervo/Mata/Trilha na Floresta` | 143 | 57 | 2–3k / 3k+ | Trilha, igarapé, árvores gigantes, colmeia de abelha nativa, grupos grandes uniformizados |
| `3 Acervo/Yoga e Práticas` | 129 | 36 | 2–3k | Shala cheia e vazia, asana, savasana, roda de partilha, **a foto do grupo inteiro** |
| `3 Acervo/Água/Rio Arapiuns - Praia` | 102 | 28 | 2–3k / 3k+ | Praia, banho de rio, pôr do sol, roda na areia, fogueira, retratos |
| `3 Acervo/Água/Lago Azul` | 92 | 26 | 2–3k / 3k+ | Canoa, stand-up paddle, mata alagada, massagem na esteira |
| `3 Acervo/Gente/Farinhada` | 73 | 6 | 2–3k | Casa de farinha, forno, peneira, hóspedes com a mão na massa, retratos da comunidade |
| `3 Acervo/Gente/Piracaia` | 73 | 23 | 2–3k / 3k+ | **Velas alinhadas na areia, fogueira, mesa posta na praia à noite, lua cheia** |
| `3 Acervo/Mesa/Mesa e Pratos` | 69 | 52 | 2–3k | Os pratos, o buffet, a mesa comprida, frutas em cestaria |
| `3 Acervo/Água/Canal do Jari` | 62 | 4 | 2–3k | **Lago de vitórias-régias com deck de madeira**, cozinha e almoço da comunidade |
| `3 Acervo/Gente/Banho de Ervas e Puxada de Mãe` | 36+13 | 15 | 3000px+ | Massagem na esteira e o banho de ervas — ritual, não spa |
| `3 Acervo/Mesa/Café da Manhã` | 35 | 21 | 2–3k | Bolo de macaxeira, tapioca, garrafas térmicas, melancia, a mata ao fundo |
| `2 Anúncios/Selecionadas` | 26 | 1 | 3072×2048 e 6240×4160 | **Curadoria humana em resolução cheia.** O melhor ponto de partida |
| `4 Grupos e Retiros/` — um retiro | 20 | 9 | 2–3k | Retiro: shala, altar, abraços, roda de fogo, **e a única foto de ave do acervo** |
| `3 Acervo/Equipe` | 18 | 12 | 2–3k | **Retratos frontais da equipe**: o cozinheiro, as senhoras da cozinha, os barqueiros |
| `4 Grupos e Retiros/` — outro retiro | 16 | 4 | 3000px+ | Retiro: aula na shala, farinhada, tingimento de palha, roda de fogo |
| `1 Site 2026` | 13 | — | até 6240×4160 | Os originais já usados no site, e a **vitória-régia com remador** |
| `3 Acervo/Casa e Acomodações/Espaços e Quartos` | 10 | 2 | 3000px+ | A shala vazia, o buffet, **as quatro cozinheiras de avental** |
| `2 Anúncios/` quartos | 20 | 1 | 3072×2048 | Fotografia de acomodação por tipo de unidade |
| `3 Acervo/Gente/Artesanato` | 8 | 5 | 3000px+ | Cestaria trançada colorida com etiqueta de preço, detalhe do trançado |
| `3 Acervo/Água/Embarque` | 8 | 1 | 2–3k | **Alter do Chão: a passarela azul, os barcos, o grupo na areia** |
| `6 Marca` | 4 | — | 2000×2000 | O logotipo em quatro versões |
| `5 Vídeos/Capas - Home LP` | 32 | — | 1920×1080, 3–47 s | Clipes por tema, com uma subpasta `Seleção/` de 22 que é a curadoria |
| `5 Vídeos/Reels` | 5 | — | 1080×1920, 45–164 s | Peças verticais **já legendadas em PT/EN** |

### `0 Seleção editorial - com gente/` — a melhor curadoria do acervo

**72 arquivos: 63 PNG e 9 AVIF.** Errei esta pasta na primeira leitura e classifiquei
tudo como captura de tela descartável, pelo nome dos arquivos
(`Captura de tela 2025-04-14 ....png`) e pela dimensão irregular (~1290×860).
**Abri as imagens: são fotografia de verdade** — quadro cheio, sem cromo de
navegador, sem cursor, bem iluminadas. E é a curadoria mais bem-feita do acervo:
um quadro por momento, cobrindo o produto inteiro. Vários enquadramentos só
existem aqui — o portão aberto para o rio, a espiral de bancos de tronco na areia,
o **"13" pintado na porta de madeira**, a pia de cuia com girassol, o pavilhão de
palha vazio em três ângulos, o quarto com mosquiteiro de dossel, o peixe assado em
folha de bananeira, a mulher andando sob a passarela coberta de palha.

Cruzando os dHash contra o resto do acervo:

| | | |
|---:|---|---|
| **40** | têm gêmea em resolução MAIOR noutra pasta | usar a gêmea, descartar esta |
| **24** | são **fotografia única**, só existem a ~1290px | é destas que vale pedir o original ao fotógrafo |
| **8** | são `.avif` redimensionado pelo Wix (294–613px) | descartáveis, e 5 são suspeitos — ver abaixo |

As 24 únicas concentram-se em **`Gente e Vivências/` (9)** e **`Água e Praia/` (9)**,
mais `Mesa/` (3), `Mata e Trilha/` (2) e `Casa e Acomodações/` (1). A ~1290px elas
não aguentam largura cheia, mas aguentam **coluna e card** — é a mesma situação que
`src/content-pages/Experiencias.astro` já documenta e resolve, com `widths` que
nunca passam do nativo.

### Refugo de verdade

- **Os 8 `.avif`** da pasta acima, redimensionados pelo Wix. **Cinco têm nome de
  lugar** — `FLORESTA NACIONAL DO TAPAJÓS - ALTER DO CHÃO.avif`,
  `ALTER DO CHÃO _ AMAZÔNIA.avif`, `FLORESTA ENCANTADA - ALTER DO CHÃO.avif`,
  `villa arapiuns - alter do chão.avif`,
  `turismo de cura - massagem - alter do chão.avif`. São exatamente os que o
  `PRODUCT.md` manda não usar sem confirmar autoria e licença: podem ser imagem de
  turismo de terceiros, não fotografia da Villa.
- **`2 Anúncios/Airbnb/` (32).** Derivados baixados, 12 a 1500–2000px e 20 abaixo
  de 1500px. Descartável.

### A regra que este erro deixa

Nome de arquivo não classifica imagem, e dimensão irregular também não —
"Captura de tela" aqui é o nome que o macOS deu a um recorte de fotografia. **Abrir
a imagem antes de decidir.** É barato: 24 miniaturas por folha de contato.
O sinal que de fato separou o refugo foi outro: **extensão `.avif` com dimensão
abaixo de 700px e nome de lugar turístico.**

## O que o acervo tem e o site não

Isto é a lista de ganhos, em ordem de peso:

1. ~~**Vista aérea.**~~ **FEITO em 21/08/2026.**
   `5 Vídeos/.../Seleção/villa arapiuns (drone).MP4` (47 s) mostra os telhados da
   Villa dentro da mata fechada. Foi cortado, transcodificado e está na home,
   encostado no mapa de situação — ver a receita em "Vídeo" mais abaixo.
   `localização_lago azul.MP4` (o lago de cima) continua parado, e é o candidato
   óbvio para a página de Experiências.
2. ~~**A foto do grupo inteiro.**~~ **TENTADO E RECUSADO em 21/08/2026.**
   `3 Acervo/Yoga e Práticas/IMG_3110.jpg`, ~25 pessoas posadas na praia ao pôr
   do sol, entrou como fechamento da página de grupos e o cliente recusou no
   mesmo dia. O arquivo saiu do repositório.

   **A regra que este erro deixa, e ela vale para o site inteiro: retrato de
   grupo posado não vende viagem.** Prova que o grupo esteve aqui — é a foto que
   se manda no grupo da viagem DEPOIS — e não convida ninguém a vir. Ninguém se
   reconhece numa fila de vinte e cinco desconhecidos olhando para a lente. O
   que convida é CENA: gente fazendo alguma coisa, sem olhar para a câmera. O
   fechamento hoje é `3 Acervo/Gente/Piracaia/IMG_3470.jpg` — o grupo em roda na
   areia entre as velas, o rio com a lua atrás — e o mesmo critério trocou mais
   quatro fotos da página na mesma rodada.
3. **Rosto e nome da equipe.** `3 Acervo/Equipe/IMG_3263.jpg` (o cozinheiro de
   touca), `IMG_3282.jpg` e `IMG_3291.jpg` (as senhoras da cozinha),
   `IMG_3164.jpg` (três barqueiros na proa), e
   `Espaços e Quartos/IMG_7396.jpg` (as quatro cozinheiras atrás da mesa posta).
   Hoje a `FaixaGarantias` promete "equipe própria" e "anfitrião local" em texto
   puro. Estas fotos são a prova.
4. **O embarque em Alter do Chão.** `3 Acervo/Água/Embarque/IMG_0841.jpg`,
   `IMG_0848.jpg`, `IMG_0874.jpg`: a passarela azul, os barcos na praia, o grupo
   caminhando na areia, o barco com o grupo de colete. A maior ansiedade do
   visitante é o trajeto, e a página Como Chegar não tem nenhuma foto dele.
5. **A piracaia como ela é.** `3 Acervo/Gente/Piracaia/IMG_3364.jpg` (dezenas de
   velas alinhadas na areia à noite) e `IMG_3403.jpg` (a mesa posta na areia).
   O site fala da piracaia sem mostrar isto.
6. **Vitória-régia.** `3 Acervo/Água/Canal do Jari/IMG_0938.jpg` e `IMG_0957.jpg`
   (o tapete de folhas e o deck sobre o lago), mais `1 Site 2026/Abertura/gal5.png`
   (o remador em pé na canoa entre as folhas, 6240px).
7. **A matéria do posicionamento em close.**
   `Área Externa/IMG_5767.jpg` — a roseta de marchetaria da porta de mogno.
   `Área Externa/IMG_6386.jpg` — o interior com rede, cadeira de balanço e
   luminária de fibra. `Selecionadas/IMG_5859.jpg` — a rede sob o teto de palha.
8. **Uma ave.** `4 Grupos e Retiros/*/IMG_6056.jpg`: ave
   listrada de pernas e bico longos na areia. **Espécie não identificada — não
   nomear.** É a única foto de ave do acervo, e ela salva a seção de observação de
   aves de não ter imagem nenhuma.
9. **Stand-up paddle.** `Selecionadas/IMG_5985.jpg` e `Lago Azul/IMG_6046.jpg`.
   Atividade que o site não menciona.
10. **A mesa posta dentro de uma canoa.** `Selecionadas/IMG_2202.jpg`.
11. **Tingimento de palha com urucum.** Fotos num dos retiros e os
    vídeos `Tingimento de palha.MP4` / `Urucum_tingimento de palha.MP4`: os feixes
    de palha tingidos de laranja e vermelho secando, e as artesãs trançando com
    eles. É a **origem** da tecelagem que o `PRODUCT.md` põe como eixo da marca.
12. **A shala vazia e o pavilhão inteiro.** `Espaços e Quartos/IMG_5927.jpeg` e
    `Selecionadas/IMG_5917.jpg`. É a prova do espaço coberto para grupo.

## Fatos que o acervo revela e o site não conhece

Vêm dos nomes de pasta e de vídeo, e aparecem nas imagens. **Todos precisam de
confirmação do cliente antes de virar texto** — o acervo prova que a cena
aconteceu, não que a atividade esteja em oferta.

- **Meliponário / mel de abelha nativa** — `Meliponário (mel de abelha).MP4`, e a
  colmeia pendurada no tronco em `Trilha na Floresta/IMG_6753.jpg`.
- **Macaco guariba** — `Macaco Guariba (Floresta).MP4`. Casa com a listagem
  "Noite mágica com macacos na Villa Arapiuns" que o `PRODUCT.md` registra.
- **Banho de argila no igarapé** — `Igarapé_Trilha_Argila.MP4`.
- **Canoagem no igapó** e **navegação de canoa** — dois clipes próprios.
- **Puxada de mãe** — massagem tradicional, nome próprio, com 49 fotos.
- **Palha de tucumã** e **urucum** como matéria-prima nomeada.
- **Os barcos têm nome**: NEBLINA I, BEIJA-FLOR, PÉROLA DO TAPAJÓS.
- **Três retiros já aconteceram na Villa**, cada um com o seu registro fotográfico
  próprio. Quem os conduziu está no nome das pastas em `Assets/`, que é gitignorado —
  e por decisão do cliente em 21/08/2026 **esses nomes não se reproduzem aqui nem no
  site**. Neste documento os arquivos são citados por glob (`4 Grupos e Retiros/*/`)
  e pelo nome do arquivo, que é único e localizável com `find`.
- Os Reels já trazem um vocabulário de marca em PT/EN: *espaços amplos ·
  contato com a natureza · comunidades tradicionais · como o rio Arapiuns*.

## Destinos por página

Proposta, não execução. Nenhum arquivo foi copiado para `src/assets/imgs/`.

- **Home** — o drone como abertura (ou `poster` dele); a vitória-régia; o grupo
  inteiro na praia.
- **A Pousada** — `Área Externa`: a roseta em close, o interior com rede e
  luminária, a varanda de teto em leque, o quarto twin com mosquiteiro, o bangalô
  térreo de telhado metálico (que confirma a variação de unidades já registrada no
  `PRODUCT.md`).
- **A Mesa** — `Café da Manhã` e `Mesa e Pratos`: o bolo de macaxeira, a tapioca,
  as garrafas térmicas, a mesa comprida com abacaxi; a mesa na canoa; e a piracaia
  com as velas. Hoje a página tem foto genérica de mesa posta.
- **Experiências** — vitória-régia, SUP, canoa no igapó, a árvore de raízes
  aéreas, o igarapé de areia branca, a colmeia, a farinhada com hóspede na massa,
  o tingimento de palha, a puxada de mãe.
- **Grupos (Villa Privativa)** — o grupo inteiro; a shala cheia e vazia; a roda de
  fogo com velas; os abraços da `Captação completa`; o pavilhão coberto; o drone.
- **Como Chegar** — a sequência de `Embarque`: passarela azul, barcos, grupo na
  areia, o barco com coletes.
- **Rodapé / FaixaGarantias** — os retratos da `Equipe`.
- **Galeria** — é onde o retrato vertical cabe sem briga. O acervo tem ~1.100
  retratos e o site não tem **nenhuma grelha vertical**; isso é uma decisão de
  layout a tomar, não um detalhe de recorte.

## Furos que continuam

- **Pesca de mergulho noturna** — nenhuma foto, nenhum vídeo. É a atividade que o
  cliente quer vender na página de grupos.
- **Observação de aves** — uma única foto, de espécie não identificada.
- **Corporativo** — nenhuma imagem de grupo em contexto de trabalho. As duas mais
  próximas são os grupos grandes uniformizados de camiseta verde em
  `Trilha na Floresta/IMG_2473.jpg`, cuja natureza (empresa? agência?) eu não sei.

## Perguntas para o cliente

1. Os grupos uniformizados de camiseta verde-limão são grupo corporativo? Se
   forem, é a única prova visual de corporativo no acervo.
2. Os três retiros podem ser **nomeados** no site? Autorização de imagem já está
   dada, mas nomear quem conduziu um retiro é prova social de outra natureza e
   pede o sim de quem conduziu.
3. Quais das atividades novas estão **em oferta hoje**: meliponário, macaco
   guariba, banho de argila, canoagem no igapó, SUP?
4. A espécie da ave em `4 Grupos e Retiros/*/IMG_6056.jpg`.
5. O banho de ervas tem fotos de hóspedes de traje de banho, de rosto visível.
   Mesmo com cessão de imagem, quais podem ir ao site é escolha editorial sua —
   as duas mais discretas são `Banho de Ervas.../IMG_6182.jpg` (mãos em oração) e
   `Captação completa/IMG_5973.jpg` (a cuia sendo derramada).
6. Os vídeos estão a ~7 MB/s, inutilizáveis crus na web. Transcodificar é trabalho
   próprio (o `PRODUCT.md` põe celular em 3G/4G instável como caso normal) — vale
   abrir isso como frente separada?
7. **As 24 fotografias que só existem a ~1290px** em
   `0 Seleção editorial - com gente/` — sobretudo as 9 de `Gente e Vivências/` e as
   9 de `Água e Praia/`. Como são recorte, o original em resolução cheia deve estar
   com quem fotografou. Vale pedir: são enquadramentos que não se repetem no acervo.
8. Os 5 `.avif` com nome de lugar (`FLORESTA NACIONAL DO TAPAJÓS - ALTER DO CHÃO` e
   companhia) são fotografia da Villa ou imagem de turismo de terceiros? O
   `PRODUCT.md` já os barrou por essa dúvida, e ela continua aberta.

## Frentes abertas por este levantamento

Nenhuma delas foi executada. Estão aqui para não se perderem.

### 1. O sistema visual aceitar retrato (frente própria, decidida em 21/08/2026)

O acervo tem **~1.100 fotos em retrato**, e várias das melhores só existem nesse
formato: os retratos da equipe, o yoga, as senhoras da comunidade, a metade das
fotos de mesa. O site **não tem uma única grelha vertical** — todas as grelhas são
`aspect-[4/3]`, `[3/2]`, `[16/9]`, `[21/9]`. Recortar retrato para paisagem joga
fora o que faz a foto funcionar: no retrato de gente, é a altura que carrega.

Por isso isto não é ajuste de recorte, é decisão de sistema visual, e vale plano
próprio cobrindo **Galeria, Equipe e Experiências** de uma vez, em vez de abrir um
precedente solto numa página. O cliente decidiu assim em 21/08/2026.

### 2. Vídeo — desbloqueada, com um clipe no ar (21/08/2026)

Havia 37 clipes a ~7 MB/s, inutilizáveis crus na web. **Um já está na home** e
deixou a receita medida; os outros 36 continuam parados, mas agora o caminho
existe e é reprodutível.

**O que está no ar:** `public/video/villa-de-cima.mp4` — o drone descendo sobre
os telhados. 14 s, 1280×720, 24 fps, **3,1 MB**, sem áudio (o original também
não tem).

    ffmpeg -ss 10 -i "…/Seleção/villa arapiuns (drone).MP4" -t 14 -an \
      -vf fps=24 -c:v libx264 -preset veryslow -crf 31 -tune film \
      -profile:v high -level 4.0 -pix_fmt yuv420p -g 48 \
      -movflags +faststart public/video/villa-de-cima.mp4

**O que o teste de compressão mostrou, e é o achado reutilizável:** copa de mata
fechada filmada em movimento é dos assuntos mais caros que existem. Medido no
mesmo clipe:

| | |
|---|---|
| 28 s a 720p, crf 24 / 26 / 28 | 17,1 / 12,7 / 9,3 MB |
| 18 s a 720p25, crf 29 | 4,5 MB |
| 18 s a 720p25, **AV1** (SVT, crf 40) | 4,2 MB — só 8% abaixo do h264 |
| 20 s a **1024×576**, crf 27 | 5,4 MB — **maior** que os mesmos 20 s a 720p crf 31 |

Duas conclusões: **baixar resolução não economiza** (o crf persegue qualidade, e
qualidade num quadro menor custa mais bits por pixel) e **AV1 não paga** o dobro
de peso no repositório nem o risco de decodificação em telefone antigo. O que
economiza de verdade é **cortar duração** e subir o crf. Aqui, 14 s bem
escolhidos a crf 31 valem mais que 47 s a crf 26.

**A decisão de produto que acompanha:** `preload="none"`, cartaz no lugar do
quadro, nenhum autoplay, e **o peso escrito na legenda** — "14 s · 3,1 MB · sem
som". Quem está no telefone com dado contado decide antes de gastar. O número
sai de `statSync` no arquivo a cada build, então não pode divergir do servidor
nem envelhecer se o clipe for trocado. Ver a nota no frontmatter de
`src/content-pages/Home.astro`.

E `controls` **não** vai no HTML: com o atributo, Chrome e Safari desenham a
barra em cima do cartaz desde o primeiro paint. Ele entra por script no primeiro
play. O comando visível é um `<a>` para o arquivo na régua da legenda, então sem
JavaScript o clique ainda toca o vídeo — na aba, em vez de na página.

**Continua parado:** os Reels verticais legendados em PT/EN (a peça mais pronta
e a mais pesada), o lago de cima, e o tingimento de palha.

### 3. Grupos e retiros na página Villa Privativa

Plano aprovado em 21/08/2026, **em espera**: as Fases 1 e 3 escrevem em
`src/i18n/routes.ts` e nos cinco dicionários, e outra sessão estava trabalhando
nos mesmos arquivos (contato comercial único + formulário de reserva). Retomar
quando aquela frente fechar.

## Sobre publicar este arquivo

**O repositório é público.** Por isso este documento não reproduz o nome de quem
conduziu os retiros (decisão do cliente, 21/08/2026): os arquivos são citados por
glob e por nome de arquivo, que localizam sem identificar. Continua valendo um
cuidado editorial: o banho de ervas e a puxada de mãe têm fotos de hóspedes em
traje de banho e de rosto visível. A cessão de imagem existe, mas quais dessas vão
ao site é escolha do cliente, não consequência automática da autorização.

## Rodada de 21/08/2026 (noite): o que entrou e o que saiu

O cliente recusou o fechamento da página de grupos, pediu mais fotografia e
pediu vídeo na home. Nesta rodada:

**Entraram em `src/assets/imgs/`** — cinco, todas de 2048px de largura, as duas
últimas reduzidas de 6240px:

| Arquivo | Origem no acervo | Onde vive |
|---|---|---|
| `piracaia-roda.jpg` | `3 Acervo/Gente/Piracaia/IMG_3470.jpg` | fechamento de Grupos |
| `piracaia-peixe.jpg` | `3 Acervo/Gente/Piracaia/IMG_3399.jpg` | bloco da pesca de mergulho |
| `shala-cheia.jpg` | `3 Acervo/Yoga e Práticas/IMG_1553.jpg` | grade dos espaços |
| `redario.jpg` | `4 Grupos e Retiros/*/Captação completa/IMG_6871.jpg` | grade dos espaços |
| `artesas-palha.jpg` | `4 Grupos e Retiros/*/IMG_1433.jpg` | seção de responsabilidade |
| `villa-de-cima-poster.jpg` | primeiro quadro do mp4 acima | cartaz do vídeo na home |

**Saiu:** `grupo-praia-inteiro.jpg`, apagado. Ver o item 2 da lista de ganhos.

**Saíram da página de grupos, mas continuam no repositório porque outras páginas
as usam:** `deck-yoga.jpg` (o deck vazio, trocado pelo pavilhão cheio),
`luau-praia.jpg` (a praia à noite, que virou o fechamento em largura cheia) e
`jantar-peixe.jpg` (a travessa posta, trocada pelo peixe na folha de bananeira).

### Duas pendências que este acervo abriu, e como o cliente fechou as duas

Ambas em 21/08/2026, no mesmo dia da rodada.

1. **As placas solares — CONFIRMADAS, e no ar.** Elas aparecem nítidas em
   `IMG_1553.jpg` e de cima no vídeo do drone, e o site não dizia uma palavra
   sobre energia. O cliente confirmou: **a energia da casa é solar.** Virou a
   quinta linha de "Amazônia com responsabilidade" na página de Grupos, e é a
   única das cinco que já tinha prova em imagem antes de ter texto.

   **O limite do que foi confirmado está no `PRODUCT.md` e vale repetir:** o
   fato é "a energia é solar". Cobertura, gerador de apoio, capacidade instalada
   e existência de rede elétrica no local **não** foram confirmados — então
   "off-grid", "autossuficiente" e "sem gerador" continuam fora.

2. **A ave — NÃO NOMEAR, decisão do cliente.** `4 Grupos e Retiros/*/IMG_6056.jpg`
   é a única foto de ave do acervo e continua fora do site. São duas razões
   independentes, e qualquer uma bastaria:

   · **A espécie não se nomeia.** O cliente decidiu assim, e o `PRODUCT.md` já
     dizia o mesmo desde antes ("nenhuma espécie pode ser nomeada" — a lista não
     foi fornecida e não há lista pública para o Arapiuns). A pergunta que este
     inventário deixou aberta está fechada: não se pergunta mais, não se
     pesquisa mais, não se escreve palpite em lugar nenhum.
   · **É retrato**, e o sistema visual não aceita retrato até a frente 1 acima
     ser decidida. Recortar para 3/2 abriria justamente o precedente que o
     cliente fechou.

   A seção de observação de aves segue ilustrada pela canoa no igapó, que é a
   saída que está sendo vendida — e é o que a legenda diz.
