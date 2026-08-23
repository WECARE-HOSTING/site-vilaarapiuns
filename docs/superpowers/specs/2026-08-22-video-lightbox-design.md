# Vídeo em destaque — lightbox para qualquer vídeo do site

Data: 2026-08-22 · branch `redesign` · status: aprovado pelo cliente, pré-implementação

## Problema

Hoje cada vídeo do site tem um comportamento de clique diferente, e nenhum deles
"amplia":

- **`CarrosselHero.tsx`** (hero da home): o cartão de vídeo é um `<button>` que só
  seleciona/centraliza o cartão (`goManual`). Não há como assistir maior.
- **`ColunaDeReels.astro`** (Home e Experiências): o `<video>` do cartão é
  `aria-hidden="true"`, sem link, sem botão — não há NENHUM jeito de interagir. O
  autoplay mudo por `IntersectionObserver` (`docs/video.md` §2) é o único
  comportamento.
- **`Home.astro`** (vídeo aéreo "Villa de Cima", Padrão 1 de `docs/video.md`): um
  `<a href={video} data-tocar>` cobre o cartaz; ao clicar, o script liga
  `controls` e dá `play()` **no próprio lugar**, do mesmo tamanho — sem ampliar, e
  sem tirar o `muted` (o vídeo já não tem áudio, então é indiferente na prática,
  mas o mecanismo não desmuta).

O cliente pediu um comportamento único: **clicar em qualquer vídeo abre ele em
destaque, maior na tela, com som se tiver.** (Conferido por `ffprobe` nos 9 clipes
publicados hoje: nenhum tem trilha de áudio — todos foram cortados com `-an` na
receita de compressão do `docs/video.md` §1. "Com som se tiver" é preparo para
clipes futuros; não muda nada audível nos clipes de hoje.)

## Mecanismo escolhido: `<dialog>` nativo, no padrão já existente do mapa

`MapaSituacao.astro` já resolve exatamente este problema para imagem: um
`<dialog>` com `showModal()`, fundo `.sobre-escuro`, transição de fade+scale via
`@starting-style`, fecha por Esc, clique fora, ou botão. A alternativa avaliada
(tela cheia nativa via `requestFullscreen()`/`webkitEnterFullscreen()`) foi
descartada pelo cliente em favor deste padrão, que já está validado em produção e
mantém o enquadramento na identidade visual do site em vez do cromo do navegador.

**Um `<dialog>` só, montado uma vez no `BaseLayout.astro`** — não um por vídeo.
Motivo: uma página como Experiências chega a ter 8 cartões de vídeo na coluna de
reels; instanciar um `<dialog><video>` por cartão multiplicaria elementos de
mídia ociosos no DOM. Qualquer gatilho de vídeo da página, não importa o
componente, abre o mesmo diálogo.

### Novo componente: `src/components/VideoLightbox.astro`

Markup (paralelo ao `<dialog>` do mapa, sem a rolagem/centralização que é
específica do mapa):

```astro
<dialog class="video-lightbox lightbox-dialogo sobre-escuro m-auto max-h-[100dvh] max-w-[100vw] bg-mar-fundo p-0 backdrop:bg-mar-fundo/90">
  <div class="relative">
    <video controls playsinline class="max-h-[100dvh] max-w-[100vw]"></video>
    <button type="button" data-fechar class="etiqueta absolute right-3 top-3 border border-sol/60 bg-mar-fundo/90 px-3 py-2 text-sol transition-colors hover:bg-sol hover:text-mar-fundo">
      {t('video.fechar')}
    </button>
  </div>
</dialog>
```

Contrato de dados — qualquer elemento clicável na página pode virar gatilho
adicionando três atributos (nomes iguais em toda a base, para que um único
listener delegado sirva a todos os componentes):

- `data-video-abrir` — marca o elemento como gatilho.
- `data-video-src` — URL do `.mp4`.
- `data-video-poster` (opcional) — URL do cartaz.
- `data-video-legenda` — texto para `aria-label` do diálogo (a legenda que já
  existe em cada componente: `item.legenda`, `ativo.assunto`, ou
  `t('home.vistaDesc')`).

Script (delegado em `document`, uma vez, cobre gatilhos de qualquer componente
Astro montado na página — inclusive os que chegam depois, como cartões fora da
janela do Padrão 2):

