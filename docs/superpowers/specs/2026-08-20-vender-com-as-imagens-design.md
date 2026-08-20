# Vender com as imagens — fotografia em todas as páginas

Data: 2026-08-20 · Aprovado pelo cliente na mesma data.

## O pedido

"Tudo tem que ter mais imagens — a casa, os passeios. Estou achando com pouca
imagem. Vamos vender com as imagens." Junto veio um lote de fatos do negócio que
não estavam em nenhum lugar do código.

## O diagnóstico

O site tinha 20 fotos e as reciclava. As páginas que **vendem a experiência**
eram as mais pobres: Experiências falava de igapó, pôr do sol, piracaia e
comunidades sem mostrar nenhum dos quatro; Pacotes vendia o produto principal
com uma foto; Como chegar e Reservar tinham zero.

Contado no HTML gerado, não no que se pretendia escrever:

| Página | Antes | Depois |
|---|---|---|
| Experiências | 4 | 15 |
| Pousada | 5 | 15 |
| Galeria | 12 | 35 |
| Pacotes | 1 | 10 |
| Mesa | 2 | 7 |
| Privativa | 1 | 6 |
| Como chegar | 0 | 1 |
| Avaliações | 0 | 1 |
| Reservar | 0 | 1 |

Avaliações tinha dois imports de imagem, mas ambos só existiam no modo
`PREVIEW_AVALIACOES=1`: em produção a página não tinha nenhuma.

## O acervo

`Assets/Media/Fotos - Villa Arapiuns/` (401 MB, gitignorado) tem 168 arquivos.
Foram olhados **um a um**, em quatro triagens paralelas. Resultado:

- **`Anúncio/`** — 45 originais, 40 deles a 3072×2048 e dois a 6240×4160. É o
  melhor material do acervo e estava inteiramente fora do site.
- **`Site 2026/`** — 10 originais, cinco já em uso.
- **`Airbnb/`** — 32 fotos, recompressas a ~1200 px pelo Airbnb.
- **`Site - acomodações/` e `Site - experiências/`** — 64 arquivos que *parecem*
  descartáveis por se chamarem "Captura de tela". **Não são:** foram conferidos
  e são recortes limpos de fotografia, sem interface, a ~1290 px. É onde vive
  quase toda a vida humana do acervo (farinhada, tecelagem, samaúma, massagem,
  piracaia com violão, grupo no pôr do sol). Usáveis em card e coluna; não em
  hero de largura cheia.

Descartados: um render 3D de masterplan com zonas de preço em norueguês, cinco
thumbnails de ≤434 px, e uma foto de crianças ribeirinhas identificáveis (sem
autorização de imagem, não entra em site comercial).

### O que o acervo não tinha

**Boto tucuxi** — nenhuma foto, em 168 arquivos. Resolvido com o Wikimedia
Commons: `Sotalia fluviatilis 335722337.jpg`, **CC0** (domínio público, sem
crédito obrigatório), 2048×1262. É a única imagem do site que não foi feita na
Villa, e por isso a legenda diz `Boto tucuxi · Sotalia fluviatilis`, sem sugerir
que foi fotografado ali.

**Aérea/drone** — segue pendente com o cliente.

## O pipeline

Originais ficam em `Assets/` (gitignorado, fica no Drive). Derivados a **2400 px
de lado maior** vivem em `src/assets/imgs/` e são versionados; o `astro:assets`
gera os tamanhos finais no build. 39 fotos novas importadas, total de 68.

**Nunca ampliar.** As capturas (~1290 px) e as do Airbnb (~1200 px) entram na
resolução nativa. Ampliar não cria detalhe — cria bytes e uma promessa falsa.
`banco-areia.jpg` fica a 1200×900 por isso mesmo.

### Bug corrigido no caminho

O `.gitignore` tinha `Assets/` sem barra inicial. Sem a barra, o git casa o
padrão em qualquer nível — e como o filesystem do macOS é case-insensitive,
`Assets/` também casava `src/assets/`. **Catorze imagens estavam invisíveis ao
git**, incluindo o mapa de situação. Um commit teria entrado com os `.astro` e
sem as imagens: build quebrado em qualquer clone. A regra virou `/Assets/`,
ancorada na raiz.

