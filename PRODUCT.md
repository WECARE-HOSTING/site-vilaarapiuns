# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Duas audiências primárias confirmadas, de peso comparável — o design serve as duas e
onde elas conflitam a escolha é declarada, não silenciosa.

1. **Brasileiro, no celular, via WhatsApp.** Famílias e grupos do Brasil, chegando por
   indicação e por link colado em conversa. Decidem no telefone, frequentemente em rede
   móvel instável. O WhatsApp é o canal de contato e de reserva, não um extra.
2. **Estrangeiro planejando com antecedência.** Viajante montando um roteiro de semanas,
   comparando pousadas amazônicas em várias abas, em inglês ou alemão. Precisa de preço,
   avaliações e logística para conseguir comparar; sem isso, fecha a aba.

Consequência registrada: o compartilhamento em WhatsApp e a comparação lado a lado são
os dois momentos de aquisição reais. Ambos exigem preço, prova social e preview de link.

## Product Purpose

Pousada na Amazônia, no Rio Arapiuns (Pará), a cerca de 1h30 de barco de Alter do Chão.
Treze bangalôs. O produto tem DUAS modalidades com inclusões diferentes — ver a
seção Modalidades; tratá-las como uma só produz alegação falsa.
O site existe para levar o visitante de "não sei o que é isso" a um contato de reserva —
sucesso é uma conversa iniciada, não uma sessão longa.

## Positioning

**A casa e o material.** O que uma pousada vizinha não pode copiar honestamente é o
objeto construído: as portas de mogno com **marchetaria radial** — cunhas de veio
oposto irradiando de um centro octogonal, não chevron —, a **tecelagem em xadrez de
chocolate e aveia**, a luminária de fibra trançada, a arquitetura tapajônica de dois
andares. A especificidade vem da matéria e da mão que a
fez — não do bioma, que é compartilhado por toda a categoria.

Confirmado pelo usuário em 19/08/2026, em preferência explícita a três alternativas
(relação com as comunidades ribeirinhas; "pousada e não passeio"; o isolamento).
Aquelas três continuam sendo verdade sobre o produto e podem aparecer como argumento —
mas não são o eixo.

## Modalidades (estrutura central do produto)

Confirmado em 20/08/2026 pelos documentos em `Assets/Docs/`. **São dois produtos
diferentes, e confundi-los produz alegação falsa** — foi o que o site fazia,
afirmando "barco de Alter do Chão incluso" em todas as páginas.

1. **Pousada.** Estadia na Villa com **alimentação completa**, coroada pela
   Piracaia. **Barco e passeios NÃO estão inclusos** — o plano tarifário é
   literal: "Não incluso: transfer de barco e passeios". Passeios contratados
   à parte: canoa e banho no Lago Azul; farinhada e saberes das comunidades;
   massagem de cura com banho de cheiro.
   Preço-piso: **R$ 796** por pessoa/noite em quarto duplo, **a partir de 4
   noites**. O plano tarifário amarrava esse piso a um grupo de 20 pax; o
   cliente corrigiu em 20/08/2026 — **não precisa ser grupo de 20**, e a
   condição de grupo saiu do site. O que resta da condição acompanha o número.

2. **Pacote completo.** Sai de **Alter do Chão** com barco, roteiro e atividades
   fechados, em **meia pensão** (café e jantar) — não pensão completa.
   · *Clássico Arapiuns*: 1 noite / 2 dias, 7 experiências.
   · *Imersão Completa*: 2 noites / 3 dias, 10 experiências.
   Preço-piso: **R$ 1.600** por pessoa para 1 noite.

Tabela de tarifas (por pessoa/noite, ocupação mínima em quarto duplo): a tarifa
cai conforme sobem as noites e o tamanho do grupo. 2 noites/10 pax vai de
R$ 1.950 (individual) a R$ 1.350 (triplo); 4 noites/20 pax vai de R$ 1.034 a
R$ 716. Acima de 26 hóspedes, consultar. **Direito de exclusividade a partir de
15 pessoas** (o código dizia 10 e foi corrigido).

## Operating Context

- Chegada: voo até Santarém, deslocamento a Alter do Chão, ~1h30 de barco rio acima.
  A viagem é parte da experiência e também a maior fonte de ansiedade do visitante.
- Estadia: 13 bangalôs, equipe local, guias locais. Alimentação completa na
  modalidade pousada; meia pensão nos pacotes.
