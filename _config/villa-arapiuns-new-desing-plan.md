
Ready for review
Select text to add comments on the plan
Villa Arapiuns — Plano de redesign: nova direção visual e vídeo em primeiro plano
Documento de handoff. Escrito em 22/08/2026 para ser executado por uma sessão nova de Claude Code, sem acesso à conversa que o originou. Tudo o que você precisa saber está aqui ou apontado daqui.

Repo: /Users/carlose.pecuccifilho/Documents/Site Villa Arapiuns
Branch: redesign · último commit da apuração: 138f7f8
Interlocutor: Carlos (desenvolvedor). Quando este documento diz "o cliente", é o dono da pousada — outra pessoa. Decisão do cliente não se relitiga.
0. Leia isto antes de tocar em qualquer arquivo
0.1 Regras de processo que não se negociam
Nada sai da máquina sem ordem direta do Carlos. Sem git push, sem deploy, sem tocar no remoto nem no site no ar. Atenção: push para main publica o site — está medido em docs/deploy-formulario.md (um git push origin redesign:main e ~2 min depois a build nova estava no ar). Publicar é sempre fase separada.
Fase por fase, com portão de aprovação. Ao fim de cada fase: parar, pedir para ele abrir npm run dev, esperar retorno, ajustar até aprovar. Nunca encadear duas fases.
Português primeiro. Ele julga design e texto em PT. Mas: texto aprovado em PT propaga para en/es/de/ja na mesma resposta, não numa rodada depois. Só fica só em PT se ele pedir explicitamente.
O repositório é público. Commitar é publicar. Antes de qualquer commit, checar se entra dado confidencial: tabela de tarifas de agência, credenciais, nome de quem conduziu os retiros (decisão do cliente em 21/08: esses nomes não vão ao repo nem ao site).
Podem haver sessões concorrentes no mesmo repo. Durante a apuração deste plano, docs/direcao-de-imagem.md apareceu e docs/acervo.md mudou de tamanho durante a conversa. Combine escopo por mensagem antes de escrever, e nunca reescreva um arquivo inteiro — edição pontual, com releitura antes.
0.2 O que o Carlos pediu, literalmente
"primeiro revisar o meu site inteiro, sabendo tambem que temos uma infinidade de midias disponiveis / e quero um design mais moderno no site, mas que remeta a amaozia caribenha, como ja colocamos la / acho que falta destacar mais os videos que vemos, por isso quero que busque inspiracoes"

0.3 As quatro decisões que ele tomou (22/08/2026)
Pergunta	Resposta dele
Quanto do sistema atual pode cair?	Nova direção visual. Tipografia, formas, grid e densidade voltam para a mesa. Marchetaria pode sair ou virar detalhe.
Como o vídeo aparece?	Hero em vídeo + vídeo em cada página + coluna vertical tipo reel. (Ele não escolheu "sala de vídeos" / página dedicada.)
Escopo?	Sistema primeiro, páginas depois. Nova camada visual + componentes de vídeo no design system, com página de amostra; depois aplica nas páginas.
Inspiração externa?	Galerias de premiação (Awwwards e afins), para direção de movimento e composição — não para copiar código. Ele não autorizou raspar sites de hotelaria nem o 21st.dev nesta rodada.
0.4 Instrução explícita sobre docs/direcao-de-imagem.md
Carlos: "o direcao-de-imagem é pra vc saber porque ja tinha la, mas como vai ser um novo design, peco pra vc desconsiderar".

Desconsidere como restrição: a curadoria de fotos, a tabela "as dez que quase entraram", e a fila de mídia por página. Isso é julgamento feito para o design antigo e será recurado.

Continua valendo, e vem do acervo.md (inventário, não julgamento): onde cada arquivo está, quanto pesa, o que é refugo, e os números de compressão medidos. Continua valendo também a regra do cliente de que retrato de grupo posado não entra — é decisão dele.

0.5 O que já está resolvido e não se relitiga
Posicionamento (PRODUCT.md, confirmado pelo cliente em 19/08 contra três alternativas): "A casa e o material." O eixo é o objeto construído — portas de mogno com marchetaria radial (cunhas de veio oposto irradiando de um centro octogonal, não chevron), tecelagem em xadrez de chocolate e aveia, luminária de fibra trançada, arquitetura tapajônica. Não é o bioma — esse é compartilhado por toda a categoria.
Paleta areia-e-mar, escolhida pelo cliente em 21/08 a partir de uma foto de referência dele (banco de areia dourada dentro do rio, água azul dos dois lados, céu forte). Tem um dia de vida quando este plano foi escrito.
Retrato de grupo posado não entra (cliente, 21/08). O critério é cena: gente fazendo alguma coisa, ninguém olhando para a lente. Teste de uma pergunta: alguém está olhando para a lente? Se sim, vai para o fim da fila, por boa que seja a foto.
A legenda nomeia a peça e o que acontece, nunca o clima. "A piracaia · o grupo em roda na areia, à luz de velas" — não "uma noite inesquecível".
Nenhuma mídia sintética. PRODUCT.md proíbe alegação falsa, e footage gerada por IA de uma pousada real é exatamente isso. — CORRIGIDO EM 22/08/2026, LEIA ANTES DE USAR: quando esta linha foi escrita, o PRODUCT.md não tinha nenhuma regra de procedência de imagem, só o Princípio 5, e esta frase era uma inferência. A revisão da Fase 0 descobriu que as 65 fotos do site já eram saídas de `openai/gpt-image-2/edit` desde 20/08 (`docs/revisao-2026-08-22.md` §2). Decisão do Carlos em 22/08: as editadas ficam, e a regra de verdade agora está escrita em PRODUCT.md, seção "Procedência da fotografia". É ela que vale, não esta linha. O que continua proibido sem exceção: imagem gerada de texto, invenção de objeto/pessoa/vista, e ampliação nova.
Nada de fotografia noturna, por pedido do cliente, com exceção nominal da piracaia.
Nenhuma espécie de ave pode ser nomeada — a lista não foi fornecida e não há lista pública para o Arapiuns. Pergunta encerrada: não se pesquisa mais.
Ausências que não se fabricam: depoimentos, nomes de hóspedes, notas de avaliação, preços fora do autorizado, ano de fundação, número de incidentes, prêmios, imprensa, política de cancelamento.

1. Por que este trabalho existe
   O site é bem construído: Astro 7 + Tailwind 4 + duas ilhas React, 11 páginas × 5 idiomas (57 no build), roteador único, 74 fotos versionadas, dicionários de 982 linhas cada, e cinco verificadores próprios em tools/ que hoje passam. O que falta é o que o Carlos pediu:
2. Vídeo. O acervo tem 37 clipes (2,6 GB) e exatamente 1 está no ar — public/video/villa-de-cima.mp4, 14 s de drone, 3,1 MB, sem som, encostado no mapa da home. Entre os 36 parados estão os 5 Reels verticais 1080×1920 já legendados em PT/EN. E o src/components/CarrosselHero.tsx:545-556 já renderiza vídeo por item, com a foto como poster — nenhum item da tira preenche o campo video?: string (declarado na linha 139). O caminho está construído e desligado.
3. Uma forma que leia "Amazônia caribenha". A paleta já é o brief caribenho, e a copy da home já diz "Um Caribe de água doce e quente, dentro da floresta." O que não acompanhou foi a forma: zero border-radius em todo o site, duas sombras no site inteiro, uma família tipográfica só (Archivo), breakpoints default do Tailwind, e a Disciplina 3 do design system proíbe tipo sobre foto. São regras de um site que era escuro-dominante, inverteu para claro em 21/08, e nunca teve a forma redesenhada — só a cor.
4. Um sistema que aceite vertical. ~1.100 fotos do acervo são retrato e o site não tem uma única grelha vertical — todas são aspect-[4/3], [3/2], [16/9], [21/9]. Os Reels 9:16 pedem exatamente a mesma decisão. É uma frente, não duas. O cliente decidiu em 21/08 que isso merece plano próprio cobrindo Galeria, Equipe e Experiências de uma vez, em vez de abrir precedente recortando retrato numa página solta.
5. A troca de paleta deixou entulho. Quatro lugares ainda na paleta anterior: theme-color="#1d2418" em src/layouts/BaseLayout.astro:96; o CSS inline de src/pages/index.astro com #1d2418/#b4b69f/#c2ab80 e um comentário afirmando serem "os tokens reais do @theme"; o array cores de src/pages/pt/styleguide.astro:68-77 listando os 8 tokens mortos; e comentários no global.css (l. 388-396 e 446) medindo contraste contra mata-funda, mata, "breu" e "terracota", que não existem mais. Uma direção nova varre isso de graça.
6. O peso do JS. Hoje o site entrega ~345 KB de JS (client.js 184 KB + framer-motion 149 KB + 12 KB de CarrosselHero + 3,3 KB de CarrosselAcomodacoes) para dois carrosséis, num site cujo público #1 é celular em 3G/4G instável. Adicionar vídeo sem olhar esse número seria irresponsável.