## Os fatos novos

Todos vieram do cliente em 20/08/2026.

**As duas estações** — o maior ganho de venda da rodada, e uma seção nova.
Janeiro a julho é cheia: o rio entra na floresta, nascem os igapós e a canoa
passa entre as copas das árvores. Agosto a dezembro é seca: a água recua e as
praias de areia branca aparecem. O ganho é transformar "época de chuva", que o
visitante lê como defeito, em paisagem que só existe naquele semestre.

**A água** — não há aquecedor. O banho é o próprio rio, na temperatura em que
ele chega, e ela varia com a época do ano. Há filtro, então água potável o tempo
todo. Vendido como experiência, nunca como carência.

**CORREÇÃO DO CLIENTE, 20/08/2026, mesmo dia.** A primeira redação desta rodada
dizia "A água já é quente" em `pousada.aguaT`, e ele voltou atrás: *"não falar a
água já é quente — falar: a água de lá é sem aquecedor"*. É o mesmo tipo de
erro do mosquito, uma casa antes: uma promessa de sensação que o hóspede confere
no primeiro banho. "Sem aquecedor" é o fato; a temperatura do chuveiro não é
afirmada. O jeito de não virar carência não é prometer calor — é dizer de quem é
a água: `"o banho é a própria água do rio, na temperatura em que ela chega"`.