- Atividades com as comunidades ribeirinhas existem e são pagas diretamente aos
  moradores — o que historicamente exigia que o hóspede levasse dinheiro em espécie.
- Oferta adicional: a Villa privativa (uso exclusivo), a partir de 15 pessoas.
- Bangalôs de **arquitetura tapajônica**, pé na areia, sobre palafitas. O termo
  do cliente é **bangalô**, não "cabana" — o site foi unificado nisso.
  **As unidades variam** (verificado nas fotos em 20/08/2026): `hero6.jpg` mostra
  um bangalô de **dois andares com telhado de palha**, e `bangalo-externo.jpg`
  (pasta "quarto casa") mostra um de **um pavimento com telhado metálico**.
  Então o "acomodações de 2 andares" do panfleto está sustentado para parte das
  unidades, e o telhado não é uniforme. Não generalizar nenhum dos dois.
  Tipos confirmados pelas pastas de `Anúncio/`: quarto casa · quarto duplex ·
  dois quartos duplex.
- Estruturas nomeadas nos documentos: redário entre as árvores, Shala de Yoga,
  praia de água doce sem mosquito.
- Experiências nomeadas: Lago Azul, Trilha da Samaúma (comunidade de Atodi),
  comunidade Coroca (tartarugas e artesanato), Ponta Grande, Ponta do Toronó,
  Canal do Jari, farinhada, tecelagem, Piracaia.
- Contexto de leitura: celular em 3G/4G instável no Brasil; desktop com várias abas
  abertas no exterior.

## Capabilities and Constraints

- Site estático, cinco idiomas (pt, en, es, de, ja), português como idioma-base.
- Canal de contato e reserva: WhatsApp. **Não existe e-mail publicável** (`contact.email`
  é `null` em `src/data/site.ts`) — o site não deve prometer um segundo canal.
- Sem motor de reservas: o site conduz a uma conversa, não a um checkout.

- Canal público: WhatsApp **+55 11 96976-0096**. Instagram **@villaarapiuns**.
- Existe canal comercial separado para agências e operadoras, fora deste
  repositório. Não referenciar contato de agência aqui nem em `site.ts`.

**Em uso no site** desde 20/08/2026: os dois preços-piso da seção Modalidades.

**Confirmado em 20/08/2026:** crianças são permitidas (`childrenAllowed: true`).
A informação aparece nas dúvidas de Como Chegar e no que pedir em Reservar,
porque é lá que a pergunta nasce.

**Decidido em 20/08/2026, e encerrado:** a promoção "Piracaia de cortesia" do
plano tarifário **não vai ao ar** — o cliente confirmou tirar. Não reintroduzir.

Ainda pendente:

- **Avaliações**: nota e quantidade. Autorizado pelo cliente, valores e fonte ainda
  não fornecidos. Não existe bloco de prova social até chegarem.
  **Busca na web em 20/08/2026 não encontrou nenhuma avaliação pública nos
  canais óbvios.** O perfil do TripAdvisor existe (`d33958784`, gravado em
  `SITE.reviews.tripadvisorUrl`) e está vazio — "Este estabelecimento ainda não
  tem avaliações"; Hotels.com/Expedia e OwnerDirect listam a propriedade sem
  comentário nem nota; não apareceu perfil do Google Business nem anúncio no
  Airbnb. **Isto é uma afirmação negativa a partir de busca, não um fato
  absoluto**: se houver elogio em canal que a busca não alcança — WhatsApp,
  e-mail, comentário de Instagram — o quadro muda, e esse material serve
  (com consentimento de quem escreveu e a origem declarada). O que a busca
  sustenta é mais estreito e ainda assim decisivo: **não há prova social
  indexada que um estrangeiro consiga achar sozinho antes de reservar.**
  A ação, portanto, é coletar — não continuar buscando.
  Achado colateral: a propriedade aparece **fragmentada em pelo menos três
  listagens** ("Villa Arapiuns - Amazon Lodge", "Villa Arapiuns - 6 Bangalôs
  na Floresta", "Noite mágica com macacos na Villa Arapiuns"). Avaliação que
  chegar vai se dividir entre elas em vez de somar.

Decisões explicitamente **abertas** — não inventar, não exibir até decidir:

- **Ano de fundação e histórico de segurança.** Não disponível. A alegação
  "5+ anos, zero incidentes", que existia em `src/i18n/pt.json`, foi **removida** por
  não ter respaldo: o campo `yearFounded` é `null` e o site antigo dizia "4 anos".
  Nenhuma alegação de tempo de operação ou de segurança deve voltar sem confirmação.
- **Tabela de preços das atividades das comunidades.** Os valores existem em
  `COMMUNITY_ACTIVITIES` (`src/data/site.ts`) e o site antigo os publicava, mas o uso
  **não foi confirmado**. Não construir componente nem exibir esses valores por ora.
- **Condições comerciais de agência e tabela de tarifas completa**: constam de
  documento CONFIDENCIAL de uso restrito a agências, fora deste repositório.
  Não reproduzir números nem condições desse documento aqui. O R$ 796 público
  (piso da modalidade Pousada) é a única cifra autorizada pelo cliente para uso
  no site, sempre com a condição ("4 noites · quarto duplo") ao lado, nunca solto.
- **Amazonas ou Pará.** O logotipo assina "RETREAT & COMMUNITY. AMAZONAS -
  BRASIL", e o rodapé do plano tarifário assina "Rio Arapiuns, Pará — Amazônia".
  O conflito está dentro do material do próprio cliente. O site usa **Pará**,
  que é geograficamente correto para o Rio Arapiuns.

## Brand Commitments

- Nome: **Villa Arapiuns**. A palavra "Villa" faz parte da marca e deve aparecer onde
  a marca aparece.
- Logotipo (`src/assets/imgs/logo.png`), lido nos pixels em 19/08/2026. Duas famílias
  de forma, não uma: **quatro folhas amendoadas em contorno**, convergindo num único
  ponto embaixo, cada uma com **uma espiral lisa** dentro; e, separadas, em haste,
  **três cabeças de samambaia com coroa de ~6 contas**. Não há roseta central — o que
  parece roseta é a cabeça de topo.
  **CORREÇÃO (20/08/2026), a partir do ativo em alta resolução em
  `Assets/Media/Fotos - Villa Arapiuns/3.png` (2000×2000, verde sobre branco):**
  o wordmark `ARAPIUNS` é **sólido, pesado e condensado**, com espaçamento
  apertado — medido, ~0,53 de largura por letra relativa à altura de caixa alta.
  Não é ultraleve nem em contorno. As duas leituras anteriores saíram da versão
  branca sobre branco, onde só as bordas apareciam. A Fase 1, que usava Archivo
  Narrow 600, estava mais perto do certo do que a "correção" que a substituiu.
  Verde do logotipo: **#617d54**, matiz 101° — mesma família do panfleto (102°)
  e da capa do tarifário (98°). Terceira confirmação independente do verde.
  Consequência: o tratamento em contorno vazado foi removido do site, porque a
  única justificativa dele era essa leitura errada.
  A palavra "Villa" **não está** no logotipo; ela vive no nome e na assinatura.
  `src/components/Logo.astro` foi redesenhado para essa leitura.
- A coroa de contas é a única forma desta marca que nenhuma outra pousada tem, e é
  ela — não a espiral lisa, que é o glifo padrão de eco-lodge — que virou a marca de
  lista do site (`src/components/Voluta.astro`).
- **Paleta da marca**, extraída dos pixels de `Assets/Docs/` em 20/08/2026 e
  adotada no site por decisão do cliente (aproximar o site do impresso):
  verde **#2e3a27** (matiz 98°, idêntico nas páginas 1, 3 e 5 do plano
  tarifário) · creme **#f6f1e6** (páginas claras) · terracota **#b3683e**
  (matiz 21,5°, 9.293px nos cabeçalhos de card da página 4) · meios-tons
  sálvia em 47–65° · ouro-marrom **#65552e**.
  Convergência que vale registrar: os verdes do impresso (98° e 102°) e a
  folhagem das fotos (60–76°) são a mesma família; o terracota do impresso
  (21,5°) é o mesmo matiz da luminária de fibra em `gal3.jpg` (21°). O verde
  de 138° da fase anterior era o único valor fora da curva.
- O impresso usa **serifa de alto contraste** no display. O site mantém a
  Archivo (com o eixo de largura, derivado do wordmark) — a decisão do cliente
  foi sobre PALETA. A tipografia do impresso é decisão separada, em aberto.
- Português primeiro, em conteúdo e em revisão.

## Evidence on Hand

Reais e no repositório:

- `Assets/Docs/Plano tarifário para agências.pdf` — tabela comercial 2026,
  documento CONFIDENCIAL para agências: o que inclui cada modalidade, a tabela
  de tarifas, condições de pagamento, cortesias de staff, contato comercial.
