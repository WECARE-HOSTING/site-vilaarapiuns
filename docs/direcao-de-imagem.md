# Direção de imagem — o que foi olhado, o que foi escolhido, e por quê

Rodada de 21–22/08/2026, aberta pelo cliente com duas frases: *"não gostei da foto
final da página do grupo"* e *"quero o vídeo também na main, qual vídeo? você
decide"*.

**Este documento é o julgamento; `acervo.md` é o inventário.** Lá está o que
existe, quanto pesa e como varrer 2.201 arquivos sem gastar um milhão de tokens.
Aqui está o que foi aberto uma a uma, o que ganhou, **o que quase ganhou e por
que não** — que é a parte que se perde primeiro e a que mais dói recomeçar.

O registro das decisões de produto que saíram daqui está em `PRODUCT.md`. As duas
regras que valem para o site inteiro estão na seção seguinte.

---

## O critério, e ele decidiu tudo o resto

**Retrato de grupo posado não vende viagem.**

A foto recusada eram ~25 pessoas em fila na areia ao pôr do sol, olhando para a
lente. Antes dela havia outra, o pôr do sol de costas, também recusada. O erro
comum às duas não é qualidade — as duas são boas fotos — é **gênero**:

- **Pose** prova que o grupo esteve aqui. É a foto que se manda no grupo da
  viagem *depois*. Ninguém se reconhece numa fila de vinte e cinco desconhecidos.
- **Cena** é gente fazendo alguma coisa, sem olhar para a câmera. O leitor entra
  nela. É o que faz alguém marcar a viagem *antes*.

A partir daí a triagem tem um teste de uma pergunta: *alguém está olhando para a
lente?* Se sim, a foto vai para o fim da fila, por boa que seja. Foi esse teste
que eliminou quatro das cinco melhores candidatas ao fechamento.

**Segunda regra, herdada e reconfirmada:** a legenda diz a peça e o que acontece,
nunca o clima. "A piracaia · o grupo inteiro em roda na areia, à luz de velas" —
não "uma noite inesquecível".

---

## Como olhei, e quanto custou

Três passadas, de barata para caro:

| Passada | O que | Custo |
|---|---|---|
| 1 | **244 fotos** em 11 folhas de contato de 24 miniaturas | ~30k tokens |
| 2 | **14 finalistas** abertas a 820–1000px, uma por uma | ~11k tokens |
| 3 | **6 vídeos** medidos com `ffprobe` + quadros em folha | ~8k tokens |

A amostragem das 244, para poder repetir:

    Captação completa (900 arquivos)     cada 6ª  → 150
    os dois retiros menores (16 + 20)    inteiros →  36
    3 Acervo/Yoga e Práticas (129)       cada 4ª  →  33
    3 Acervo/Gente/Piracaia (73)         cada 3ª  →  25

    node tools/acervo-folhas.mjs manifesto.txt folhas/ 6 4

**A folha de contato não decide, ela elimina.** Numa miniatura de 320px dá para
ver o assunto, o enquadramento e se tem gente — não dá para ver se o rosto está
nítido nem se o corte de 16/9 sobrevive. Toda foto que entrou no site foi aberta
grande antes, e as cinco escolhidas foram testadas **no corte real** (`sharp`
`fit: cover`) antes de uma linha de código ser escrita.

---

## As cinco que entraram

| Arquivo no acervo | Virou | Onde vive | Por que ganhou |
|---|---|---|---|
| `Piracaia/IMG_3470.jpg` | `piracaia-roda.jpg` | fechamento de Grupos | O grupo sentado em roda completa na areia, anel de lanternas de vela, palmeira no centro, o rio com a lua atrás. **Cena, não pose** — ninguém olha para a lente. Simétrica, o que serve a um quadro de fecho, e corta em 16/9 sem perder nada. Cai numa seção `bg-mar`: foto noturna assenta no escuro do sistema. |
| `Piracaia/IMG_3399.jpg` | `piracaia-peixe.jpg` | bloco da pesca de mergulho | Peixes abertos e assados na brasa sobre folha de bananeira, com limão, na areia à luz de vela. A legenda daquele bloco já dizia *"peixe assado à luz de vela"* sobre uma travessa posta numa sala. **A legenda não mudou; a foto passou a cumpri-la.** |
| `Yoga e Práticas/IMG_1553.jpg` | `shala-cheia.jpg` | grade dos espaços | O pavilhão comprido **cheio**, quinze pessoas em pé no deck, luz de fim de tarde — e as **placas solares** no telhado. Dois fatos num quadro. A seção pergunta onde o grupo se reúne: sem gente é planta, com gente é prova. |
| `.../Captação completa/IMG_6871.jpg` | `redario.jpg` | grade dos espaços | Redes listradas sob telhado de palha assentado na areia, mata e rio ao fundo. **O redário é nomeado na abertura da página** ("os treze bangalôs, o pavilhão, o redário e a praia") e não tinha foto em lugar nenhum do site. |
| `4 Grupos e Retiros/*/IMG_1433.jpg` | `artesas-palha.jpg` | responsabilidade | Cinco mulheres da comunidade no chão de terra, trançando feixes de palha tingidos de laranja e vermelho. Era a **única seção da página sem imagem**, e é a que o comprador corporativo repete dentro da empresa. Nativa a 6240×4160. |

