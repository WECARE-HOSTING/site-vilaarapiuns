# O playbook de vídeo — Fase 3 do redesign

22/08/2026. Como o acervo de 37 clipes (2,6 GB) chega ao site sem quebrar a restrição de
produto que não se negocia: celular em 3G/4G instável é o caso normal, não a exceção
(`PRODUCT.md`, Princípio 4). Ferramenta: `tools/video-web.mjs`. Decisão de bloqueio resolvida
em §3.

## 1. A receita de compressão — sete encodes já medidos, não repita o teste

Do `docs/acervo.md`, no clipe do drone (o único no ar hoje, `public/video/villa-de-cima.mp4`):

| Ajuste | Resultado |
|---|---|
| 28 s · 720p · crf 24 / 26 / 28 | 17,1 / 12,7 / 9,3 MB |
| 18 s · 720p25 · crf 29 | 4,5 MB |
| 18 s · 720p25 · AV1 (SVT preset 6, crf 40) | 4,2 MB — só 8% abaixo do H.264 |
| 20 s · 1024×576 · crf 27 | 5,4 MB — maior que os mesmos 20 s a 720p crf 31 |
| 20 s · 720p24 · crf 31 | 4,4 MB |
| **14 s · 720p24 · crf 31** | **3,1 MB ← o que está no ar** |

Três conclusões reutilizáveis, e `tools/video-web.mjs` as aplica por padrão:

1. **Baixar resolução não economiza.** O crf persegue qualidade, e qualidade num quadro menor
   custa mais bits por pixel — 1024×576 saiu maior que 720p no mesmo teste.
2. **AV1 não paga.** 8% de arquivo em troca do dobro de peso no repo e do risco de decodificar
   em telefone antigo, que é o público #1.
3. **O que economiza é cortar duração e subir o crf.** Foliagem em movimento é dos assuntos
   mais caros que existem para um codec: não tem redundância entre quadros.

Receita padrão (a mesma que gerou o clipe no ar, parametrizada pela ferramenta):

```
ffmpeg -ss <corte> -i <origem> -t <duração> -an \
  -vf "scale=-2:720,fps=24" -c:v libx264 -preset veryslow -crf 31 -tune film \
  -profile:v high -level 4.0 -pix_fmt yuv420p -g 48 -movflags +faststart \
  <destino>
```

## 2. Dois padrões de vídeo, não um

A Fase 2 escolheu a variante C ("o vertical manda") — e isso introduz um segundo padrão de
vídeo que o plano original, escrito antes da escolha, não distinguia.

### Padrão 1 — clipe ambiente, com cartaz, clique para tocar

O que já está no ar na home (`villa-de-cima.mp4`, `Home.astro:455-513`). Uma peça só, grande,
com som desligado por decisão de conteúdo (não tem som para desligar) ou por decisão de
UX. O visitante decide ver.

- `preload="none"`, `playsinline`, `muted`, **sem `autoplay`**, **sem `controls` no HTML**.
- `controls` entra por script no primeiro `play()` — sem isso, Chrome e Safari desenham a
  barra preta sobre o cartaz desde o primeiro paint.
- Comando duplo: um `<button aria-hidden tabindex="-1">` cobrindo o cartaz (não navegável,
  não duplica nome acessível) e um `<a href={video}>` na régua da legenda — **este último é o
  que faz o padrão funcionar sem JavaScript**: sem script, o clique navega para o arquivo e o
  navegador toca o mp4 na aba.
- Legenda com peso e duração **medidos por `statSync` a cada build**, nunca escritos à mão —
  se o clipe trocar, a legenda se corrige sozinha e não pode divergir do servidor.

### Padrão 2 — cartão de loop mudo, tipo Reels

Novo, para a coluna vertical da variante C. Muitos clipes curtos e curtos de verdade (4-8s),
cada um um cartão 9:16 na tira, tocando em loop, sem som, sem controle de tempo — o
equivalente visual de folhear fotos, não de assistir a um filme.

- `autoplay muted loop playsinline preload="none"`. **As quatro tags nativas já são o
  comportamento inteiro** — nenhuma linha de JavaScript liga isto, e por isso funciona sem
  script de propósito, ao contrário do Padrão 1.
- **Sem `controls`, sempre** — não há timeline para expor: é um loop ambiente, não uma peça
  para assistir do início ao fim.
- **Sem legenda de peso/duração por cartão** — numa tira de muitos cartões isso é ruído
  visual. A legenda é só o nome da cena (`.etiqueta`), como já testado no protótipo da
  Fase 2.