```js
document.addEventListener('click', (evento) => {
  const gatilho = (evento.target as HTMLElement).closest<HTMLElement>('[data-video-abrir]');
  if (!gatilho) return;
  evento.preventDefault(); // cobre o caso de gatilho ser <a href={video}>

  const video = dialogo.querySelector('video')!;
  video.src = gatilho.dataset.videoSrc!;
  video.poster = gatilho.dataset.videoPoster ?? '';
  video.muted = false;
  dialogo.setAttribute('aria-label', gatilho.dataset.videoLegenda ?? t_video_dialogo);

  // pausa só o vídeo do MESMO cartão que foi clicado — não a tira/coluna inteira
  const fundo = gatilho.closest('[data-video-contexto]')?.querySelector('video');
  fundo?.pause();

  dialogo.showModal();
  void video.play();
});

dialogo.addEventListener('close', () => {
  const video = dialogo.querySelector('video')!;
  video.pause();
  video.removeAttribute('src');
  video.load(); // solta o decodificador; sem isto o Firefox mantém o buffer do clipe fechado

  const fundo = ultimoGatilho?.closest('[data-video-contexto]')?.querySelector('video');
  void fundo?.play().catch(() => {}); // muted+loop: play() sem áudio é sempre permitido
});
```

(`ultimoGatilho` guardado numa variável de módulo no `click` acima, para o
`close` saber qual vídeo de fundo retomar — o evento `close` do `<dialog>` não
carrega o gatilho original.)

`evento.target === dialogo` no clique continua fechando por fora, igual ao mapa.

### CSS: extrair a transição do mapa para uso partilhado

`.mapa-dialogo` em `MapaSituacao.astro` hoje tem só a transição de fade+scale —
nenhuma outra regra além dela (conferido no `<style>` do componente). O bloco
inteiro migra para `global.css` como `.lightbox-dialogo`, e `MapaSituacao.astro`
troca a classe `mapa-dialogo` por `lightbox-dialogo` no `<dialog>` (sem deixar as
duas, já que não sobra nenhuma regra específica do mapa para justificar manter o
nome antigo). `VideoLightbox.astro` usa a mesma classe.

### Tradução — duas chaves novas, nas 5 línguas

Seguindo o precedente do próprio `mapa.*` (que já tem `mapa.fechar` com o mesmo
texto de `nav.close`, em vez de reaproveitar uma chave de outro contexto):

- `video.fechar` — texto do botão de fechar (PT: "Fechar").
- `video.dialogo` — `aria-label` genérico de fallback quando um gatilho não tem
  legenda própria (PT: "Vídeo ampliado") — na prática todo gatilho terá
  `data-video-legenda`, então isto é rede de segurança, não caminho principal.

`tools/i18n-parity.mjs` precisa passar com as duas chaves nas 5 línguas.

## Mudança em cada componente existente

### `Home.astro` — vídeo aéreo "Villa de Cima"

O `<figure data-vista>` perde o script próprio (`raiz.querySelectorAll('[data-tocar]')...`)
e os dois gatilhos (`<button data-tocar>` sobre o cartaz, `<a href={video}
data-tocar>` na régua) ganham os atributos `data-video-abrir`,
`data-video-src={VISTA_VIDEO}`, `data-video-poster={vistaCartaz.src}`,
`data-video-legenda={t('home.vistaDesc')}`. O `<video>` original do cartaz
**continua existindo do jeito que está** (mudo, sem controls, só cartaz) — ele
não é mais o que toca; é decoração até o clique, exatamente como hoje. O
`<figure>` ganha `data-video-contexto` para a pausa/retomada de fundo (embora
aqui não haja autoplay de fundo a pausar — o atributo fica por consistência com
os outros dois componentes, sem custo).

A âncora com `href={video}` continua funcionando sem JS: sem o listener, o clique
navega para o arquivo, igual a hoje.

### `ColunaDeReels.astro` — coluna de reels

Cada `<li class="reels-cartao">` ganha um `<a href={item.video}>` envolvendo o
`<video>` e a `<span class="etiqueta">` (hoje a legenda é irmã solta do vídeo,
fora de qualquer elemento clicável) — o link cobre o cartão inteiro e usa o
próprio texto da legenda como nome acessível, sem precisar de `aria-label`
redundante. Atributos: `data-video-abrir`, `data-video-src={item.video}`,
`data-video-poster={item.poster?.src}`, `data-video-legenda={item.legenda}`.
O `<li>` ganha `data-video-contexto`.

O `<video>` perde `aria-hidden="true"` — antes era decoração pura sem nenhum
jeito de interagir; agora é conteúdo (o `<a>` que o envolve é que carrega o
nome acessível, então o `<video>` continua sem precisar de `alt`/label próprio,
só deixa de estar escondido do teclado).