Isto NÃO foi propagado para `estacoesI` ("a água é quente e transparente nas
duas") nem para `estacoesNota` ("a água do Arapiuns é quente o ano todo"), de
propósito: são outra afirmação — a temperatura do RIO para banho de rio, que é
verdade na bacia do Tapajós — e o cliente escopou a correção em "como é viver
aqui", que fala do chuveiro. Levantado com ele para decisão; se ele quiser tirar
a promessa de temperatura do site inteiro, são estas duas linhas.

**Sem televisão** — há Starlink, para comunicação. Desconexão como virtude.

**Os botos são tucuxi**, menores, e aparecem perto. **Caiaque até a Ponta
Grande** (ou de barco).

### O mosquito: o que mudou, e por quê

O cliente pediu para afirmar que "não tem mosquito, o pH do rio impede a
proliferação". **O mecanismo não se sustenta.** Verificado contra literatura
revisada por pares (Malaria Journal, PMC10668518): rios de água clara como o
Tapajós e o Arapiuns têm **pH próximo do neutro** — não são ácidos. Quem é ácido
é o rio Negro, água preta; e o estudo associa essa água ácida a *mais* presença
de *Anopheles darlingi*, não menos.

O que é verdade e sustentável é o **comparativo**: a região tem muito menos
mosquito que a Amazônia de várzea. Decisão do cliente: escrever o comparativo,
**sem citar pH e sem prometer zero**. Uma promessa absoluta em página que vende
Amazônia é frágil — basta uma picada para o hóspede se sentir enganado.

O texto anterior de `pousada.c3D` dizia "Pé na areia, sem mosquito" e foi
corrigido.

**Consequência de fotografia:** não usar as fotos de quarto com mosquiteiro
armado (`Quarto duplex/IMG_5733`, `Site - acomodações/195020`) nas páginas que
fazem a afirmação. Mosquiteiro ao lado de "praticamente sem mosquito" é uma
contradição que o visitante vê antes de ler.

## Coordenação

Três sessões trabalhavam no repositório ao mesmo tempo. Escopos apurados por
mensagem antes de qualquer edição: uma fez o carrossel do hero da Home, outra
fez o mapa de situação do Chegar; ambas encerraram e passaram o bastão. O
cliente confirmou que esta sessão assume o escopo inteiro.

`Home.astro` e `Chegar.astro` estão **untracked** no git — sem baseline de merge.
Toda edição nesses arquivos é pontual, com releitura antes; nunca sobrescrita
inteira.

## Verificação

`astro check` em 0 erros. Build em 52 páginas. Os dois verificadores do projeto
passam: `classes-fantasma` acusa zero classes sem regra em 411 distintas, e
`contraste-dom` checa 5.489 nós de texto sem nenhum abaixo de 4,5:1.

Playwright em 1440 px e 390 px nas nove páginas: **zero overflow horizontal**,
zero imagem quebrada, zero `alt` faltando. O único `<img>` sem `alt` do site é a
cópia ampliada do mapa dentro do diálogo, e o vazio ali é correto — a imagem já
está descrita acima e o diálogo tem `aria-label`.

Sobre o aviso de que o Chrome headless força janela mínima de 500 px: vale para
a flag `--window-size` do binário, **não** para o viewport do Playwright, que usa
`Emulation.setDeviceMetricsOverride` por CDP. Medido em vez de suposto —
`clientWidth` a 390 devolve exatamente 390.

### Peso, medido a 390 px

Preocupação legítima ao triplicar a fotografia do site, sendo o público #1
celular em rede móvel instável. Não houve inchaço, porque o `astro:assets`
entrega derivado de ~420 px em webp para essa largura e tudo abaixo da primeira
dobra é `lazy`:

| Página | 1ª dobra | Rolada até o fim | Fotos |
|---|---|---|---|
| Experiências | 384 KB | 0,70 MB | 15 |
| Pousada | 483 KB | 0,77 MB | 15 |
| Galeria | 455 KB | 1,08 MB | 35 |
| Mesa | 507 KB | 0,50 MB | 7 |
| Pacotes | 308 KB | 0,39 MB | 10 |
| Privativa | 324 KB | 0,32 MB | 6 |
| Como chegar | 244 KB | 0,39 MB | 1 + mapa |

A Galeria carrega 35 fotografias em 1,08 MB. A Home, fora do escopo desta
rodada, é a página mais pesada do site (986 KB só na primeira dobra) por causa
do bundle React do carrossel — 110,8 KB gzip, medido pela sessão que o
construiu.

### Uma armadilha de verificação, para quem vier depois

Rolar a página e esperar 250 ms **não** basta para conferir fotografia: as
imagens `lazy` ainda estão em voo e a foto sai vazia. Isto produziu um falso
positivo — "a seca está sem foto" — que só caiu quando eu medi o elemento no
navegador e ele voltou 543×362, carregado. Antes de screenshot, force
`loading = 'eager'` e espere o `load` de cada `<img>`.

## Rodada seguinte, mesmo dia: a tira do hero

O cliente: *"não to gostando da galeria da home, quero poder arrastar com o mouse
na foto, tipo agarrar — agora só dá pra clicar nas fotos que estão menorzinhas do
lado. E outra: quero um loop infinito, não que acabe e tenha que voltar. Pode
colocar mais umas 14 fotos, umas 30 no total."*

### O arraste já funcionava — e isso foi medido antes de reescrever

Antes de tocar em uma linha, o gesto foi testado com eventos de ponteiro reais:
`mousedown` no centro do card focado, doze movimentos de 25 px, `mouseup`. A
trilha andou 872 px e o foco mudou de card. O `drag="x"` estava lá desde o
início.

O que faltava eram duas coisas menores e uma grande:

1. **Afordância.** A prop `rotuloArraste` existia na interface do componente e
   não era passada pela Home, então nada na tela dizia que dava para arrastar.
   Cursor `grab` não basta, e no celular não existe cursor.
2. **Arraste curto lia como clique.** Abaixo do limiar do framer, o `onClick` do
   card sob o cursor disparava no release e levava o foco para ele — o que dá
   exatamente a sensação de "não respondeu" ou "voltou ao lugar". Agora um
   deslocamento acima de 6 px cancela o clique.
3. **`dragElastic` a 0,08 e sem inércia.** Gesto 1:1 e completamente seco. Subiu
   para 0,14, e a projeção da velocidade no pouso subiu de 0,12 para 0,18.

A lição de método: o defeito relatado ("só dá pra clicar") não era o defeito
existente. Medir o gesto antes de reescrever o que o produz.

### O loop: pista circular

A estrutura anterior era **ativamente incompatível** com loop. Havia um clamp em
dois lugares — `limites` + `xFor`, e o `dragConstraints` — que existia porque
centrar o card focado abria meia tela de vazio no primeiro e no último item.
Numa pista circular esse motivo desaparece junto com as pontas, e o clamp saiu
inteiro.

A tira desenha o acervo **três vezes** em sequência. Como o vão é igual entre
todos os cards, um flex produz periodicidade de passo `W = total + gap`, e a
posição do card `j` é `offsets[j % N] + floor(j / N) · W`. O foco mora sempre na
cópia do meio, que tem um acervo inteiro de conteúdo de cada lado.

O detalhe que faz o loop parecer loop: ao trocar de card, o alvo não é `xMid(i)`
e sim a cópia equivalente **mais perto de onde a trilha está agora**
(`xMid(i) + k·W`). É isso que faz o 30 → 1 andar um passo para frente em vez de
varrer a tira de volta. Ao fim da mola, `x` é recolocado em `xMid(i)` sem
animação, e o salto é invisível porque a tira é periódica.

Os 60 clones são `aria-hidden` e fora da ordem de tabulação: quem usa teclado ou
leitor de tela percorre 30 cards, não 90.

### A janela de imagens, e por que ela existe

`loading="lazy"` **não segura uma tira horizontal.** A tira inteira está dentro
da viewport — ela é só transladada para o lado — então o navegador baixa quase
tudo. Medido a 390 px com 30 fotos: **35 imagens e 1.123 KB na primeira dobra**,
para um visitante que vê duas.

Então o `<img>` só existe para os cards a até cinco posições do foco. O card
continua desenhado (a largura vem de `strip.larguras`, não da imagem), então
entrar na janela preenche o retângulo sem mexer no layout. Resultado medido:
**22 imagens e 598 KB** — e as onze restantes são o carrossel de acomodações e o
mapa, que são de outra rodada.

Verificado: 90 cards renderizados para 31 `src` distintos — exatamente 3,0 tags
por imagem, ou seja **os clones reusam o arquivo** e o navegador não busca a
mesma foto três vezes. E zero cards visíveis sem imagem depois de andar oito
posições para dentro da tira.

### As 30 fotos

Ordem de narrativa: a travessia e a água (10), a mata e a gente (5), a casa por
fora (7), por dentro (4), a mesa e o fim do dia (4).

Duas exclusões deliberadas:

- **Nada de fotografia noturna**, por pedido do cliente numa rodada anterior. A
  única exceção é a piracaia, que ele aprovou nominalmente. Ficaram de fora
  `varanda-noite`, `luau-praia`, `piracaia-violao`, `sobre` e `jantar-peixe`.
- **O tucuxi não entra no hero.** É a única imagem do site que não foi feita na
  Villa, e o hero é onde a casa se apresenta. Ela vive nas Experiências e na
  Galeria, onde a legenda declara a procedência.

### Seis fotos duplicadas, encontradas e removidas

Duas sessões importaram as mesmas fotos com nomes diferentes. Três pares eram
byte a byte idênticos (`deck-yoga`/`pavilhao-palha`, `trilha-grupo`/`trilha-guia`,
`praia-portao`/`praia-espreguicadeira`) e três eram a mesma foto reencodada
(`samauma`, `por-do-sol-grupo`, `vitorias-regias-barco`). A Galeria chegou a
mostrar a mesma imagem duas vezes, em dois capítulos.

Corrigido: referências apontadas para o nome canônico, cinco arquivos apagados, e
`deck-yoga` reimportado de `IMG_5917` — que é de fato outra foto do pavilhão, e
estava sem uso porque as duas sessões pegaram `IMG_5920`. Confirmado por md5 que
não resta nenhuma duplicata em `src/assets/imgs/`.

## Fora de escopo nesta rodada

Tradução do conteúdo novo para en/es/de/ja. O cliente julga design e texto em
português primeiro; os outros quatro idiomas vêm depois do PT aprovado.