A tensão que este plano tem de resolver conscientemente
"Nova direção visual" toca uma decisão de 21/08 do cliente. A paleta é dele, tirada da foto dele. Leitura recomendada, a ser confirmada na Fase 2: a paleta é o eixo caribenho e sobrevive; o que muda é forma, tipografia, escala, densidade e movimento. Não decida isso sozinho — a Fase 2 põe as alternativas na tela, inclusive uma que se afasta da paleta.

2. O site como ele é hoje
   2.1 Stack e comandos
   npm run dev            → astro dev
   npm run build          → astro build && node tools/copia-dicionarios.mjs
   npm run preview        → astro preview
   npm run check          → astro check
   npm run i18n:check     → node tools/i18n-parity.mjs
   npm run contato:check  → node tools/contato-unico.mjs
   npm run prazo:check    → node tools/prazo-unico.mjs
   npm run form:check     → npm run build && node tools/testa-endpoint.mjs
   astro ^7.2.4 · @astrojs/react ^6.0.4 · @astrojs/sitemap · @tailwindcss/vite ^4.3.3 + tailwindcss ^4.3.3 (Tailwind v4, sem tailwind.config.js — a config vive no @theme do CSS) · framer-motion ^13.1.1 · react ^19.2.8 · sharp ^0.35.3 · clsx · tailwind-merge.

astro.config.mjs: site: 'https://vilaarapiuns.com.br', trailingSlash: 'always', i18n nativo com defaultLocale: 'en', locales ['en','pt','es','de','ja'], prefixDefaultLocale: true. Sitemap exclui /styleguide e caminhosNoindex().

Saída: dist/ (gitignorado). Build atual: 57 HTML, 110 MB, dos quais 104 MB são derivados de imagem em dist/_astro (590 arquivos). CSS único de 46,8 KB. Home HTML de 122 KB.

Deploy: não existe arquivo de deploy no repo (sem .github/, sem .cpanel.yml). O mecanismo está no servidor (cPanel Git Version Control ou webhook). HostGator com nginx na frente — o .htaccess está na raiz do repo, não em public/, logo nem sobe no build, e nginx não leria mesmo.

.gitignore — armadilha registrada: a regra é /Assets/ com barra inicial obrigatória. Sem a barra, o filesystem case-insensitive do macOS fazia Assets/ casar src/assets/, e cinco imagens ficaram fora do repo em silêncio. Não mexa nisso.

2.2 As 11 páginas
Roteador único: src/pages/[...path].astro gera 11 chaves × 5 idiomas a partir de src/i18n/routes.ts, com slug traduzido. Não há .astro duplicado por idioma.

chave	componente em src/content-pages/	slug pt	o que faz
home	Home.astro (676 l.)	''	hero com carrossel de 30 fotos, travessia, mapa, vídeo do drone, "A casa" + carrossel de acomodações, "Um dia na Villa", "Duas maneiras de ficar", fechamento com citação
lodge	Pousada.astro (468 l.)	pousada	os 13 bangalôs, tipos de unidade, a madeira de perto, áreas comuns
dining	Mesa.astro (160 l.)	gastronomia	escopo de alimentação, a Piracaia, o café
experiences	Experiencias.astro (319 l.)	experiencias	na água, na mata, com as comunidades
packages	Pacotes.astro (200 l.)	pacotes	Clássico Arapiuns (1n/7 exp) e Imersão Completa (2n/10 exp)
privateVilla	Privativa.astro (341 l.)	villa-privativa	rótulo de menu = "Grupos": retiros, empresas, observação de aves, pesca de mergulho
gettingHere	Chegar.astro (93 l.)	como-chegar	mapa + 3 etapas + 5 dúvidas. Uma foto só.
gallery	Galeria.astro (198 l.)	galeria	30 fotos em 4 capítulos. Sem lightbox, zero JS, de propósito
reviews	Avaliacoes.astro (106 l.)	avaliacoes	vazia por decisão — não há avaliação pública nenhuma
book	Reservar.astro (95 l.)	reservar	como reservar + FormularioReserva
bookSent	Enviado.astro (37 l.)	reservar/enviado	confirmação. NOINDEX_KEYS = ['bookSent']
NAV_KEYS (7 no menu): lodge, dining, experiences, packages, privateVilla, gettingHere, gallery. reviews, book e bookSent chegam por CTA/rodapé.

Fora do roteador: src/pages/index.astro (raiz /, stub de detecção de idioma com  + links visíveis sem JS — não importa o global.css) e src/pages/pt/styleguide.astro (página interna de aprovação, noindex, hoje obsoleta).

2.3 Componentes
arquivo	l.	o que é
BaseLayout.astro (em src/layouts/)	136	 completo: canonical, hreflang recíproco + x-default, OG/Twitter, JSON-LD LodgingBusiness (emite só fato confirmado), preconnect + Google Fonts, slots, skip-link
PageRenderer.astro	—	despachante pageKey → componente; monta title/description; envolve internas em pt-header + FaixaGarantias
Scaffold.astro	—	rede de segurança da Fase 0; hoje nenhuma chave cai nele
Header.astro	245	fixed; menu desktop; seletor de idioma em 




<details></details>

</details>




 nativo; menu mobile  full-screen; prop sobreFoto
Footer.astro	99	logo, sobre, WhatsApp/email/tel, 2 colunas de nav, seletor de idioma
FaixaGarantias.astro	30	4 promessas em border-y emenda
Logo.astro	95	marca redesenhada em SVG inline (não existe vetor original)
Voluta.astro	40	a marca de lista do site — a coroa de contas, SVG 18×16
Campo.astro	15	marcador de seção que carrega dado de campo
AberturaPagina.astro	26	h1 + lead das 9 internas
ListaCorte.astro	65	"lista de corte do marceneiro":  de peça · descrição · medida tabular
LinhaDoDia.astro	95	elemento-assinatura: "o rio que desce a página" — SVG de meandro + timeline
MapaSituacao.astro	171	mapa raster +  nativo de lupa
ListaExperiencias.astro	120	portado do 21st.dev #1086 para Astro puro; polaroides giradas no :focus-within
ListaAvaliacoes.astro	163	portado do 21st.dev #18913; iniciais dentro do octogono; exige origem no tipo
FormularioReserva.astro	364	 nativo +  de melhoria progressiva
CarrosselHero.tsx	639	React + framer-motion, pista circular infinita, suporte a vídeo por item, desligado
CarrosselAcomodacoes.tsx	287	React + framer-motion, fusão em quadro 3:2, não autoplaya de propósito
2.4 Dados
src/data/site.ts (236 l.) é a fonte única: SITE (nome, domínio, capacity: {cabins:13, maxGuests:26, minGuestsPrivate:15}, location, contact.whatsapp: '5547992067078', contact.email: 'reservas@vilaarapiuns.com.br', prices: {pousadaMin:796, pacoteMin:1600, pacote2Min:2300}, reviews tudo null); COMMUNITY_ACTIVITIES; MODALIDADES; PACOTES; helpers preco(), whatsappUrl(), telefoneLegivel() (que lança em vez de formatar às cegas).

src/data/acomodacoes.ts (71 l.) — as 10 fotos de acomodação, com regra de admissão documentada: só unidade do hóspede, nada de área comum, nada de mosquiteiro armado (porque o site afirma "praticamente sem mosquito" e mosquiteiro ao lado disso é contradição visível).

2.5 i18n
src/i18n/ — implementação própria, não plugin. config.ts (LOCALES, DEFAULT_LOCALE='en', READY_LOCALES, HTML_LANG com pt→pt-BR) · routes.ts (PAGE_KEYS, SLUGS, NAV_KEYS, NOINDEX_KEYS, caminhosNoindex(), href()) · utils.ts (useTranslations() com fallback para en e warn em DEV, useList() para arrays).

pt.json, en.json, es.json, de.json, ja.json — 982 linhas cada, 27 grupos: site, nav, cta, trust, dia, footer, whatsapp, desc, home, modo, pousada, mesa, exp, pacote, chegar, mapa, privativa, galeria, aval, reservar, form, autoresp, a11y, seo, carousel, acomodacoes, enviado.

tools/copia-dicionarios.mjs copia os 5 JSON para dist/_i18n/ porque enviar-mail.php lê a copy da auto-resposta de lá. Alemão e espanhol usam tratamento formal ("Sie"/"usted"), já estabelecido no resto do dicionário.

2.6 O design system atual, verbatim
Um arquivo só: src/styles/global.css (479 l.), importado por BaseLayout.astro e pelo styleguide. Tailwind v4 com @import "tailwindcss" source(none) + @source "../**/*.{astro,ts,tsx,js,jsx}". Sem SCSS, zero @apply. Tokens em @theme, utilitários em @utility, base em @layer base.

O mundo declarado é "painel de marchetaria", com quatro disciplinas escritas no topo:

Todo ornamento é artefato real do sistema (emenda de folha, número de peça, borda de corte) — nunca floreio desenhado.
Toda grandeza assenta numa medida declarada.
A composição reserva uma região onde tipo nenhum entra, para a fotografia nunca ser sobrescrita.
Coragem de densidade: uma palavra em corpo que não encolhe no celular.
Cores (cada valor traz a razão de contraste medida no comentário original):