Efeito colateral bom, não pedido mas decorrente: cartões passam a ser focáveis
por teclado (o `<a>` é nativamente focável), o que hoje não existe — só a
`<ul>` inteira tem `tabindex="0"`, sem jeito de parar num cartão específico.

Itens sem vídeo (`item.imagem`) não mudam.

### `CarrosselHero.tsx` — carrossel do hero

No `onClick` do `<motion.button>` de cada cartão: quando `arrastouRef.current`
for falso (a mesma guarda que já existe), além de `goManual(i)`, se
`it.video` existir, despachar um evento customizado com os mesmos quatro dados:

```js
window.dispatchEvent(new CustomEvent('video-lightbox:abrir', {
  detail: { src: it.video, poster: it.src, legenda: it.alt },
}));
```

`VideoLightbox.astro` escuta esse evento além do clique delegado, e trata os
dois caminhos com a mesma lógica de abrir (a única diferença é que o gatilho
de dado vem de `detail`, não de `dataset`). Isso evita duplicar a lógica de
abertura, e evita que o componente React precise conhecer o `<dialog>` ou
manipular DOM fora da própria ilha.

O vídeo de fundo do cartão focado (que já tem `autoPlay` condicional) é pausado
via `ref` no mesmo handler antes de despachar o evento; ao fechar o diálogo, o
`VideoLightbox` não sabe re-tocar um vídeo React (não há `data-video-contexto`
para achar via DOM de forma confiável através de uma ilha) — então o retorno do
autoplay do cartão focado fica por conta do próprio React: como nada no estado
muda, ele não volta sozinho. **Solução:** o mesmo handler que pausou guarda a
`ref` e a retoma num `useEffect` que escuta o evento de fechamento do diálogo
(`window.addEventListener('video-lightbox:fechar', ...)`, disparado pelo script
do `VideoLightbox` no handler `close` do `<dialog>`, sempre, não só quando o
gatilho foi um `data-video-abrir` do DOM).

## Fora de escopo

- Legendas/faixa de texto dentro do vídeo ampliado — os 5 Reels institucionais já
  têm o texto queimado no pixel (`docs/video.md` §3); os demais não têm
  legenda alguma hoje, e isto não muda.
- Qualquer transcodificação nova, curadoria de cartões adicionais, ou mudança na
  janela de autoplay do Padrão 2 (`IntersectionObserver` de
  `ColunaDeReels.astro`) — este trabalho é só sobre o que acontece ao clicar.
- Vídeos ganharem trilha de áudio real — nenhum dos 9 clipes publicados tem, e
  gerar/recuperar áudio não foi pedido.
- Publicar/deploy — fica para ordem direta, como sempre.

## Verificação antes de entregar

1. `npm run build` e `npm run check` sem erro novo.
2. `node tools/i18n-parity.mjs` passa com `video.fechar` e `video.dialogo` nas
   5 línguas.
3. Clicar no vídeo aéreo (Home), num cartão da coluna de reels (Home e
   Experiências) e num cartão de vídeo do carrossel do hero: os três abrem o
   mesmo diálogo, maior, sem `muted`.
4. Fechar por Esc, por clique fora, e pelo botão — os três funcionam nos três
   pontos de entrada.
5. Depois de fechar: o cartão de reel de onde o clique saiu volta a tocar em
   loop mudo (não fica congelado); o cartão do hero focado retoma o autoplay.
6. Teclado: `Tab` alcança um cartão de reel individualmente (hoje não alcança);
   `Enter`/`Espaço` abre o diálogo; foco vai para o diálogo ao abrir e volta
   para o gatilho ao fechar.
7. Sem JavaScript (DevTools): o vídeo aéreo e os cartões da coluna de reels
   continuam abrindo o arquivo `.mp4` puro na aba (fallback de `<a href>`); o
   carrossel do hero é ilha React e já depende de JS para existir — sem
   regressão adicional.
8. `prefers-reduced-motion: reduce`: o diálogo ainda abre e fecha (é ação do
   usuário, não movimento automático), só a transição de fade/scale fica mais
   contida — mesma regra que já vale para `.mapa-dialogo`.
9. Nenhum vídeo do site tem áudio hoje (confirmado por `ffprobe`); então nenhum
   som deve ser ouvido em nenhum dos três pontos — isso é o resultado esperado,
   não um bug.
10. Nenhum `git push`, nenhum deploy. Publicar é fase separada, só com ordem
    direta.