- **Janela obrigatória, como o `CarrosselHero` já faz para foto**: só os cartões a até N
  posições do foco/da área visível existem de verdade no DOM (ou têm `src` atribuído). Sem
  isso, uma tira de 20 cartões autoplayando ao mesmo tempo é 20 decodificadores de vídeo
  simultâneos — nenhum celular em 3G aguenta, e é exatamente o achado do §3.3 da Fase 0
  (`loading="lazy"` não segura uma tira horizontal; aqui o risco é maior porque é vídeo, não
  foto). Mecanismo recomendado: `IntersectionObserver` atribuindo `src` só quando o cartão
  entra na área visível, e removendo (não só pausando) quando sai — descarregar o
  decodificador, não só parar o relógio.
- **`prefers-reduced-motion: reduce` não é "pausar o loop"** — é decidir se o vídeo existe.
  Sob redução de movimento, o cartão deixa de ser vídeo e passa a ser o cartaz (a mesma
  imagem que seria o `poster`), sem nenhum comando de play — o cartão perde o movimento, não
  ganha um controle novo para repor.

## 3. A decisão que bloqueava a Fase 3 — resolvida aqui

A Fase 2 descobriu (`villa-arapiuns-reels-legenda-queimada`, memória de projeto): **o único
material em vídeo vertical (9:16) do acervo inteiro são os 5 Reels institucionais, e os 5 têm
o título de capítulo queimado no pixel, em PT/EN** — não é faixa de legenda separada. Usá-los
direto quebraria a paridade de 5 idiomas que `tools/i18n-parity.mjs` garante para o resto do
site.

**Decisão: recortar vertical a partir do material horizontal sem legenda.** Todo o resto do
acervo de vídeo (`Capas - Home LP/`, raiz e `Seleção/`, 32 clipes) é 1920×1080 ou 1280×720,
sem nenhum texto queimado. Um `crop=ih*9/16:ih` centrado (a mesma transformação que o
protótipo da Fase 2 já testou em `lago azul_canoagem(1).MP4`) produz um cartão 9:16 limpo,
igual em todos os 5 idiomas, e sem custo de tradução. **Os 5 Reels ficam de fora da coluna de
reels por ora** — permanecem como material de referência/institucional, não como fonte de
cartão. Se o Carlos quiser usá-los como conteúdo bônus só em PT/EN fora do rodízio de idioma,
isso é uma exceção explícita a decidir com ele, não uma escolha silenciosa desta sessão.

Não escolhido por decisão técnica automática: nada. **A curadoria de QUAIS cenas entram é do
Carlos** — a Fase 3 propõe uma lista com folha de contato (§4), ele aprova antes de qualquer
cartão ir para produção, como o plano original já previa.

## 4. Curadoria — método

`tools/acervo-folhas.mjs` já existe e monta folhas de contato de 24 miniaturas, com um quadro
extraído a 40% da duração para vídeo. Reusar, não reescrever: `node tools/acervo-folhas.mjs
<manifesto> <dir-saída> [colunas] [linhas]`.

Não abrir vídeo por vídeo. Ler 37 vídeos um a um custaria ~52k tokens por clipe assistido
quadro a quadro; a folha de contato tira essa conta pela raiz, ao custo de amostrar um quadro
só — o mesmo motivo que já vale para foto (Fase 0, §2.11 do plano).

## 5. `tools/video-web.mjs` — o que a ferramenta faz

- Lê um manifesto (`caminho \t corte-em-segundos \t duração`, uma linha por clipe).
- Para cada linha: transcodifica com a receita de §1 (`crop` opcional para 9:16), grava em
  `public/video/`.
- Gera o cartaz: reusa a lógica de `acervo-folhas.mjs` (`ffmpeg -ss <40% da duração>`), mas
  aqui como arquivo próprio via `astro:assets`, não como miniatura de folha.
- Registra peso e duração de cada clipe gerado, para a legenda do Padrão 1 (o Padrão 2 não
  lê isso, por §2).
- Nunca amplia. Se a origem for menor que 720p, sai do tamanho da origem — a mesma regra que
  já vale para foto (`PRODUCT.md`, "Procedência da fotografia").

## 6. A primeira curadoria — cinco aprovados

Folha de contato gerada sobre os 32 clipes horizontais sem legenda (`Capas - Home LP/`, raiz
e `Seleção/`). Seis propostos, **cinco aprovados pelo Carlos em 22/08/2026** — o sexto
(`reel-oficina`) saiu de lado e foi retirado (§6.1). Os cinco já transcodificados com
`tools/video-web.mjs`, em `public/video/reels/`, cartaz em `src/assets/imgs/`:

| Cartão | Origem | Duração | Peso | O que mostra |
|---|---|---|---|---|
| `reel-canoa-igapo` | `Seleção/lago azul_canoagem(1).MP4` | 4 s | 0,27 MB | Proa da canoa deslizando por reflexo de igapó — a cena de "canoa entre as copas" da cheia. Sem gente. |
| `reel-tecelagem` | `Palha de tucumã.MP4` | 6 s | 0,26 MB | Mãos trançando fibra de palha. Só as mãos. |
| `reel-urucum` | `Seleção/Urucum_tingimento de palha.MP4` | 6 s | 0,27 MB | Mão de luva extraindo o corante da semente de urucum. |
| `reel-meliponario` | `Seleção/Meliponário (mel de abelha).MP4` | 4 s | 0,07 MB | Abelhas na entrada do meliponário, close. |
| `reel-piracaia` | `Seleção/Piracaia.MP4` | 4 s | 0,07 MB | Lanterna de papel com a chama, à noite — exceção nominal da piracaia. |

**Total dos cinco: 0,88 MB.** Contra 1 clipe só (3,1 MB) hoje no ar — porque nenhum destes
precisou do crf mínimo do drone: são detalhe e mão, não copa de árvore em movimento (a
foliagem é o assunto mais caro para o codec, §1). Confirma que o "cartão de loop mudo" do
Padrão 2 é estruturalmente mais barato que o "clipe ambiente" do Padrão 1, cartão por cartão —
o custo real da coluna está na quantidade de cartões simultâneos, não no peso de cada um, e é
por isso que a janela do §2 (Padrão 2) não é opcional.

### 6.1 `reel-oficina` — retirado, câmera girada na filmagem

O Carlos assistiu aos seis e devolveu: só este saiu de lado. Verificado depois
por `ffprobe -show_entries stream_side_data`: **não há bandeira de rotação no contêiner** —
`Oficina de artesanato.MP4` é 1920×1080 sem matriz de exibição, igual aos outros cinco. Não é
metadado que o `tools/video-web.mjs` deixou de ler. É a câmera que foi segurada de lado na
hora de filmar, sem ninguém corrigir isso depois — o quadro em si é paisagem com o conteúdo
girado 90°, e nada no arquivo avisa disso.

**A lição é de curadoria, não de ferramenta.** A folha de contato (§4) mostra o assunto; não
mostra sozinha se o horizonte está deitado. Eu precisava ter checado orientação, não só cena,
ao revisar o quadro amostrado — o quadro de `v-oficina.jpg` já vinha de lado na minha própria
checagem manual, e eu li o conteúdo mentalmente rotacionado em vez de marcar o clipe como
suspeito. Não corrigido nesta rodada por pedido do Carlos ("retirar"), mas fica registrado:
se algum clipe futuro vier girado assim, a saída é um `transpose=1` (ou `2`, dependendo do
sentido) explícito no filtro antes do `crop` — não há bandeira para detectar automaticamente,
então isso é decisão de quem revisa a folha, sempre.

### Achado da curadoria: um clipe descartado por marca concorrente

`Seleção/canoagem no igapó (floresta).MP4` — o clipe cujo NOME é exatamente "canoa entre as
copas", o mais óbvio candidato para essa cena — foi **descartado**. O barqueiro em quadro
veste uma camisa com "POUSADA ENCONTRO DO ARAPIUNS" legível, do início ao fim dos 13,9 s. É
uniforme de outra pousada, não da Villa. Usá-lo publicaria propaganda de um concorrente no
próprio site. Nenhum recorte 9:16 do clipe evita a camisa — ela ocupa o centro do quadro na
distância focal em que foi filmado. `reel-canoa-igapo` (de outra fonte, sem gente) cobre a
mesma cena sem esse risco.

## 6.2 `ColunaDeReels.astro` — o componente de produção, e o orçamento de JS

Construído na Fase 4. Recebe uma lista de fotos e/ou vídeos, monta a tira 9:16 com
`scroll-snap` nativo, e liga o Padrão 2 acima. Medido no HTML construído: **312 bytes** de
script inline — o `IntersectionObserver` do §2, nada mais. Zero React, zero framer-motion.

Contra os 149 KB de framer-motion + 12 KB do `CarrosselHero` (Fase 0, §3.3) para o carrossel
horizontal de hoje, a coluna de reels custa **0,2% disso**. É a alternativa "CSS puro, zero
JS" que a Fase 0/1 pediu para avaliar de verdade em vez de descartar por conveniência — e
neste caso ela venceu sem concessão nenhuma de comportamento: arrasto, toque, teclado e
snap todos vêm do navegador.

## 7. Portão

O Carlos aprova os seis clipes de §6 e o peso de cada um antes de qualquer cartão entrar em
página de produção — a Fase 4 é que constrói o componente real que os recebe.