/* AREIA — superfícies (1,15× de luminância entre as duas) */
--color-areia-clara: #fdf8ee;  /* chão da página */
--color-areia:       #f4e7cf;  /* superfície de seção */
/* AREIA MOLHADA — o quente; substitui a terracota */
--color-areia-sol:   #ad7519;  /* régua, borda, número: 3,72:1 e 3,22:1 */
--color-areia-funda: #8a5a1e;  /* etiqueta sobre areia: 5,57:1 e 4,82:1 */
/* MAR — o tipo */
--color-mar-fundo:   #0d3244;  /* corpo: 12,7:1 · e o rodapé */
--color-mar:         #17506a;  /* título: 8,3:1 · e a faixa de fecho */
/* CÉU — a única cor que grita: CTA e link, em nada mais */
--color-ceu:         #1b6aad;  /* 5,3:1 */
--color-ceu-hover:   #12466f;  /* hover ESCURECE: sobe para 9,3:1 */
/* Sobre escuro — a escada inverte */
--color-espuma:      #cfe3ec;  /* corpo sobre mar-fundo: 10,2:1 */
--color-sol:         #e9bd68;  /* etiqueta e anel de foco: 7,7:1 */
--color-coral-luz:   #efb391;  /* acento COM FUNÇÃO sobre escuro: 4,8:1 */
/* Erro — dois valores, o formulário existe nos dois contextos */
--color-erro:        #a3311a;  /* sobre areia: 6,6:1 */
--color-erro-luz:    #efb391;  /* sobre mar: 4,8:1 */
Variáveis por contexto, e a inversão em .sobre-escuro:

var	:root (areia)	.sobre-escuro
--anel-foco	--color-mar-fundo	--color-sol
--cor-emenda	--color-areia-sol a 100%, sem alfa (a 85% cai para 2,96:1 e reprova SC 1.4.11)	color-mix(espuma 45%, transparent)
--aresta-cta	--color-ceu-hover	--color-sol
--cor-titulo	--color-mar	--color-areia
--cor-etiqueta	--color-areia-funda	--color-sol
A escada de texto inverteu quando o chão clareou, e isso é deliberado: mar-fundo 12,7:1 = a voz que informa (corpo 16px, meta 14px); mar 8,3:1 = a voz que fala (título, lead 20px); areia-funda 5,6:1 = o registro (etiqueta, número, medida). O corpo é o valor mais forte e o título é mais fraco. O comentário explica: no claro, a massa de texto pequeno precisa da tinta cheia, e um display de 600 em 125% de largura já carrega peso por tamanho e forma. Repetir a hierarquia do escuro daria título preto e corpo cinza, que é o modo de falhar do tema claro.

Tipografia. Google Fonts CDN, carregadas em BaseLayout.astro:108-112 com preconnect: Archivo:wdth,wght@62..125,300..700 + Archivo+Narrow:wght@400..700. Duas famílias, ambas variáveis, nenhuma serifa ("a Fraunces saiu").

--font-display: "Archivo", ui-sans-serif, system-ui, sans-serif;
--font-sans:    "Archivo", ui-sans-serif, system-ui, sans-serif;
--font-label:   "Archivo Narrow", "Archivo", ui-sans-serif, sans-serif;

--text-display:  clamp(3.25rem, 7vw, 6rem);        /* lh 1.02 · ls 0.01em */
--text-titulo:   clamp(2rem, 4.5vw, 3.25rem);      /* lh 1.08 · ls 0 */
--text-secao:    clamp(1.375rem, 2.5vw, 1.875rem); /* lh 1.2 */
--text-intro:    clamp(1.25rem, 1.6vw, 1.3125rem); /* lh 1.6 — 1,25× o corpo no menor viewport */
--text-etiqueta: 0.75rem;   /* 12px, NÃO 11px, por causa do japonês · lh 1.3 · ls 0.14em */

--spacing-secao:  clamp(4rem, 9vw, 8rem);
--spacing-header: 5.5rem;   /* gera a classe pt-header */
--spacing-medida: 1.5rem;   /* Disciplina 2: a medida declarada */
body: weight 400, 1rem, line-height 1.7, antialiased. h1,h2,h3: font-display, weight 600, font-stretch: 125% (eixo de largura da Archivo, fiel ao wordmark largo), color: var(--cor-titulo), text-wrap: balance. p { text-wrap: pretty }.

Japonês (:lang(ja)): tracking a 0, display line-height 1.35, título 1.4, etiqueta a 0.04em, stack com "Hiragino Sans", "Noto Sans JP", "Yu Gothic". E :lang(ja) .etiqueta { text-transform: none; font-size: 0.875rem } — caixa alta é no-op em kana e 12px tracked fica ilegível.

Radius: zero em todo o sistema. border-radius: 0 explícito em :focus-visible, .btn, .seta-carrossel, .campo-form, cada um com o comentário "marchetaria não tem raio: a folha é cortada e mitrada". Únicas exceções: rounded-full nos pontos de 8-10px do LinhaDoDia e rounded-none explícito no card do CarrosselHero.

Sombras: duas no site inteiro. 0 10px 26px -12px rgb(0 0 0 / 0.6) nas polaroides de ListaExperiencias.astro:84, e shadow-lg no dropdown de idioma em Header.astro:81. Nenhum token de sombra.

Breakpoints: os defaults do Tailwind v4. Nenhum --breakpoint-* customizado. As media queries escritas à mão usam 48rem e 80rem.

Utilitários (@utility): cor-titulo · etiqueta (Archivo Narrow 12px uppercase ls 0.14em w600 — explicitamente NÃO é olho de seção, "nunca ponha isto acima de um título") · lead · meta (14px, color: inherit, porque o degrau é o TAMANHO e não a cor) · numero (tabular-nums) · container-editorial (max 84rem, padding 1.25→2.5→4rem) · container-texto (68ch) · secao · emenda (a régua do layout: o filete do embutido) · cunha-topo/cunha-base (clip-path com corte de 3.5vw) · octogono (clip-path) · btn/btn-primario/btn-secundario · seta-carrossel (quadrado 2.75rem para SC 2.5.8, com aresta a 70% e não 55% — medido: 55% reprova SC 1.4.11 quando não há rótulo de texto) · link-texto/link-escuro · campo-form · texto-erro.

"O que este mundo NÃO é", declarado no CSS: fundo creme com serifa de alto contraste e acento terracota — "o agrupamento em que interfaces geradas por máquina caem". Guarde isso: é a mesma armadilha que a skill frontend-design nomeia, e a direção nova não pode cair nela.

O site evita cards. "Duas maneiras de ficar" (Home.astro:581) é comentada como "não dois cards: sem raio, sem sombra, a junta é que divide". A Galeria é grid de 

<figure></figure>

. Os únicos cards reais são os do CarrosselHero.

Não existe utility de hero — o hero da home é composição própria em Home.astro:342-409 (palco h-[clamp(23rem,56svh,34rem)], grid flex-col com order-2/lg:order-1 para inverter foto e gancho no celular). Nenhum tipo sobre fotografia no hero hoje, nem no celular.

2.7 JavaScript
Duas ilhas React, ambas com framer-motion: CarrosselHero (usado em Home.astro:383, client:visible) e CarrosselAcomodacoes (em Home.astro:536 client:visible e Pousada.astro:244 client:load, porque ali é o maior elemento acima da dobra).

Cinco scripts Astro vanilla: Header.astro:179 (transparente→sólido no scroll, trava de scroll e foco no menu mobile, Esc fecha) · MapaSituacao.astro:138 (

<dialog></dialog>

 nativo da lupa) · Home.astro:659 (o play do vídeo — adiciona controls só no primeiro clique) · FormularioReserva.astro:174 (honeypot _hp + timestamp _t, validação inline, fetch, foco no erro em ordem de DOM) · pages/index.astro:19 (detecção de idioma).

Não existe: lightbox, lazy-load custom (usa loading="lazy" nativo), biblioteca de ícones — todos os SVG são inline e desenhados (Voluta, Logo, o octógono de play, a lupa, a estrela, o meandro do rio, o chevron de idioma).

Restrição de produto: o site precisa funcionar sem JavaScript — navegação inteira, seletor de idioma e todo caminho para o contato. É por isso que o menu mobile e o seletor de idioma são 

<details></details>

</details>

 nativos, o formulário é POST nativo, e a Galeria não tem lightbox. Rede instável e navegador antigo são cenário real do público brasileiro.

Animação hoje: framer-motion só nos dois carrosséis; transições CSS de 0,2–0,55 s em btn, links, seta-carrossel, header, e as polaroides de ListaExperiencias (cubic-bezier(0.16, 1, 0.3, 1), 0,55 s). html { scroll-behavior: smooth } + @media (prefers-reduced-motion: reduce) em global.css:202-209 que zera durações globalmente. O autoplay do CarrosselHero (5500 ms, pausa em hover/drag/foco) morre sob reduced-motion. Classes motion-reduce:transition-none nos carrosséis.