- `Assets/Docs/Panfleto Villa Arapiuns (8).pdf` — peça pública ao consumidor:
  os dois pacotes com itinerário, as experiências nomeadas, as estruturas, o
  telefone público e o Instagram.

- Fotografia própria em `src/assets/imgs/` — 15 arquivos: `hero1`–`hero6`, `gal1`–`gal6`,
  `sobre`, `logo`, `logo_crop`. Os interiores (`gal5`, `gal3`) são a evidência direta do
  posicionamento: mogno, marchetaria, tecelagem, luminária de fibra.
  Nota técnica: 12 dos 15 arquivos não são referenciados por nenhuma página; `hero5`
  (613×483) e `hero1` (960×720) são pequenos demais para uso em hero.
- Site anterior preservado em `_legacy/index.html` — fonte de verdade sobre o produto
  (o que era prometido, o que era listado) e anti-referência visual.
- Dados estruturados do negócio em `src/data/site.ts` (localização, WhatsApp, atividades).

**Biblioteca de mídia** em `Assets/Media/Fotos - Villa Arapiuns/` — 169 arquivos,
401MB, avaliada em 20/08/2026. Nem tudo é utilizável:

- **`Site 2026/`** — o material bom. Originais em resolução cheia organizados por
  seção: `hero1.jpg` (6240×4160), `hero3.jpg` e `sobre.jpg` (3072×2048), e quatro
  fotos nunca usadas em `sessao 3`: varanda à noite com rede e luminária de fibra,
  café da manhã com esteiras trançadas, pavilhão de palha na mata, caiaques sob
  abrigo. Importadas para `src/assets/imgs/` com nome descritivo.
- **`Anúncio/`** (248MB) — fotografia de acomodação organizada por tipo de
  unidade: `2 quartos duplex`, `Quarto duplex`, `quarto casa`, a 3072×2048.
  É o material da página da pousada.
- **`Airbnb/`** — derivados baixados do Airbnb, nomes UUID, pequenos. Descartável.
- **`Site - acomodações/` e `Site - experiências/`** — apesar do nome, são
  ~60 **capturas de tela** a 1269×845 (provavelmente do site antigo em Wix) mais
  alguns `.avif` redimensionados pelo Wix a 613×489. **Não são fotografia
  utilizável.** Três `.avif` têm nomes de lugar ("ALTER DO CHÃO", "FLORESTA
  NACIONAL DO TAPAJÓS") e podem ser imagem de turismo de terceiros, não da Villa
  — não usar sem confirmar autoria e licença.
- **`Logo Villa Arapuins (2).zip`** — não contém vetor: são os mesmos três PNG
  que já estão soltos. **Não existe arquivo vetorial do logotipo**, e é por isso
  que a marca no site é um redesenho em SVG. Se aparecer o vetor original, vale
  substituir.

Ausências que trabalho futuro **não deve fabricar**: depoimentos, nomes de hóspedes,
notas de avaliação, preços, ano de fundação, número de incidentes, prêmios, imprensa,
política de cancelamento, política de crianças.

## Product Principles

1. **Tranquilizar é o produto.** A decisão em jogo é viajar para um lugar remoto com
   13 bangalôs. Logística, preço e prova social não são letra miúda — são o argumento
   central e merecem o mesmo peso tipográfico que a fotografia.
2. **A matéria antes do bioma.** Toda escolha visual responde à casa construída — mogno,
   marchetaria, tecelagem — e não ao vocabulário genérico de floresta.
3. **Uma conversa, não um checkout.** Todo caminho converge para o WhatsApp, e ele deve
   estar sempre ao alcance. O site não promete canais que não existem.
4. **O celular em sinal ruim é o caso normal**, não a exceção. Peso de página, ordem de
   carregamento e alvos de toque são decisões de produto.
5. **Nunca afirmar o que não se pode comprovar.** Quando um fato não existe, o desenho
   se reorganiza sem ele em vez de preencher o espaço com uma alegação.

## Accessibility & Inclusion

- Meta: WCAG 2.2 nível AA, incluindo SC 1.4.11 (contraste de componente), 2.4.7 (foco
  visível), 2.5.3 (rótulo no nome) e 2.5.8 (tamanho de alvo, 24px).
- O site precisa funcionar **sem JavaScript**: a navegação inteira, o seletor de idioma
  e todo caminho para o contato. Rede instável e navegador antigo são cenário real do
  público brasileiro.
- Cinco idiomas incluindo japonês: o sistema tipográfico precisa de cobertura CJK e não
  pode assumir comprimento de string do português.