Nenhuma foi recortada de retrato para paisagem. As duas de 6240px foram reduzidas
a 2048 com `lanczos3`; as três de 2048 entraram no tamanho nativo.

---

## As dez que quase entraram

Esta é a seção que existe para não repetir a triagem. Todas são boas fotos.

| Arquivo | O que é | Por que não |
|---|---|---|
| `Piracaia/IMG_3482.jpg` | A piracaia pelo outro ângulo: palmeiras em silhueta, o rio prateado de lua, o grupo sentado no anel de velas | **A melhor segunda colocada.** Perdeu por pouco: a roda de gente se lê com mais clareza na `3470`, e a `3482` entrega mais paisagem que grupo. Guardar — é o fechamento de reserva. |
| `[retiro]/IMG_7995.jpg` | Fogueira na praia, o grupo todo de branco em volta, céu azul-profundo | Espetacular e **é pose**: fila de frente para a lente. Reprovou no teste da lente. |
| `Piracaia/IMG_3378.jpg` | O grupo em pé atrás de um campo de lanternas de vela, sob a lua | Pose também — mas é **a melhor das posadas**, porque o anel de velas domina o quadro e a ritualidade se lê antes dos rostos. Se um dia houver de haver uma posada, é esta. |
| `Yoga e Práticas/IMG_3144.jpg` | A fila do grupo sentada na areia, de costas, vendo o sol baixar no rio | Excelente, e **duas barreiras**: é retrato (ver a frente aberta abaixo) e repetiria o "pôr do sol de costas" que já foi trocado uma vez. Circular. |
| `.../Captação completa/IMG_5822.jpg` | O grupo inteiro em pé dentro do lago, água na altura do peito, linha de mata atrás | Bom, mas é posado **e** é quase a mesma leitura do `banho-rio-grupo.jpg` que já abre a página. Repetir o assunto na mesma página gasta as duas. |
| `.../Captação completa/IMG_6558.jpg` | O grupo ao pé de uma árvore gigante de raízes tabulares — a escala se lê pela gente | Forte de verdade, e é **retrato**. Fica na fila da frente de retrato. |
| `[retiro]/IMG_0898.jpg` | A shala cheia ao crepúsculo, aula em andamento, **6240×4160** | Melhor qualidade técnica de todas. Não usei porque põe **quem conduz o retiro em destaque no centro do quadro** — e o cliente decidiu em 21/08 que os facilitadores não são nomeados no site. Foto que identifica pede o mesmo cuidado que nome. |
| `IMG_5425` · `IMG_3521` · `IMG_1351` | A roda na shala, de três vantagens diferentes | A página já tem `retiro-roda-pavilhao.jpg` fazendo esse trabalho. Uma quarta roda de shala seria a mesma frase dita quatro vezes. |
| `[retiro]/IMG_1295.jpg` | O monte de palha tingida de laranja e vermelho secando — natureza-morta | Linda, e **não tem gente**. Nesta rodada tudo que entrou tinha de mostrar grupo ou espaço de grupo. Guardar para A Mesa ou para a marca. |
| `Piracaia/IMG_3359.jpg` | O arco de dezenas de velas na areia, sem ninguém, palmeiras contra o escuro | Mesmo caso: cenografia sem gente. É a melhor candidata a uma abertura de página que ainda não existe. |

---

## Barradas por regra, não por qualidade

**A ave** — `4 Grupos e Retiros/*/IMG_6056.jpg`. A única foto de ave do acervo,
nítida e bonita. Fora do site por duas razões independentes, e qualquer uma
bastaria:

1. **A espécie não se nomeia** — decisão do cliente em 21/08/2026, e o
   `PRODUCT.md` já dizia o mesmo antes (a lista de espécies não foi fornecida e
   não há lista pública para o Arapiuns). Pergunta encerrada: não se pesquisa
   mais e não se escreve palpite em lugar nenhum.
2. **É retrato**, e recortá-la para 3/2 abriria justamente o precedente que o
   cliente fechou.

A seção de observação de aves segue ilustrada pela canoa no igapó — que é a saída
que está sendo vendida, e é o que a legenda diz.

**Retrato em geral** — o acervo tem **~1.100 verticais**, e várias das melhores
fotos só existem nesse formato. O site não tem **nenhuma** grelha vertical: todas
as grades são `4/3`, `3/2`, `16/9`, `21/9`. Isso é decisão de sistema visual, com
plano próprio, e o cliente decidiu em 21/08/2026 que não se abre precedente
recortando retrato numa página solta. Enquanto essa frente não for feita, toda
foto vertical está tecnicamente barrada — inclusive as boas.

---

## O vídeo: os seis candidatos, medidos

Dos 37 do acervo, seis eram plausíveis para a home. Medidos com `ffprobe`, não
supostos:

| Clipe | Resolução | Duração | Bitrate | O que se vê |
|---|---|---|---|---|
| **`villa arapiuns (drone)`** | 1280×720 30p | 47,0 s | 15,5 Mb/s | Descida a pique: telhados de palha e placas solares dentro de copa fechada, até o beiral e a areia |
| `localização_lago azul` | 1280×720 30p | 26,5 s | 5,2 Mb/s | Aérea lenta sobre o Lago Azul, uma canoa minúscula. Luz cinzenta e plana |
| `Localização_lago azul(1)` | 1280×720 30p | 11,3 s | 9,8 Mb/s | O mesmo lago, trecho curto |
| `Entrada Villa Arapiuns_Rio Arapiuns` | 1920×1080 60p | 10,2 s | 60,3 Mb/s | De dentro da passarela coberta, olhando o rio na hora dourada. Contraste altíssimo, quadro quase todo escuro |
| `navegação de canoa` | 1920×1080 60p | 7,5 s | 60,9 Mb/s | Uma mão arrastando na água da canoa em movimento. Tátil, abstrato, faz laço perfeito |
| `Piracaia` | 1920×1080 60p | 4,2 s | 60,7 Mb/s | Piracaia à noite, muito curto |

**Por que o drone ganhou:** é o único que **prova uma afirmação que a página já
faz.** Isolamento e escala são o argumento central do produto e até aqui só
existiam como palavra ("40 min de barco") e como desenho (o mapa de situação).
O drone mostra os telhados engolidos por mata sem clareira — e as placas solares
de graça, que viraram a quinta linha de "Amazônia com responsabilidade".

Os outros são bonitos e não provam nada. O `navegação de canoa` faria o melhor
laço ambiente de todos, para o dia em que houver um lugar para clipe ambiente; o
`Entrada` é o mais cinematográfico e o menos legível em tela de celular; o lago
de cima é o candidato óbvio de Experiências.

**Por que fica encostado no mapa:** o mapa responde *onde*, em ilustração; o
vídeo responde *como é*, em fotografia. É a mesma pergunta do visitante em duas
linguagens, e a segunda só tem força depois da primeira. Fora da travessia seria
clipe bonito solto na página.

---

## O corte e a compressão

**O corte: 14 s dos 47, de 10 s a 24 s.** O original começa alto demais para se
reconhecer o que se vê e termina com o drone a um metro da areia, quadro que não
diz mais nada. O trecho que fica é o arco útil — dos telhados dentro da copa até
a palha e a placa solar legíveis.

    ffmpeg -ss 10 -i ".../Seleção/villa arapiuns (drone).MP4" -t 14 -an \
      -vf fps=24 -c:v libx264 -preset veryslow -crf 31 -tune film \
      -profile:v high -level 4.0 -pix_fmt yuv420p -g 48 \
      -movflags +faststart public/video/villa-de-cima.mp4

**O que o teste de compressão mostrou.** Copa de mata fechada filmada em
movimento é dos assuntos mais caros que existem — foliagem em movimento não tem
redundância entre quadros, que é de onde todo codec tira economia. Sete encodes
no mesmo clipe:

| Ajuste | Resultado |
|---|---|
| 28 s · 720p · crf 24 / 26 / 28 | 17,1 / 12,7 / 9,3 MB |
| 18 s · 720p25 · crf 29 | 4,5 MB |
| 18 s · 720p25 · **AV1** (SVT preset 6, crf 40) | 4,2 MB — só 8% abaixo do h264 |
| 20 s · **1024×576** · crf 27 | 5,4 MB — **maior** que os mesmos 20 s a 720p crf 31 |
| 20 s · 720p24 · crf 31 | 4,4 MB |
| 20 s · 720p24 · AV1 preset 4 crf 46 | 4,0 MB |
| **14 s · 720p24 · crf 31** | **3,1 MB** ← no ar |

Três conclusões reutilizáveis:

1. **Baixar resolução não economiza.** O `crf` persegue qualidade, e qualidade num
   quadro menor custa mais bits por pixel. O 1024×576 saiu maior que o 720p.
2. **AV1 não paga.** 8% de arquivo em troca do dobro de peso no repositório e do
   risco de decodificação em telefone antigo — que é o público #1 deste site.
3. **O que economiza é cortar duração** e subir o `crf`. Catorze segundos bem
   escolhidos a crf 31 valem mais que 47 s a crf 26.

**A decisão de produto que acompanha a técnica.** O `PRODUCT.md` põe celular em
3G/4G instável como caso normal, e o cliente já reclamou duas vezes de não
conseguir ver as imagens da home. Então: `preload="none"`, cartaz no lugar do
quadro, nenhum autoplay, e **o peso escrito na legenda** — "14 s · 3,1 MB · sem
som". Quem está com dado contado decide antes de gastar. O número sai de
`statSync` no arquivo a cada build, então não pode divergir do servidor nem
envelhecer se o clipe for trocado.

E `controls` **não** vai no HTML: com o atributo, Chrome e Safari desenham a barra
preta em cima do cartaz desde o primeiro paint. Entra por script no primeiro
play. O comando visível é um `<a>` para o arquivo, então sem JavaScript o vídeo
ainda toca — na aba, em vez de na página.

---

## A fila: o que está pronto e onde vai

Não é proposta vaga — são arquivos localizáveis com `find`, já olhados.

| Página | O que está pronto | Por que agora |
|---|---|---|
| **Como Chegar** | A sequência de `3 Acervo/Água/Embarque`: a passarela azul, os barcos na areia, o grupo com mala andando na praia, o barco com coletes | A maior ansiedade do visitante é o trajeto, e a página **não tem uma foto dele** |
| **A Mesa** | `Piracaia/IMG_3405` (o peixe pelo outro ângulo), `IMG_3359` (o arco de velas), a mesa posta na areia, e a **mesa dentro de uma canoa** (`Selecionadas/IMG_2202`) | A página fala da piracaia sem mostrar nada disso |
| **Equipe / FaixaGarantias** | Os retratos de `3 Acervo/Equipe` e as quatro cozinheiras de `Espaços e Quartos/IMG_7396` | A faixa promete "equipe própria" e "anfitrião local" em texto puro. São a prova — **e são retrato**, então dependem da frente de retrato |
| **Experiências** | O tingimento de palha (`IMG_1295` + os dois clipes de urucum), o SUP, a vitória-régia, o lago de cima em vídeo | Atividades que o site menciona sem mostrar, ou não menciona |
| **Galeria** | É o lugar onde retrato cabe sem briga — ~1.100 candidatas | Depende inteiramente da frente de retrato |

---

## O que eu errei nesta rodada, para não repetir

**Julguei a grade pelo código e não pela página.** Montei a grade dos espaços com
larguras desiguais (7 e 5 colunas) e a mesma proporção 3/2 nas duas — o que dá
alturas diferentes e deixa as duas legendas da fila desencontradas por uns 70px.
No código estava certo; na captura de tela era claramente um descuido, numa
página em que a emenda **é** a régua do layout. Conserto: a peça larga fixa a
altura da fila e a estreita estica para ela, sem número mágico.

A lição vale mais que o conserto: **tirar a foto da página antes de dizer que
está pronto.** Duas vezes nesta rodada a captura de tela mostrou o que o
`astro check` verde não mostrava — esta, e a barra preta do navegador em cima do
cartaz do vídeo.

**Um detalhe de método, para quem for tirar captura em headless:** o Chrome impõe
janela mínima de ~500px e depois recorta a imagem no tamanho pedido. Pedir 390px
devolve uma foto de uma página de 500px cortada, e o texto aparece "estourando"
sem estourar. Conferir celular a **500px**, não a 390. (Isto já estava anotado no
frontmatter da home por uma rodada anterior, e eu caí de novo.)