2.8 Mídia em uso
Todas as imagens passam por astro:assets (Image ou getImage) com sharp. Fonte: src/assets/imgs/ — 74 arquivos versionados, derivados a 2048–2400px (os originais ficam no Drive; o acervo bruto em Assets/ é gitignorado). Saída sempre webp.

<Image src={gal3} alt="…" widths={[900,1400,1920]} sizes="100vw"
       loading="lazy" decoding="async" class="…" />
<picture></picture> não é usado — só  com srcset/sizes. As escalas de widths variam por lugar: hero [480,720,1080,1440,1920], acomodações [480,720,1080,1440], galeria [420,700,1100], mapa [560,840,1120]. Orçamento de eager explícito: na Galeria só as 3 primeiras fotos da página inteira são eager (índice corrido entre capítulos). Nas ilhas React o getImage() roda no frontmatter e o srcSet.attribute vai como prop.

Nunca ampliar. As fotos vindas de recorte (1290px) e do Airbnb (1200px) entram na resolução nativa; ampliar não cria detalhe, cria bytes e uma promessa falsa.

Dívida conhecida: 7 fotos do hero têm origem de 1286–1462px contra ~1120 CSS px de card — em tela de densidade dupla ficam moles. Nenhuma foi ampliada de propósito (Home.astro:141-148). — FALSO, MEDIDO EM 22/08/2026: 24 das 65 fotos do site FORAM ampliadas, por `gpt-image-2/edit` em 20/08, de 1,07× a 3,34× (`hero5`: 613px → 2048px). As sete do hero estão entre elas, a ~1,58×. O comentário em Home.astro:141-148 descreve a intenção de quem o escreveu, não o arquivo que está no disco. E o problema real é maior: em DPR 2 TODAS as imagens do site entregam ~0,54× dos pixels necessários, não só sete. Ver `docs/revisao-2026-08-22.md` §2.3 e §3.1. A regra "nunca ampliar" segue valendo daqui para frente; as 24 ficam por decisão do Carlos em 22/08.

O único vídeo no ar: public/video/villa-de-cima.mp4 (3.271.756 bytes = 3,1 MB), em Home.astro:469-513:

<video src={VISTA_VIDEO} poster={vistaCartaz.src} preload="none"
       playsinline muted aria-label={t('home.vistaDesc')}
       class="aspect-video w-full bg-mar-fundo"></video>
Sem autoplay, sem loop, sem controls no HTML. O controls entra por script no primeiro play (Home.astro:671) porque com o atributo presente, Chrome e Safari desenham a barra preta em cima do cartaz desde o primeiro paint. Dois gatilhos [data-tocar]: um <button aria-hidden tabindex="-1"> cobrindo o cartaz, e um <a href={VISTA_VIDEO}> na régua da legenda — que sem JS navega para o arquivo e o navegador toca na aba. Nenhum iframe de YouTube/Vimeo em lugar nenhum.

[O peso está escrito na legenda e sai de statSync no arquivo real a cada build (Home.astro:307): &#34;{s} s · {mb} MB · sem som&#34; → &#34;14 s · 3,1 MB · sem som&#34;. Se o clipe trocar, a legenda se corrige sozinha e não pode divergir do servidor.]({VISTA_VIDEO})

[2.9 Copy e tom de voz
Trechos reais de pt.json (grupo home), para calibrar:]({VISTA_VIDEO})

[hookA: &#34;Um Caribe de água doce e quente, dentro da floresta.&#34;
hookB: &#34;E você dorme lá. É inesquecível.&#34;
intro: &#34;A praia é de água doce e transparente, e quase não tem mosquito. É assim o Arapiuns. Os bangalôs são de madeira, arquitetura tapajônica, pé na areia. Você pode vir por alguns dias, ou até morar aqui, já pensou?&#34;
travessiaI: &#34;Chegar faz parte. São três etapas, e a última é nossa.&#34;
casaP1: &#34;As portas são de mogno, com marchetaria: cunhas de veio oposto irradiando de um centro octogonal, cortadas e encaixadas à mão.&#34;
precoD: &#34;A diária cai conforme o grupo cresce e a estadia se alonga. Diga quantas pessoas e quantas noites, e a gente responde com o valor fechado pelo WhatsApp — sem formulário.&#34;
fechaD: &#34;Quem responde é quem recebe.&#34;
CTAs: &#34;Reservar&#34; · &#34;Consultar datas&#34; · &#34;Falar no WhatsApp&#34; · &#34;Ver pacotes&#34; · &#34;Saiba mais&#34;. Nav: &#34;A Pousada · A Mesa · Experiências · Pacotes · Grupos · Como Chegar · Galeria&#34;. Tagline: &#34;Pousada na Amazônia · Rio Arapiuns, Pará&#34;.]({VISTA_VIDEO})

[Tom: segunda pessoa direta, frases curtas, pergunta retórica ocasional, material antes de adjetivo (&#34;mogno&#34;, &#34;cunhas de veio oposto&#34;, &#34;xadrez de chocolate e aveia&#34;), preço sempre com a condição ao lado, e recusa explícita de superlativo sem prova. Nenhum &#34;descubra&#34;, &#34;paraíso&#34;, &#34;experiência única&#34;.]({VISTA_VIDEO})

[Decisão de copy que vale para o futuro: o site NÃO nomeia quem atende. Copy impessoal (&#34;Falar no WhatsApp&#34;, não &#34;Fale com Gabriela&#34;), porque contato comercial troca de mão e assim o dia da troca é uma linha em site.ts.]({VISTA_VIDEO})

[2.10 Os cinco verificadores (portões automatizados que já existem)
script	o que garante
tools/i18n-parity.mjs	paridade dos 5 dicionários, descendo dentro de arrays
tools/contato-unico.mjs	canal comercial único, no HTML e no PHP construídos
tools/prazo-unico.mjs	as 25 strings de prazo de resposta prometem o mesmo número
tools/contraste-dom.mjs	lê os hexes do @theme e confere os pares no DOM construído
tools/classes-fantasma.mjs	classe no HTML sem regra no CSS. O comentário dele diz: &#34;esse defeito voltou quatro vezes nesta sessão&#34;
Os cinco passam hoje. Passam depois, ou não fecha. O contraste-dom importa em especial: significa que a paleta nova nasce verificada ou não nasce. E o classes-fantasma é exatamente o que quebra quando se reescreve CSS.]({VISTA_VIDEO})

[2.11 Ferramentas de acervo que já existem — use, não reescreva
tools/acervo-inventario.mjs — sharp para metadados + dHash 8×8, agrupa por distância de Hamming ≤ 5, sem visão nenhuma. Resultado medido: 2.201 arquivos → 1.986 momentos distintos. A redução de 10% é o achado: este acervo já vem catado. node tools/acervo-inventario.mjs &#34;Assets/Media&#34; inventario.json
tools/acervo-folhas.mjs — sharp + ffmpeg para montar folhas de contato de 24 miniaturas em 1920×1040. Custo: ~2,7k tokens por folha em vez de ~52k lendo uma a uma. Para vídeo, extrai um quadro a 40% da duração. node tools/acervo-folhas.mjs manifesto.txt folhas/ 6 4
Ler 2.201 imagens uma a uma custaria da ordem de 1 milhão de tokens de visão. O caminho acima custou ~43 mil. Amostrar, não desduplicar, é o que economiza aqui.]({VISTA_VIDEO})

3. [O acervo de mídia
   Local: Assets/Media/Fotos - Villa Arapiuns/ — gitignorado, ~20 GB medidos (os comentários no .gitignore e no acervo.md dizem 401 MB e 1,5 GB; envelheceram). Estrutura numerada: 1 Site 2026, 2 Anúncios, 3 Acervo, 4 Grupos e Retiros, 5 Vídeos, 6 Marca. 2.201 imagens e 37 vídeos. Inventário completo em docs/acervo.md (379 l.) — leia-o, é a fonte de verdade.]({VISTA_VIDEO})

[3.1 Os 37 vídeos — o ativo central deste plano
Todos H.264, todos em Assets/Media/Fotos - Villa Arapiuns/5 Vídeos/. Total 2,6 GB.]({VISTA_VIDEO})

[Reels/ — 5 peças VERTICAIS 1080×1920, 24 fps, áudio AAC estéreo. Já legendadas em PT/EN.]({VISTA_VIDEO})

[Arquivo	MB	Duração
Villa Arapiuns - Astrologia Locacional.mp4	317	2:43,9
Villa Arapiuns - Experiências.mp4	118	1:01,3
Villa Arapiuns - Espiritualidade.mp4	96	49,5 s
Villa Arapiuns - Comunidade.mp4	88	45,2 s
Villa Arapiuns - Apresentação.mp4	84	44,5 s
São a peça mais pronta e a mais parada do acervo: verticais nativos, narrativos, com som, e já trazem vocabulário de marca embutido — &#34;espaços amplos · contato com a natureza · comunidades tradicionais · como o rio Arapiuns&#34;.]({VISTA_VIDEO})

[Capas - Home LP/Seleção/ — 21 clipes, e esta é a curadoria. Dezenove a 1920×1080 a 59,94 fps com áudio (~60 Mb/s, inutilizáveis crus na web), e quatro a 1280×720 30p sem áudio, que são o material de drone/localização:]({VISTA_VIDEO})

[banho de ervas 21,6 s · Chegada_Piracaia 17,3 s · canoagem no igapó (floresta) 13,9 s · Macaco Guariba (Floresta) 12,7 s · Tingimento de palha 12,4 s · villa arapiuns (drone) 47,0 s (720p30, sem áudio) · Lado azul_canoagem 10,3 s · Entrada Villa Arapiuns_Rio Arapiuns 10,2 s · Urucum_tingimento de palha 9,0 s · navegação de canoa 7,5 s · puxada de mãe (massagem) 7,1 s · peneira_farinhada 7,0 s · casa de farinha 6,3 s · ervas para banho 5,8 s · Meliponário (mel de abelha) 4,4 s · Piracaia 4,2 s · lago azul_canoagem(1) 4,1 s · Fauna da floresta 4,1 s · localização_lago azul 26,5 s e Localização_lago azul(1) 11,3 s (720p30, sem áudio).]({VISTA_VIDEO})

[Capas - Home LP/ (raiz) — 11 clipes horizontais 1920×1080 59,94 fps: Oficina de artesanato (1) 21,0 s · Farinhada 15,5 s · Igarapé_Trilha_Argila 14,0 s · Palha de tucumã 10,4 s · Oficina de artesanato 8,0 s · Lago Azul 6,7 s · Gastronomia 5,1 s · trilha na floresta 4,9 s · Farinhada (1) 3,6 s · Casa de farinha 3,0 s · Rio Arapiuns 2,8 s.]({VISTA_VIDEO})

[Agrupados por tema: drone/aérea (4, incluindo o publicado) · farinhada/casa de farinha (6) · artesanato/palha/urucum (5) · água/canoa/lago (6) · ritual e corpo (4) · chegada/rio (3) · fauna (3) · mata/trilha/igarapé (3) · praia noturna/piracaia (2) · mesa (1) · reels institucionais verticais (5).]({VISTA_VIDEO})

[Sem cobertura em vídeo: quarto/acomodação, pôr do sol, mesa posta (só 5 s), e pesca de mergulho noturna — que é justamente a atividade que o cliente quer vender na página de Grupos.]({VISTA_VIDEO})

[Estado: 1 de 37 no ar. Existe 1 poster para 37 vídeos (src/assets/imgs/villa-de-cima-poster.jpg). Não existe script de transcodificação — só uma receita ffmpeg de uma linha em markdown, rodada à mão uma vez.]({VISTA_VIDEO})

[3.2 Compressão de vídeo — sete encodes já medidos, não repita o teste
Do docs/acervo.md, no clipe do drone:]({VISTA_VIDEO})

[Ajuste	Resultado
28 s · 720p · crf 24 / 26 / 28	17,1 / 12,7 / 9,3 MB
18 s · 720p25 · crf 29	4,5 MB
18 s · 720p25 · AV1 (SVT preset 6, crf 40)	4,2 MB — só 8% abaixo do h264
20 s · 1024×576 · crf 27	5,4 MB — maior que os mesmos 20 s a 720p crf 31
20 s · 720p24 · crf 31	4,4 MB
14 s · 720p24 · crf 31	3,1 MB ← o que está no ar
Três conclusões reutilizáveis:]({VISTA_VIDEO})

[Baixar resolução não economiza. O crf persegue qualidade, e qualidade num quadro menor custa mais bits por pixel.
AV1 não paga. 8% de arquivo em troca do dobro de peso no repo e do risco de decodificar em telefone antigo — que é o público #1.
O que economiza é cortar duração e subir o crf. Copa de mata em movimento é dos assuntos mais caros que existem: foliagem em movimento não tem redundância entre quadros, que é de onde todo codec tira economia.
A receita que está no ar:]({VISTA_VIDEO})

[ffmpeg -ss 10 -i &#34;.../Seleção/villa arapiuns (drone).MP4&#34; -t 14 -an 
  -vf fps=24 -c:v libx264 -preset veryslow -crf 31 -tune film 
  -profile:v high -level 4.0 -pix_fmt yuv420p -g 48 
  -movflags +faststart public/video/villa-de-cima.mp4
3.3 As fotos, em agregado
Por extensão (acervo bruto): 2.074 jpg · 70 png · 32 avif · 13 webp · 12 jpeg. Por tamanho: 53% acima de 5 MB, 43% entre 1 e 5 MB, só ~4% abaixo de 1 MB. Este acervo é quase todo original em resolução cheia.]({VISTA_VIDEO})

[Pastas principais (arquivos / quantos são retrato): 4 Grupos e Retiros/*/Captação completa 900/746 (3000px+, um retiro inteiro em reportagem — o maior e mais útil bloco) · Casa e Acomodações/Área Externa 222/85 · Mata/Trilha na Floresta 143/57 · Yoga e Práticas 129/36 · Água/Rio Arapiuns - Praia 102/28 · Água/Lago Azul 92/26 · Gente/Farinhada 73/6 · Gente/Piracaia 73/23 · Mesa/Mesa e Pratos 69/52 · Água/Canal do Jari 62/4 · Gente/Banho de Ervas e Puxada de Mãe 49/15 · Mesa/Café da Manhã 35/21 · 2 Anúncios/Selecionadas 26/1 (curadoria humana em resolução cheia, 3072×2048 e 6240×4160 — o melhor ponto de partida) · 3 Acervo/Equipe 18/12 (retratos frontais da equipe) · Água/Embarque 8/1 (Alter do Chão: a passarela azul, os barcos, o grupo na areia).]({VISTA_VIDEO})

[3 Acervo/0 Seleção editorial - com gente/ — 72 arquivos, e uma armadilha registrada. Os arquivos chamam-se Captura de tela 2025-04-14 ….png e não são capturas de tela: são recortes limpos de fotografia profissional a ~1290×860, e é a melhor curadoria do acervo — um quadro por momento, cobrindo o produto inteiro, e é praticamente o único material com pessoas. Três rodadas de trabalho já as descartaram em bloco pelo nome, sem abrir nenhuma. Cruzando dHash: 40 têm gêmea em resolução maior noutra pasta, 24 são fotografia única que só existe a ~1290px, e 8 são refugo. A ~1290px não aguentam largura cheia, mas aguentam coluna e card.]({VISTA_VIDEO})

[Refugo de verdade, e é só isto: os 8 .avif redimensionados pelo Wix (294–613px) — dos quais 5 têm nome de lugar turístico (FLORESTA NACIONAL DO TAPAJÓS - ALTER DO CHÃO e companhia) e estão barrados por autoria/licença não confirmada — e as 32 de 2 Anúncios/Airbnb/ (derivados baixados). O sinal que separa o refugo é extensão .avif, abaixo de 700px, com nome de lugar turístico — não o nome &#34;Captura de tela&#34;.]({VISTA_VIDEO})

[Regra que vale para sempre: abrir a imagem antes de classificar. Nome de arquivo e dimensão irregular não dizem o que a foto é. Para lote grande, folha de contato.]({VISTA_VIDEO})

[3.4 Direito de imagem
Liberado. O cliente confirmou em 21/08/2026 que as pessoas fotografadas autorizaram o uso e que os direitos são da Villa, sem crédito obrigatório. É isso que permite mover foto de Assets/ (gitignorado) para src/assets/imgs/ (versionado, repo público).]({VISTA_VIDEO})

[Mas: quais fotos de hóspede em traje de banho vão ao site é escolha editorial do cliente, não consequência automática da autorização — o banho de ervas e a puxada de mãe têm fotos de rosto visível. E não nomear quem conduziu os retiros.]({VISTA_VIDEO})

[3.5 Fatos que o acervo revela e o site ainda não afirma
Meliponário · macaco guariba · banho de argila no igarapé · canoagem no igapó · stand-up paddle · puxada de mãe · tingimento de palha com urucum · palha de tucumã. O acervo prova que a cena aconteceu, não que a atividade esteja em oferta. Nada disso entra em texto sem confirmação do cliente. (Os barcos têm nome: NEBLINA I, BEIJA-FLOR, PÉROLA DO TAPAJÓS.)]({VISTA_VIDEO})

4. [As skills, e para que serve cada uma
   O repo vendoriza 28 skills em _config/skills/, com symlinks em .claude/skills/. A procedência está em _config/skills/ORIGEM.md: impeccable (v4.1.1, Apache 2.0), 12 de emilkowalski/skills (MIT), 13 de leonxlnx/taste-skill (MIT), playwright-cli.]({VISTA_VIDEO})

[Alerta: _config/skills/frontend-design/ não tem symlink em .claude/skills/ e não consta do ORIGEM.md — é cópia órfã. A frontend-design ativa vem de plugin (frontend-design:frontend-design). Use a de plugin.]({VISTA_VIDEO})

[Aviso do próprio ORIGEM.md: design-taste-frontend, high-end-visual-design, minimalist-ui e redesign-existing-projects prescrevem linguagem visual conflitante entre si e com impeccable/frontend-design. &#34;Invoque uma por vez e com intenção, não as três juntas.&#34;]({VISTA_VIDEO})

[4.1 As 11 que este plano usa
Skill	Fase	Para quê, concretamente
impeccable (audit, critique, document, polish, bolder, layout, typeset, colorize, harden, optimize, live)	0, 4, 6, 7	A única com evidência automatizada: detector próprio em impeccable/scripts/detector/ (engines regex, HTML estático, browser via Puppeteer, e visual/contraste por screenshot), score 0–4 em 5 dimensões, snapshot em .impeccable/critique/. Tem adaptador Astro para o modo live (scripts/live/frameworks/astro.mjs). O Mode &#34;Experience&#34; dela — &#34;o visitante está dentro da obra; deixe o artefato liderar do primeiro viewport&#34; — é literalmente este site. Já está inicializada: .impeccable/config.json tem buildPath: &#34;code&#34;.
redesign-existing-projects	0	Checklist de auditoria em 8 blocos (Typography, Color and Surfaces, Layout, Interactivity and States, Content, Component Patterns, Iconography, Code Quality) + &#34;Strategic Omissions (What AI Typically Forgets)&#34; + Fix Priority. Pega o que é gosto e o detector não mede. Regra dela: &#34;não reescreva do zero, melhore o que está lá&#34;.
superpowers:brainstorming	1	Traduzir &#34;Amazônia caribenha&#34; em palavras que decidem pixel, antes de virar pixel.
frontend-design (plugin)	1	Calibração anti-slop. Ela nomeia os 3 agrupamentos em que design de IA cai — e um deles é creme #F4F1EA + serifa de alto contraste + acento terracota, que é exatamente o que o global.css:17-22 já jura não ser. É o que impede reintroduzir o clichê achando que se está modernizando. Também manda ancorar o design no assunto concreto: &#34;o mundo do sujeito, seus materiais, instrumentos, artefatos e vernáculo é de onde vêm as escolhas distintas&#34; — que é literalmente o posicionamento do PRODUCT.md.
design-taste-frontend	1, 4	A maior do conjunto (1.206 l.). Não é um estilo, é processo com dials (DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY) + &#34;Design Read&#34;. Usar três partes: §11 Redesign Protocol (audit-before-touching, preservation rules, árvore evolução-vs-redesign-total); §4.8 Image &amp; Visual Asset Strategy (a melhor peça do repo para site foto-cêntrico); §10 Reference Vocabulary (~50 padrões nomeados — é de onde saem &#34;Video / Media Mask Hero&#34; l. 712, &#34;Locomotive / Sequence Scroll&#34; l. 744, &#34;Text Mask Reveal&#34; l. 759, e os 6 padrões de &#34;Galleries &amp; Media&#34; l. 749-755). Fechar com §14 Final Pre-Flight Check.
prototype (+ PICKER.md)	2	O portão de decisão. Constrói variantes genuinamente diferentes de UMA peça de UI atrás de um picker visual para folhear ao vivo e promover a vencedora. Regras dela: nunca toca em código de produção durante a exploração (superfície isolada, apagada depois); cada variante diverge num eixo nomeado; toda variante funciona de verdade, com copy real, sem lorem ipsum. disable-model-invocation: true — só roda se você chamar.
high-end-visual-design	2	Só como banco de arquétipos de layout: Asymmetrical Bento, Z-Axis Cascade, Editorial Split — cada um com regra explícita de colapso mobile, que é raro nessas skills. NÃO usar o arquétipo &#34;Editorial Luxury&#34; (creme + sage + espresso + grão de filme): cai direto no clichê que a frontend-design bane e que o global.css já recusa por escrito.
animate + RECIPES.md	5	Constrói o motion. Sequência obrigatória: deve animar? (tabela por frequência — 100+ vezes/dia = nunca animar) → qual propósito → ferramenta mais barata que funcione → propriedades → curva e duração (valores tabelados, &#34;no approximated values&#34;) → interrupção → saída. O RECIPES.md traz 15 receitas com valores exatos; as que servem aqui são scroll reveal e stagger de entrada de grupo.
find-animation-opportunities	5	Filtro, não gerador. Read-only, propõe e não implementa, e é desenhada para rejeitar a maioria: output limitado a 5–7 sugestões para um app inteiro, ordenadas por leverage, cada candidato passando por um gate de 4 perguntas. É o que impede o site novo de virar vitrine de efeitos.
apple-design	5	A física: movimento que parte do valor atual na tela, herda a velocidade do usuário, projeta momentum e pode ser agarrado e revertido a qualquer instante. Tracking 1:1 com setPointerCapture, respeitar o offset de onde se agarrou, interruptibilidade (&#34;o princípio mais importante&#34;). O CarrosselHero já arrasta e teve o gesto medido; é aqui que a coluna de reels aprende a mesma sensação.
review-animations + STANDARDS.md	7	Revisa o diff de motion contra 10 padrões não-negociáveis, com &#34;default to flagging; approval is earned&#34;: motion justificado, frequência apropriada, ease-in em UI = block, sub-300ms, transform-origin correto (popover cresce do trigger; nunca scale(0), comece em 0,9–0,97), interruptibilidade, só transform/opacity, prefers-reduced-motion (mais suave, não zero), enter/exit assimétrico, coesão. disable-model-invocation: true.
playwright-cli (+ MCP playwright, registrado em .mcp.json)	0, 7	O loop de ver: open/goto/click/type/snapshot/eval/screenshot/close, usando refs de acessibilidade em vez de seletores. Segundo o ORIGEM.md, a CLI custa menos contexto por ação; o MCP é o caminho padrão de tool-call.
full-output-enforcement	4, 6	Acompanhante: proíbe truncar output (// ..., &#34;rest of code&#34;, &#34;for brevity&#34;), manda contar deliverables antes e conferir depois. Com 5 dicionários de 982 linhas, é o que impede um // ... virar bug de i18n.
4.2 O buraco: nenhuma skill cobre vídeo
Levantamento feito nas 28 (grep de video|autoplay|poster|lightbox|gallery|lazy-load em todos os .md): não existe nenhuma skill dedicada a vídeo ou mídia rica. Há padrões de composição (design-taste-frontend §10), a &#34;FIXED MEDIA FRAME RULE&#34; de image-to-code §20, e perf genérica de mídia em impeccable/reference/optimize.md. Mas nada sobre  de verdade: poster, preload, autoplay/muted/playsinline, formatos, bitrate, LCP com vídeo no hero, fallback em conexão lenta, prefers-reduced-motion aplicado a vídeo de fundo. (playwright-cli/references/video-recording.md é falso positivo — é gravar vídeo do teste.)]({VISTA_VIDEO})

[Isso é a Fase 3, e é trabalho novo.]({VISTA_VIDEO})

[4.3 As que NÃO usar, e por quê
minimalist-ui — estilo fechado &#34;Premium Utilitarian Minimalism&#34;, a cara do Notion/Linear-documento. Zero gradiente, zero sombra, pastéis lavados. Hostil a full-bleed de foto e vídeo.
industrial-brutalist-ui — Swiss print ou terminal militar CRT. &#34;Imagery is secondary&#34; é a antítese deste brief.
gpt-taste — escrita para GPT/Codex, com &#34;randomização Python&#34; simulada.
stitch-design-taste — inútil sem o Google Stitch. (O DESIGN.md de exemplo dela tem algum valor como formato.)
image-to-code, imagegen-frontend-web, brandkit — só ligam com gerador de imagem, e o PRODUCT.md proíbe mídia sintética de uma pousada real.
design-taste-frontend-v1 — subconjunto obsoleto da v2.
animate-expo, write-swift, imagegen-frontend-mobile — React Native, Swift, telas de app nativo. Nada a ver com um site Astro.
pick-ui-library, ask-sonner — React puro; marginais num site estático.
emil-design-eng — vale como leitura de piso de qualidade, não como fase.
5. O plano, fase por fase
Cada fase termina com o Carlos abrindo npm run dev e aprovando. Nada encadeia sem isso.]({VISTA_VIDEO})

[Fase 0 — Revisar o site inteiro
Skills: impeccable audit + critique + document · redesign-existing-projects · playwright-cli]({VISTA_VIDEO})

[Passos]({VISTA_VIDEO})

[Combinar escopo com qualquer sessão concorrente antes de escrever.
/impeccable document — gera o DESIGN.md que não existe no projeto, a partir do código atual. Sem esse baseline, as skills de taste discordam entre si sem árbitro.
/impeccable audit nas 11 páginas: score 0–4 em 5 dimensões, com o detector rodando Puppeteer e contraste por screenshot.
Passar o checklist de 8 blocos de redesign-existing-projects por cima.
Capturas em 1440px e 500px.
Inventariar a dívida da paleta antiga (§1 item 4) e o orçamento de JS (§1 item 5).
Entrega: docs/revisao-2026-08-22.md — achados priorizados, com captura de cada página, e a lista do que a direção nova tem de resolver. Portão: o Carlos lê o diagnóstico e concorda com as prioridades.]({VISTA_VIDEO})

[Fase 1 — Inspiração e a tese da direção
Skills: superpowers:brainstorming · WebSearch/WebFetch em galerias de premiação (autorizado) · frontend-design · design-taste-frontend §11 e §4.8]({VISTA_VIDEO})

[Passos]({VISTA_VIDEO})

[Buscar 8 a 12 referências de vídeo em primeiro plano em galerias de premiação. Para cada uma, escrever o que exatamente se está tirando dela — composição, escala, movimento de entrada, e sobretudo como resolvem vertical. Direção, não código.
Brainstorming: o que &#34;Amazônia caribenha&#34; quer dizer aqui. A matéria-prima é específica e verificada com o cliente:
água doce transparente e quente o ano todo, praia de rio, quase sem mosquito (comparativo com a Amazônia de várzea — nunca citar pH, nunca prometer zero);
banco de areia dourada avançando dentro do rio, água azul dos dois lados;
botos tucuxi, menores, e aparecem pertinho da Villa;
duas estações: jan–jul cheia (igapós, a canoa passa entre as copas), ago–dez seca (as praias de areia branca aparecem). Transformar &#34;época de chuva&#34; em paisagem que só existe naquele semestre é o maior ganho de venda já registrado;
sem TV, Starlink só para comunicação — desconexão como virtude, não carência;
água do banho de poço artesiano, chuveiro de pressão forte, sem aquecedor (vender como &#34;não precisa&#34;, não como falta); filtro, água potável sempre;
energia solar (confirmado; mas não dizer off-grid, autossuficiente, nem sem gerador — nada disso foi confirmado).
O contraponto que impede o site de virar cartão-postal genérico de Caribe é o eixo do PRODUCT.md: a matéria antes do bioma — mogno, marchetaria radial, tecelagem xadrez de chocolate e aveia, luminária de fibra, arquitetura tapajônica. Caribe é a luz e a água; Amazônia é a madeira e a mão. A direção tem de carregar as duas, e é isso que uma pousada vizinha não pode copiar honestamente.
Fixar os dials e as preservation rules.
Entrega: docs/direcao-visual.md — a tese em uma linha, o moodboard escrito com as referências, os dials, e a lista do intocável: AA de contraste medido, funcionar sem JS, cobertura CJK, conferir a 500px, os cinco verificadores. Portão: o Carlos aprova a tese antes de qualquer desenho.]({VISTA_VIDEO})

[Fase 2 — Direções na tela, ele escolhe olhando
Skills: prototype · high-end-visual-design como banco de arquétipos]({VISTA_VIDEO})

[Três variantes do hero da home, funcionando de verdade, com foto e vídeo reais do acervo, atrás de um picker visual em superfície isolada (fora do build de produção, apagada depois). Cada uma diverge num eixo nomeado, não em cor de botão:]({VISTA_VIDEO})

[A — Areia e mar levada ao limite. A paleta do cliente sobrevive intacta; mudam escala, ar, tipografia e movimento. Menor risco político, evolução mais honesta.
B — A água é a protagonista. O vídeo ocupa o primeiro viewport inteiro e o tipo entra como máscara sobre ele (&#34;Video / Media Mask Hero&#34;). A Disciplina 3 cai de propósito e declarado.
C — O vertical manda. Coluna de reels 9:16 como estrutura da página, não enfeite — a direção que resolve os ~1.100 retratos e os 5 Reels na mesma decisão.
Portão — o mais importante do plano: ele escolhe uma. Se nenhuma servir, iterar sobre a mais perto. Nada avança sem essa escolha. É aqui que se resolve, olhando, se a paleta areia-e-mar sobrevive.]({VISTA_VIDEO})

[Fase 3 — O playbook de vídeo
Skills: nenhuma cobre. superpowers:writing-skills se valer virar skill do projeto.]({VISTA_VIDEO})

[Passos]({VISTA_VIDEO})

[docs/video.md — o playbook: a receita ffmpeg medida, as três conclusões de §3.2, e o que muda quando o vídeo é hero com autoplay em vez de clipe com cartaz (LCP, muted obrigatório para autoplay, playsinline para iOS, o custo de preload no hero, prefers-reduced-motion num vídeo de fundo — que não é &#34;pausar&#34;, é decidir se o vídeo existe).
tools/video-web.mjs — transcodifica em lote, gera poster e grava o peso. O acervo-folhas.mjs já sabe extrair quadro a 40% da duração; reuse essa lógica em vez de reescrever. Hoje há 1 poster para 37 vídeos.
Recurar os clipes para a direção nova, do zero (a curadoria antiga foi desconsiderada por pedido do Carlos). Método barato: folha de contato dos 37 quadros extraídos, ffprobe para os finalistas. Os grupos temáticos estão em §3.1.
Os 5 Reels verticais legendados são a peça de maior valor e a mais pesada — entram pela coluna vertical, e trazem vocabulário de marca embutido.
Ligar o slot que já existe: CarrosselHero.tsx linha 139 (tipo) e 545-556 (render).
A restrição de produto que não se negocia. Público #1 é celular em 3G/4G instável, e o cliente já reclamou duas vezes de não conseguir ver as imagens da home. Então:]({VISTA_VIDEO})

[cartaz no lugar do quadro; preload=&#34;none&#34; fora do hero;
o peso escrito na legenda, vindo de statSync a cada build — não pode divergir do servidor nem envelhecer se o clipe trocar;
controls NÃO vai no HTML — com o atributo, Chrome e Safari desenham a barra preta em cima do cartaz desde o primeiro paint. Entra por script no primeiro play;
<a></a>]({VISTA_VIDEO}) para o arquivo como fallback: sem JS o clique ainda toca o vídeo, na aba.
Portão: o Carlos aprova os clipes escolhidos e o peso de cada um antes de montar página.

Fase 4 — O sistema visual novo
Skills: impeccable colorize / typeset / layout / live · design-taste-frontend §5 e §10 · full-output-enforcement

Passos

src/styles/global.css reescrito para a direção escolhida, mantendo a disciplina que faz este arquivo valer: cada token com a razão de contraste medida no comentário. Não é preciosismo — tools/contraste-dom.mjs lê os hexes do @theme e confere os pares no DOM construído. A paleta nova nasce verificada ou não nasce.
Varrer a dívida da paleta antiga nos quatro lugares: BaseLayout.astro:96 (theme-color), src/pages/index.astro (CSS inline), src/pages/pt/styleguide.astro:68-77 (array cores), e os comentários mortos de global.css (l. 388-396, 446).
Retrato e 9:16 resolvidos juntos — a frente 1 do acervo.md, cobrindo Galeria, Equipe e Experiências de uma vez, como o cliente decidiu em 21/08.
Componentes novos: hero de vídeo, coluna de reels, grelha vertical, bloco de mídia de seção. Os skeletons canônicos de design-taste-frontend §5 (Sticky-Stack, Horizontal-Pan, Scroll-Reveal Stagger) são a base.
Orçamento de JS declarado antes de escrever. Hoje são ~345 KB para dois carrosséis. Se a direção pedir mais React, o número entra no portão como número — e a alternativa (CSS scroll-snap para a coluna de reels, zero JS) é avaliada de verdade, não descartada por conveniência. Lembre que a Galeria não tem lightbox exatamente por essa disciplina.
src/pages/pt/styleguide.astro — hoje obsoleto, com a paleta morta. Vira a vitrine do sistema novo. É lá que o Carlos vê tudo antes de qualquer página mudar.
Portão: styleguide na tela.

Fase 5 — Movimento
Skills: find-animation-opportunities → animate + RECIPES.md → apple-design

Nessa ordem, de propósito: primeiro o filtro que rejeita a maioria e devolve 5–7 momentos no site inteiro; depois a construção com valores tabelados; a física do Apple só onde há gesto (coluna de reels e os carrosséis).

O padrão do projeto já está estabelecido e continua: @media (prefers-reduced-motion: reduce) em global.css:202 zera durações globalmente, e o autoplay do carrossel morre sob ele. O site tem de continuar funcionando sem JS — menu mobile e seletor de idioma em 

<details></details>

</details>

 nativos, formulário POST nativo, Galeria sem lightbox. Nada disso regride.

Fase 6 — Aplicar nas páginas
Skills: impeccable polish / bolder · full-output-enforcement

Uma página por vez, com portão. Ordem por tamanho do ganho, não pela do menu:

Home — onde o hero de vídeo mora.
Como Chegar (93 l., uma foto e um mapa) — a maior ansiedade do visitante é o trajeto, e a página não mostra o trajeto. O acervo tem a sequência de embarque em Alter do Chão inteira (3 Acervo/Água/Embarque: a passarela azul, os barcos na areia, o grupo caminhando, o barco com coletes).
Experiências — vídeo por atividade é onde o acervo é mais rico.
Galeria — hoje 30 fotos em grade 

<figure></figure>

 sem lightbox; é onde o vertical cabe sem briga (~1.100 candidatas).
A Mesa, A Pousada, Pacotes, Grupos, Reservar, Avaliações.
Em cada escolha de mídia: cena, nunca pose · a legenda nomeia a peça e o que acontece, nunca o clima · nada de fotografia noturna fora da piracaia · nada de mosquiteiro armado nas páginas que afirmam "praticamente sem mosquito".

Texto novo aprovado em PT propaga para en/es/de/ja na mesma resposta.

Fase 7 — Verificação
Skills: review-animations + STANDARDS.md · impeccable harden / optimize · playwright-cli

npm run build · npm run check · npm run i18n:check · npm run contato:check · npm run prazo:check · node tools/classes-fantasma.mjs $(find dist -name "*.html") · node tools/contraste-dom.mjs $(find dist -name "*.html"). Os cinco passam hoje; passam depois, ou não fecha. — OS ARGUMENTOS SÃO OBRIGATÓRIOS, corrigido em 22/08/2026: estes dois scripts leem os arquivos de process.argv.slice(2). Sem argumento eles checam ZERO nó e imprimem "SEM REGRA NO CSS → nenhuma" e "ABAIXO DE 4,5:1 → nenhum" — um verde indistinguível de um site perfeito. Com os argumentos a cobertura real é 451 classes e 6.549 nós de texto nas 57 páginas. Isto importa porque a Fase 4 reescreve o global.css inteiro e o comentário do próprio classes-fantasma diz que o defeito que ele caça "voltou quatro vezes nesta sessão".
Playwright em 1440px e 500px nas 57 páginas: zero overflow horizontal, zero imagem quebrada, zero alt faltando.
Peso por página medido, contra a baseline que docs/superpowers/specs/2026-08-20-vender-com-as-imagens-design.md:174-186 já registra (Experiências 384 KB na 1ª dobra, Pousada 483 KB, Galeria 455 KB/1,08 MB rolada, Mesa 507 KB, Pacotes 308 KB, Privativa 324 KB, Chegar 244 KB; a Home era a mais pesada, 986 KB só na 1ª dobra, por causa do bundle React). O vídeo no hero é o risco real de LCP e é aqui que ele aparece em número.
Sem JS (DevTools → desabilitar JavaScript): navegação, seletor de idioma e todo caminho para o contato.
review-animations no diff de motion.
Nenhum git push, nenhum deploy.
6. Armadilhas registradas — todas já custaram trabalho a alguém
Conferir celular a 500px, não a 390. O Chrome headless impõe janela mínima de ~500px e recorta a imagem depois no tamanho pedido. Pedir 390 devolve uma foto de uma página de 500px cortada, e o texto aparece "estourando" sem estourar. Já derrubou duas verificações. (Nuance: isso vale para a flag --window-size do binário; o viewport do Playwright via Emulation.setDeviceMetricsOverride a 390 devolve exatamente 390. Se usar Playwright, meça antes de supor.)
Rolar a página e esperar 250 ms NÃO basta para conferir fotografia. As imagens lazy ainda estão em voo e a foto sai vazia. Isso produziu um falso positivo ("a seca está sem foto") que só caiu quando o elemento foi medido no navegador. Antes de screenshot, forçar loading = 'eager' e esperar o load de cada .
loading="lazy" não segura uma tira horizontal. A tira inteira está dentro da viewport — só é transladada — então o navegador baixa quase tudo. Medido a 390px com 30 fotos: 35 imagens e 1.123 KB na primeira dobra, para um visitante que vê duas. A solução no CarrosselHero é uma janela: o  só existe para cards a até cinco posições do foco (a largura vem de strip.larguras, não da imagem, então não há mexida de layout). Resultado medido: 22 imagens e 598 KB.
controls no HTML do  faz Chrome e Safari desenharem a barra preta em cima do cartaz desde o primeiro paint. Entra por script no primeiro play.
/Assets/ no .gitignore precisa da barra inicial. Sem ela, o macOS case-insensitive fazia casar src/assets/ e catorze imagens ficaram invisíveis ao git — um commit teria entrado com os .astro e sem as imagens, quebrando o build em qualquer clone.
classes-fantasma volta quando se mexe em CSS. O comentário do próprio script diz que o defeito voltou quatro vezes numa sessão. Rode a cada rodada de CSS, não só no fim.
Nome de arquivo não classifica imagem. Ver §3.3: "Captura de tela" é o nome que o macOS deu a recortes de fotografia profissional, e três rodadas já descartaram a melhor curadoria do acervo por causa disso.
Estilo sem camada vence utilitário do Tailwind. O @layer base do global.css existe por isso: um h2 { color } fora de camada apagou um título claro sobre fundo escuro.
tools/copia-dicionarios.mjs roda depois do astro build porque enviar-mail.php lê a copy da auto-resposta de dist/_i18n/. Se você trocar o build, não perca essa etapa. E dist/video/ é o diretório que um upload parcial esquece — já aconteceu com dist/_i18n/.
7. Dívida e bugs conhecidos
Fora de escopo, mas urgente — decisão do Carlos
O formulário publicado está morto. POST /enviar.php devolve 405 Not Allowed do nginx — o PHP não executa nesse docroot. Quem preenche vê página branca do nginx, sem marca e sem caminho de volta, e o pedido não chega a ninguém. GET /enviar.php devolve 200 com o código-fonte. Commit 138f7f8, documentado em docs/deploy-formulario.md. Não é redesign, é produção quebrada — perguntar ao Carlos se ele quer isso antes ou depois.

Fora de escopo, registrado
O logotipo é verde #617d54 (matiz 101°, medido três vezes no ativo de 2000×2000) e hoje renderiza em azul, porque Logo.astro herda a cor do contexto. Decidir é sobre a MARCA, não sobre o CSS. Aberto.
O impresso do cliente é verde (plano tarifário e panfleto). Site e impresso deixaram de casar quando a paleta trocou, e o cliente foi avisado antes de decidir.
mapa-arapiuns.png é raster e continua verde.
Não existe arquivo vetorial do logotipo — a marca no site é redesenho em SVG.
~20-30 alt estáticos continuam hardcoded em português (imagens fora de carrossel e de 

<figcaption></figcaption>

). Não afeta texto visível, só leitor de tela. Ficou de fora por escopo; perguntar ao Carlos antes de estender.
A tipografia do impresso é serifa de alto contraste; o site mantém Archivo. Decisão separada, em aberto — e a Fase 1 pode reabri-la, já que tipografia está na mesa.
Correção de documentação encontrada de passagem
PRODUCT.md:131-135 está desatualizado: diz que o canal público é +55 11 96976-0096 e que contact.email é null. Os dois mudaram em 21/08 — o número saiu do site inteiro, e o site.ts hoje tem reservas@vilaarapiuns.com.br e o WhatsApp 5547992067078. Quem ler o documento vai ser enganado por ele.

Decisões do cliente ainda abertas — não inventar, não exibir
Ano de fundação (yearFounded: null; a alegação "5+ anos, zero incidentes" foi removida por falta de respaldo) · avaliações (rating/count null; busca web em 20/08 não achou nenhuma avaliação pública — TripAdvisor existe e está vazio, e a propriedade está fragmentada em ≥3 listagens nas OTAs; a ação é coletar, não buscar) · tabela de preços das atividades das comunidades (os valores existem em COMMUNITY_ACTIVITIES mas o uso não foi confirmado) · tarifas de agência (documento confidencial; R$ 796 é a única cifra pública autorizada, sempre com "4 noites · quarto duplo" ao lado, nunca solta).

As oito perguntas ao cliente que o acervo abriu
Estão em docs/acervo.md:228-251. As que tocam este plano: quais atividades novas (meliponário, macaco guariba, banho de argila, canoagem no igapó, SUP) estão em oferta hoje; quais fotos de hóspede em traje de banho podem ir ao site; se vale pedir ao fotógrafo os originais das 24 fotografias que só existem a ~1290px.

8. Ordem de leitura para quem assume
   Este documento.
   PRODUCT.md (363 l.) — o documento de direção de produto. Público, posicionamento, modalidades, princípios, a11y, o que não fabricar.
   src/styles/global.css (479 l.) — os comentários deste arquivo são a documentação de design mais densa do projeto. Leia-os, não só as regras.
   docs/acervo.md (379 l.) — o inventário de mídia.
   src/content-pages/Home.astro (676 l.) e src/components/CarrosselHero.tsx (639 l.) — os frontmatters e os comentários de topo registram três rodadas de feedback do cliente e cinco coisas removidas do componente original do 21st.dev.
   docs/superpowers/specs/ — quatro specs com registro de decisão: 2026-08-20-home-carrossel-hero-design.md, 2026-08-20-vender-com-as-imagens-design.md, 2026-08-20-mapa-de-situacao-design.md, 2026-08-21-contato-comercial-formulario-design.md.
   _config/skills/ORIGEM.md — de onde vieram as 28 skills e o aviso de conflito entre elas.
   _legacy/index.html (1.181 l.) — o site anterior, preservado como fonte de verdade sobre o produto e anti-referência visual.
   docs/direcao-de-imagem.md — ler para saber o que já foi pensado, mas o Carlos pediu explicitamente para desconsiderar como restrição desta rodada. Ver §0.4.
   E lembre-se: os comentários de código deste projeto registram o que foi tentado, o que o cliente recusou, e a razão do que ficou. Antes de "melhorar" algo que parece estranho, leia o comentário — provavelmente alguém já tentou o óbvio e ele falhou por um motivo medido.
