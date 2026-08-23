# Vídeo em destaque (lightbox) — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** clicar em qualquer vídeo do site (carrossel do hero, coluna de reels, vídeo aéreo "Villa de Cima") abre esse vídeo maior, num diálogo em destaque, sem mudo.

**Architecture:** um único `<dialog>` nativo (`VideoLightbox.astro`), montado uma vez no `BaseLayout`, com `showModal()`. Qualquer elemento da página vira gatilho ao ganhar `data-video-abrir` + `data-video-src`/`data-video-poster`/`data-video-legenda` (gatilhos em Astro, via um listener de clique delegado em `document`) ou ao disparar o evento `video-lightbox:abrir` no `window` (gatilho em React, o carrossel do hero). Reusa o padrão de diálogo já existente em `MapaSituacao.astro` (fade+scale via `@starting-style`, fundo `.sobre-escuro`).

**Tech Stack:** Astro (componentes `.astro`, scripts inline processados pelo Vite — TypeScript funciona neles), React 19 (`CarrosselHero.tsx`), Tailwind v4 (`global.css`), i18n próprio (`src/i18n/*.json` + `useTranslations`).

Este projeto **não tem um runner de teste unitário** (sem vitest/jest). A verificação de cada tarefa é: `npm run check` (type-check do Astro/TS), `npm run i18n:check` (paridade de tradução) quando relevante, e checagem manual no navegador (via `npm run dev`, e a ferramenta de browser do agente) para o comportamento interativo — não há como escrever um teste automatizado para "abre o diálogo ao clicar" neste stack hoje.

## Global Constraints

- Nenhum dos 9 clipes publicados hoje tem trilha de áudio (`ffprobe` confirmado — todos cortados com `-an`). Tirar o `muted` no diálogo é seguro; não produz som audível ainda, é preparo para clipes futuros.
- Um `<dialog>` só, montado uma vez no `BaseLayout.astro` — nunca um por vídeo/cartão.
- Contrato de atributos, igual em toda a base: `data-video-abrir` (marca o gatilho), `data-video-src`, `data-video-poster` (opcional), `data-video-legenda`, e `data-video-contexto` (no ancestral que contém o vídeo de fundo a pausar/retomar).
- Ponte para a ilha React (`CarrosselHero.tsx`): `CustomEvent('video-lightbox:abrir', { detail: { src, poster, legenda } })` para abrir; `CustomEvent('video-lightbox:fechar')` (sem detail) disparado pelo `VideoLightbox` sempre que o diálogo fecha, para o React saber retomar o autoplay do cartão focado.
- Duas chaves de tradução novas — `video.fechar`, `video.dialogo` — precisam existir nas 5 línguas (pt/en/es/de/ja). `npm run i18n:check` é o portão; ele falha (exit 1) se uma faltar.
- Fallback sem JavaScript preservado: os gatilhos que já eram `<a href={video}>` (vídeo aéreo, cartões de reel) continuam navegando para o arquivo `.mp4` puro sem JS — o listener só entra com `evento.preventDefault()`.
- Nenhum `git push` faz parte deste plano. Fica só a implementação e a verificação local, como sempre.

---

### Task 1: Preparação — CSS partilhada do diálogo e traduções novas

**Files:**
- Modify: `src/styles/global.css:207` (inserir bloco novo)
- Modify: `src/components/MapaSituacao.astro:110` e `:138-168`
- Modify: `src/i18n/pt.json`, `src/i18n/en.json`, `src/i18n/es.json`, `src/i18n/de.json`, `src/i18n/ja.json`

**Interfaces:**
- Produces: classe CSS `.lightbox-dialogo` (fade+scale de `<dialog>`, com respeito a `prefers-reduced-motion`) e as chaves de tradução `video.fechar` / `video.dialogo`, que a Task 2 consome.

- [ ] **Step 1: Mover a transição de `.mapa-dialogo` para `global.css`, renomeada**

Em `src/styles/global.css`, depois do bloco `.sobre-escuro` (fecha na linha 207, antes de `:focus-visible`), inserir:

```css

  /* ═══ DIÁLOGO EM DESTAQUE (lightbox) ═══
        Era só do mapa (`.mapa-dialogo`). O vídeo em destaque
        (`VideoLightbox.astro`, Fase 3) precisa exatamente da mesma
        transição — showModal()/close() trocam de estado sem transição
        nenhuma por padrão, e o diálogo cobriria a tela inteira sem aviso.
        Migrado para cá em vez de duplicado. */
  .lightbox-dialogo {
    opacity: 1;
    scale: 1;
    transition: opacity 250ms cubic-bezier(0.23, 1, 0.32, 1),
                scale 250ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .lightbox-dialogo::backdrop {
    transition: background-color 250ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  @starting-style {
    .lightbox-dialogo[open] {
      opacity: 0;
      scale: 0.96;
    }
    .lightbox-dialogo[open]::backdrop {
      background-color: transparent;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    /* Mais suave, não zerado: mantém o fade, tira o scale. */
    .lightbox-dialogo { transition-property: opacity; }
    @starting-style {
      .lightbox-dialogo[open] { scale: 1; }
    }
  }
```

- [ ] **Step 2: Apontar `MapaSituacao.astro` para a classe nova, e remover o bloco duplicado**

Em `src/components/MapaSituacao.astro`, trocar (linha 110):

```astro
    class="mapa-dialogo sobre-escuro m-auto max-h-[100dvh] max-w-[100vw] bg-mar-fundo p-0 backdrop:bg-mar-fundo/90"
```

por:

```astro
    class="lightbox-dialogo sobre-escuro m-auto max-h-[100dvh] max-w-[100vw] bg-mar-fundo p-0 backdrop:bg-mar-fundo/90"
```

E remover o `<style>` inteiro (linhas 138-168, o bloco que começa em `<style>` e termina em `</style>` logo depois do comentário "Fase 5: showModal()/close()...") — o conteúdo dele já foi movido no Step 1.

- [ ] **Step 3: Confirmar que não sobrou nenhuma referência a `mapa-dialogo`**

Run: `grep -rn "mapa-dialogo" src/`
Expected: nenhuma saída.

- [ ] **Step 4: Adicionar as chaves `video.fechar` e `video.dialogo` nas 5 línguas**

Em `src/i18n/pt.json`, depois do bloco `"mapa": { ... }` (identificado pela linha `"ondeI": "A Villa está no rio Arapiuns, a oeste de Alter do Chão. O último trecho é de barco porque ali não há estrada — é o que mantém o rio vazio."` seguida de `},`), inserir:

```json
  "video": {
    "fechar": "Fechar",
    "dialogo": "Vídeo ampliado"
  },
```

Em `src/i18n/en.json`, no mesmo ponto (âncora: `"ondeI": "The Villa is on the Arapiuns River, west of Alter do Chão. The last leg is by boat because there is no road — which is what keeps the river empty."`):

```json
  "video": {
    "fechar": "Close",
    "dialogo": "Video enlarged"
  },
```

Em `src/i18n/es.json` (âncora: `"ondeI": "La Villa está en el río Arapiuns, al oeste de Alter do Chão. El último tramo es en barco porque allí no hay carretera — es lo que mantiene el río vacío."`):

```json
  "video": {
    "fechar": "Cerrar",
    "dialogo": "Vídeo ampliado"
  },
```

Em `src/i18n/de.json` (âncora: `"ondeI": "Die Villa liegt am Rio Arapiuns, westlich von Alter do Chão. Die letzte Etappe führt über das Wasser, weil es dort keine Straße gibt — und genau das hält den Fluss leer."`):

```json
  "video": {
    "fechar": "Schließen",
    "dialogo": "Video vergrößert"
  },
```

Em `src/i18n/ja.json` (âncora: `"ondeI": "ヴィラはアルテル・ド・シャンの西、アラピウンス川沿いにあります。最後の区間が船なのは、そこに道路がないからです。そしてそれが、この川を静かなまま保っています。"`):

```json
  "video": {
    "fechar": "閉じる",
    "dialogo": "動画（拡大）"
  },
```

- [ ] **Step 5: Rodar a checagem de paridade**

Run: `npm run i18n:check`
Expected: `OK — 779 chaves, paridade completa em en, es, de, ja.` (777 + as 2 chaves novas)

- [ ] **Step 6: Type-check**

Run: `npm run check`
Expected: sem erro novo (o baseline já deve passar limpo).

- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css src/components/MapaSituacao.astro src/i18n/pt.json src/i18n/en.json src/i18n/es.json src/i18n/de.json src/i18n/ja.json
git commit -m "Prepara o lightbox de vídeo: CSS de diálogo partilhada com o mapa, traduções novas"
```

---

### Task 2: `VideoLightbox.astro` — o componente e o encaixe no layout

**Files:**
- Create: `src/components/VideoLightbox.astro`
- Modify: `src/layouts/BaseLayout.astro:6` (import) e `:134` (montagem)

**Interfaces:**
- Consumes: classe `.lightbox-dialogo` e chaves `video.fechar`/`video.dialogo` (Task 1); `Locale` de `@/i18n/config`, `useTranslations` de `@/i18n/utils` (padrões já usados em `MapaSituacao.astro`).
- Produces: o contrato de gatilho documentado nas Global Constraints (`data-video-abrir` + `data-video-src`/`data-video-poster`/`data-video-legenda`/`data-video-contexto`, e os eventos `video-lightbox:abrir`/`video-lightbox:fechar`), que as Tasks 3, 4 e 5 consomem.

- [ ] **Step 1: Criar o componente**

`src/components/VideoLightbox.astro`:

```astro
---
/**
 * O DIÁLOGO EM DESTAQUE — um só, montado no BaseLayout, para qualquer vídeo
 * da página. Mesmo padrão de `MapaSituacao.astro` (dialog nativo,
 * showModal/close, `.lightbox-dialogo` para a transição).
 *
 * Contrato de gatilho, para qualquer componente da base apontar aqui sem
 * conhecer este arquivo:
 *   - `data-video-abrir` no elemento clicável (um <a href={video}> continua
 *     navegando para o arquivo sem JavaScript — o listener só entra com
 *     `preventDefault()`).
 *   - `data-video-src` / `data-video-poster` / `data-video-legenda`.
 *   - `data-video-contexto` no ancestral que tem o `<video>` de fundo a
 *     pausar ao abrir e retomar ao fechar (loop mudo de cartão, p.ex.).
 * A ilha React do carrossel do hero não tem como usar atributos DOM antes
 * de despachar o clique, então fala por evento:
 *   - `window.dispatchEvent(new CustomEvent('video-lightbox:abrir', {
 *       detail: { src, poster, legenda } }))`.
 * Ao fechar (Esc, clique fora, botão), este componente sempre despacha
 * `video-lightbox:fechar` (sem detail) — é assim que o CarrosselHero sabe
 * retomar o autoplay do cartão focado, que nenhum estado de React muda
 * sozinho ao pausar.
 */
import { useTranslations } from '@/i18n/utils';
import type { Locale } from '@/i18n/config';

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const t = useTranslations(locale);
---

<dialog
  class="video-lightbox lightbox-dialogo sobre-escuro m-auto max-h-[100dvh] max-w-[100vw] bg-mar-fundo p-0 backdrop:bg-mar-fundo/90"
  aria-label={t('video.dialogo')}
>
  <div class="relative">
    <video controls playsinline class="block max-h-[100dvh] max-w-[100vw]"></video>

    <button
      type="button"
      data-fechar
      class="etiqueta absolute right-3 top-3 border border-sol/60 bg-mar-fundo/90 px-3 py-2 text-sol transition-colors hover:bg-sol hover:text-mar-fundo"
    >
      {t('video.fechar')}
    </button>
  </div>
</dialog>

<script>
  const dialogo = document.querySelector<HTMLDialogElement>('.video-lightbox');
  const video = dialogo?.querySelector('video');

  if (dialogo && video) {
    // O vídeo de fundo (cartão de reel, cartão do hero) que este clique
    // pausou — para saber qual retomar quando o diálogo fechar.
    let fundoAtual: HTMLVideoElement | null = null;

    // `aria-label` genérico do markup (`t('video.dialogo')`) — capturado uma
    // vez, para restaurar quando um gatilho não tiver legenda própria. Sem
    // isto, um gatilho sem legenda herdaria a legenda do vídeo aberto antes
    // dele, em vez de cair no rótulo genérico.
    const legendaPadrao = dialogo.getAttribute('aria-label') ?? '';

    const abrir = (src: string, poster: string, legenda: string, fundo: HTMLVideoElement | null) => {
      fundo?.pause();
      fundoAtual = fundo;
      video.src = src;
      video.poster = poster;
      video.muted = false;
      dialogo.setAttribute('aria-label', legenda || legendaPadrao);
      dialogo.showModal();
      void video.play();
    };

    // Gatilhos em Astro/DOM: qualquer clique em [data-video-abrir], em
    // qualquer componente da página — delegado, então cobre inclusive
    // cartões montados depois deste script rodar.
    document.addEventListener('click', (evento) => {
      const alvo = evento.target as HTMLElement;
      const gatilho = alvo.closest<HTMLElement>('[data-video-abrir]');
      if (!gatilho) return;
      evento.preventDefault(); // cobre o gatilho ser <a href={video}>
      const fundo = gatilho.closest<HTMLElement>('[data-video-contexto]')?.querySelector('video') ?? null;
      abrir(
        gatilho.dataset.videoSrc ?? '',
        gatilho.dataset.videoPoster ?? '',
        gatilho.dataset.videoLegenda ?? '',
        fundo,
      );
    });

    // Gatilho da ilha React (CarrosselHero): mesmo contrato, via evento.
    window.addEventListener('video-lightbox:abrir', (evento) => {
      const { src, poster, legenda } = (evento as CustomEvent<{ src: string; poster: string; legenda: string }>).detail;
      abrir(src, poster, legenda, null);
    });

    dialogo.addEventListener('close', () => {
      video.pause();
      video.removeAttribute('src');
      video.load(); // solta o decodificador — sem isto o buffer do clipe fechado fica na memória
      void fundoAtual?.play().catch(() => {}); // muted+loop: play() sem áudio é sempre permitido
      fundoAtual = null;
      window.dispatchEvent(new CustomEvent('video-lightbox:fechar'));
    });

    // Clique fora do vídeo (na margem do <dialog>) fecha — mesmo padrão do mapa.
    dialogo.addEventListener('click', (evento) => {
      if (evento.target === dialogo) dialogo.close();
    });

    dialogo.querySelector('[data-fechar]')?.addEventListener('click', () => dialogo.close());
  }
</script>
```

- [ ] **Step 2: Montar no `BaseLayout.astro`**

Adicionar o import (depois de `import { SITE } from '@/data/site';`, linha 6):

```astro
import VideoLightbox from '@/components/VideoLightbox.astro';
```

E montar antes de `</body>` (depois de `<slot name="footer" />`, linha 134):

```astro
    <slot name="footer" />

    <VideoLightbox locale={locale} />
  </body>
```

- [ ] **Step 3: Type-check**

Run: `npm run check`
Expected: sem erro novo.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build conclui sem erro; `dist/pt/index.html` (ou qualquer página) contém `class="video-lightbox`.

Run: `grep -c "video-lightbox" dist/pt/index.html`
Expected: número maior que 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/VideoLightbox.astro src/layouts/BaseLayout.astro
git commit -m "Cria o VideoLightbox e monta uma instância só no BaseLayout"
```

---

### Task 3: Vídeo aéreo da Home — vira gatilho do lightbox

**Files:**
- Modify: `src/content-pages/Home.astro:666-735`

**Interfaces:**
- Consumes: contrato de gatilho da Task 2 (`data-video-abrir`, `data-video-src`, `data-video-poster`, `data-video-legenda`, `data-video-contexto`).

- [ ] **Step 1: Trocar `data-vista`/`data-tocar` pelo contrato do lightbox, e remover o script local**

Em `src/content-pages/Home.astro`, trocar o bloco (linhas 666-735):

```astro
    <figure class="sobre-escuro mt-16 bg-mar-fundo p-3 sm:p-4" data-vista>
      <div class="relative">
        <video
          src={VISTA_VIDEO}
          poster={vistaCartaz.src}
          preload="none"
          playsinline
          muted
          aria-label={t('home.vistaDesc')}
          class="aspect-video w-full bg-mar-fundo"
        ></video>

        <button
          type="button"
          data-tocar
          tabindex="-1"
          aria-hidden="true"
          class="absolute inset-0 cursor-pointer"
        ></button>
      </div>

      <figcaption class="emenda mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t pt-3 sm:mt-4 sm:pt-4">
        <p class="numero etiqueta flex flex-wrap items-center gap-x-3 gap-y-1">
          {t('home.vistaLegenda')}
          <Voluta class="text-sol" />
          {vistaMedida}
        </p>

        <a
          href={VISTA_VIDEO}
          data-tocar
          class="etiqueta emenda flex items-center gap-2 border px-3 py-2 transition-colors hover:bg-sol hover:text-mar-fundo"
        >
          <!-- O octógono da marchetaria com o glifo de play dentro: a forma
               reservada do sistema, no único lugar da página onde ela vira
               comando. Não é ícone de biblioteca. -->
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="h-3.5 w-3.5 shrink-0">
            <path d="M5.2 1h5.6L15 5.2v5.6L10.8 15H5.2L1 10.8V5.2L5.2 1z"
                  stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
            <path d="M6.7 5.3 11 8l-4.3 2.7V5.3z" fill="currentColor" />
          </svg>
          {t('home.vistaControle')}
        </a>
      </figcaption>
    </figure>

    <a href={href(locale, 'gettingHere')} class="link-texto etiqueta mt-8 inline-block">
      {t('nav.gettingHere')}
    </a>
  </div>
</section>

<script>
  /* O play, e o momento em que a barra do navegador passa a ser bem-vinda.
     Sem JavaScript o link da régua leva ao arquivo e o navegador toca lá —
     nada aqui é obrigatório para o vídeo existir. */
  document.querySelectorAll<HTMLElement>('[data-vista]').forEach((raiz) => {
    const video = raiz.querySelector('video');
    if (!video) return;
    raiz.querySelectorAll('[data-tocar]').forEach((gatilho) =>
      gatilho.addEventListener('click', (evento) => {
        evento.preventDefault();
        // A barra só existe a partir daqui: já não há cartaz para proteger, e
        // sem ela ninguém pausa, volta nem sai de tela cheia.
        video.controls = true;
        void video.play();
      }),
    );
  });
</script>
```

por:

```astro
    <figure class="sobre-escuro mt-16 bg-mar-fundo p-3 sm:p-4" data-video-contexto>
      <div class="relative">
        <video
          src={VISTA_VIDEO}
          poster={vistaCartaz.src}
          preload="none"
          playsinline
          muted
          aria-label={t('home.vistaDesc')}
          class="aspect-video w-full bg-mar-fundo"
        ></video>

        <button
          type="button"
          data-video-abrir
          data-video-src={VISTA_VIDEO}
          data-video-poster={vistaCartaz.src}
          data-video-legenda={t('home.vistaDesc')}
          tabindex="-1"
          aria-hidden="true"
          class="absolute inset-0 cursor-pointer"
        ></button>
      </div>

      <figcaption class="emenda mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t pt-3 sm:mt-4 sm:pt-4">
        <p class="numero etiqueta flex flex-wrap items-center gap-x-3 gap-y-1">
          {t('home.vistaLegenda')}
          <Voluta class="text-sol" />
          {vistaMedida}
        </p>

        <a
          href={VISTA_VIDEO}
          data-video-abrir
          data-video-src={VISTA_VIDEO}
          data-video-poster={vistaCartaz.src}
          data-video-legenda={t('home.vistaDesc')}
          class="etiqueta emenda flex items-center gap-2 border px-3 py-2 transition-colors hover:bg-sol hover:text-mar-fundo"
        >
          <!-- O octógono da marchetaria com o glifo de play dentro: a forma
               reservada do sistema, no único lugar da página onde ela vira
               comando. Não é ícone de biblioteca. -->
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="h-3.5 w-3.5 shrink-0">
            <path d="M5.2 1h5.6L15 5.2v5.6L10.8 15H5.2L1 10.8V5.2L5.2 1z"
                  stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
            <path d="M6.7 5.3 11 8l-4.3 2.7V5.3z" fill="currentColor" />
          </svg>
          {t('home.vistaControle')}
        </a>
      </figcaption>
    </figure>

    <a href={href(locale, 'gettingHere')} class="link-texto etiqueta mt-8 inline-block">
      {t('nav.gettingHere')}
    </a>
  </div>
</section>
```

(O `<script>` inteiro sai — o `VideoLightbox.astro` da Task 2 já cobre o clique, delegado.)

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: sem erro novo.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: sem erro.

- [ ] **Step 4: Commit**

```bash
git add src/content-pages/Home.astro
git commit -m "Vídeo aéreo da Home abre no lightbox em vez de tocar no próprio lugar"
```

---

### Task 4: Coluna de reels — cada cartão de vídeo vira gatilho

**Files:**
- Modify: `src/components/ColunaDeReels.astro:42-72`

**Interfaces:**
- Consumes: contrato de gatilho da Task 2.

- [ ] **Step 1: Envolver o vídeo (e a legenda) de cada cartão num `<a>` gatilho**

Em `src/components/ColunaDeReels.astro`, trocar (linhas 42-72):

```astro
<ul class="reels-tira flex gap-4 overflow-x-auto pb-4 [scrollbar-color:var(--color-areia-sol)_var(--color-areia-clara)]"
    tabindex="0" aria-label={rotulo}>
  {itens.map((item) => (
    <li class="reels-cartao relative aspect-[9/16] w-[min(72vw,19rem)] shrink-0 snap-start list-none overflow-hidden bg-mar-fundo">
      {item.video ? (
        <video
          src={item.video}
          poster={item.poster?.src}
          muted
          loop
          playsinline
          preload="none"
          aria-hidden="true"
          class="absolute inset-0 h-full w-full object-cover"
        ></video>
      ) : item.imagem ? (
        <Image
          src={item.imagem}
          alt={item.alt ?? ''}
          widths={LARGURAS_CARD}
          sizes="19rem"
          loading="lazy"
          class="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <span class="etiqueta absolute inset-x-3 bottom-3 text-areia-clara [text-shadow:0_1px_6px_rgb(0_0_0/0.55)]">
        {item.legenda}
      </span>
    </li>
  ))}
</ul>
```

por:

```astro
<ul class="reels-tira flex gap-4 overflow-x-auto pb-4 [scrollbar-color:var(--color-areia-sol)_var(--color-areia-clara)]"
    tabindex="0" aria-label={rotulo}>
  {itens.map((item) => (
    <li class="reels-cartao relative aspect-[9/16] w-[min(72vw,19rem)] shrink-0 snap-start list-none overflow-hidden bg-mar-fundo" data-video-contexto>
      {item.video ? (
        <a
          href={item.video}
          data-video-abrir
          data-video-src={item.video}
          data-video-poster={item.poster?.src}
          data-video-legenda={item.legenda}
          class="absolute inset-0"
        >
          <video
            src={item.video}
            poster={item.poster?.src}
            muted
            loop
            playsinline
            preload="none"
            class="absolute inset-0 h-full w-full object-cover"
          ></video>
          <span class="etiqueta absolute inset-x-3 bottom-3 text-areia-clara [text-shadow:0_1px_6px_rgb(0_0_0/0.55)]">
            {item.legenda}
          </span>
        </a>
      ) : item.imagem ? (
        <>
          <Image
            src={item.imagem}
            alt={item.alt ?? ''}
            widths={LARGURAS_CARD}
            sizes="19rem"
            loading="lazy"
            class="absolute inset-0 h-full w-full object-cover"
          />
          <span class="etiqueta absolute inset-x-3 bottom-3 text-areia-clara [text-shadow:0_1px_6px_rgb(0_0_0/0.55)]">
            {item.legenda}
          </span>
        </>
      ) : null}
    </li>
  ))}
</ul>
```

Note: o `<video>` perde `aria-hidden="true"` — antes não havia jeito nenhum de interagir com o cartão (decoração pura); agora o `<a>` que o envolve é que carrega o nome acessível (o texto da própria legenda), e o cartão passa a ser focável por teclado de propósito (o `<a>` é nativamente focável — hoje só a `<ul>` inteira tem `tabindex="0"`, sem parar num cartão específico).

O `<script>` de autoplay no fim do arquivo (IntersectionObserver sobre `.reels-cartao video`) **não muda** — o seletor continua encontrando o `<video>`, só que um nível mais fundo (dentro do `<a>` em vez de direto no `<li>`).

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: sem erro novo.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: sem erro.

- [ ] **Step 4: Commit**

```bash
git add src/components/ColunaDeReels.astro
git commit -m "Cartões de vídeo da coluna de reels abrem no lightbox e viram focáveis por teclado"
```

---

### Task 5: Carrossel do hero — clique num cartão de vídeo já abre

**Files:**
- Modify: `src/components/CarrosselHero.tsx:193-194`, `:387-391`, `:533-556`

**Interfaces:**
- Consumes: evento `video-lightbox:abrir` (dispara) e `video-lightbox:fechar` (escuta), da Task 2.

- [ ] **Step 1: Guardar uma ref para o `<video>` ativo**

Em `src/components/CarrosselHero.tsx`, trocar (linhas 193-194):

```tsx
  const arrastouRef = React.useRef(false);
  const reduced = useReducedMotion();
```

por:

```tsx
  const arrastouRef = React.useRef(false);
  /** O `<video>` do cartão ativo (focado, cópia do meio) — o único que autoplaya por vez. */
  const activeVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion();
```

- [ ] **Step 2: Retomar o autoplay do cartão focado quando o lightbox fechar**

Depois do efeito de autoplay (linhas 387-391):

```tsx
  React.useEffect(() => {
    if (!autoplay || reduced || paused || dragging || !medido || items.length < 2) return;
    const id = window.setTimeout(() => go((index + 1) % items.length), autoplayDelay);
    return () => window.clearTimeout(id);
  }, [autoplay, autoplayDelay, dragging, go, index, items.length, medido, paused, reduced]);
```

acrescentar:

```tsx

  /**
   * Retoma o autoplay mudo do cartão focado quando o VideoLightbox fecha.
   * Só o script do lightbox pausou (`activeVideoRef.current?.pause()` no
   * onClick abaixo); como nenhum estado do React muda ao pausar, ele não
   * voltaria a tocar sozinho.
   */
  React.useEffect(() => {
    const retomar = () => { void activeVideoRef.current?.play().catch(() => {}); };
    window.addEventListener('video-lightbox:fechar', retomar);
    return () => window.removeEventListener('video-lightbox:fechar', retomar);
  }, []);
```

- [ ] **Step 3: Abrir o lightbox ao clicar num cartão de vídeo, focado ou não**

Trocar (linhas 533-556):

```tsx
                onClick={() => {
                  if (arrastouRef.current) return;
                  goManual(i);
                }}
                className="relative shrink-0 overflow-hidden rounded-none bg-areia"
                style={{ width: strip.larguras[i] }}
                animate={{ height: i === index ? fullH : halfH }}
                transition={spring}
              >
                {/* Fora da janela o card fica sendo só o seu retângulo em
                    `bg-mar`. Ele já tem a largura certa, então entrar na
                    janela não mexe no layout — só preenche. */}
                {!naJanela(j) ? null : it.video ? (
                  <video
                    src={it.video}
                    poster={it.src}
                    muted
                    loop
                    playsInline
                    preload="none"
                    autoPlay={cyc === 1 && i === index && !reduced}
                    className="h-full w-full object-cover"
                  />
                ) : (
```

por:

```tsx
                onClick={() => {
                  if (arrastouRef.current) return;
                  goManual(i);
                  if (it.video) {
                    activeVideoRef.current?.pause();
                    window.dispatchEvent(new CustomEvent('video-lightbox:abrir', {
                      detail: { src: it.video, poster: it.src, legenda: it.alt },
                    }));
                  }
                }}
                className="relative shrink-0 overflow-hidden rounded-none bg-areia"
                style={{ width: strip.larguras[i] }}
                animate={{ height: i === index ? fullH : halfH }}
                transition={spring}
              >
                {/* Fora da janela o card fica sendo só o seu retângulo em
                    `bg-mar`. Ele já tem a largura certa, então entrar na
                    janela não mexe no layout — só preenche. */}
                {!naJanela(j) ? null : it.video ? (
                  <video
                    ref={cyc === 1 && i === index ? activeVideoRef : undefined}
                    src={it.video}
                    poster={it.src}
                    muted
                    loop
                    playsInline
                    preload="none"
                    autoPlay={cyc === 1 && i === index && !reduced}
                    className="h-full w-full object-cover"
                  />
                ) : (
```

(Como você decidiu: um clique num cartão de vídeo — focado ou não — seleciona **e** já abre o lightbox. Cartões de foto continuam só selecionando, sem mudança nenhuma aqui.)

- [ ] **Step 4: Type-check**

Run: `npm run check`
Expected: sem erro novo (confirma que `activeVideoRef` e o `ref` condicional tipam certo).

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: sem erro.

- [ ] **Step 6: Commit**

```bash
git add src/components/CarrosselHero.tsx
git commit -m "Clicar num cartão de vídeo do carrossel do hero já abre o lightbox"
```

---

### Task 6: Verificação de ponta a ponta, no navegador

Não há teste automatizado para comportamento interativo neste projeto — esta tarefa É a verificação, com o dev server rodando e um navegador de verdade.

**Files:** nenhum (só verificação; qualquer defeito encontrado volta para a task correspondente, corrige, e commita ali).

- [ ] **Step 1: Rodar a suíte de checagem completa**

```bash
npm run i18n:check
npm run check
npm run build
```

Expected: os três passam sem erro.

- [ ] **Step 2: Subir o dev server**

```bash
npm run dev
```

Expected: serve em `http://localhost:4321` (ou porta que o Astro escolher).

- [ ] **Step 3: Vídeo aéreo (Home, `/pt/`) — abrir e fechar pelos três jeitos**

No navegador: abrir `/pt/`, rolar até "A Villa de cima". Clicar no cartaz (overlay grande) → o diálogo abre com o vídeo maior, com `controls` visíveis e sem `muted`. Fechar por Esc; reabrir clicando em "Ver o vídeo" (o link da legenda) → abre de novo; fechar clicando fora do vídeo (na margem escura); reabrir e fechar pelo botão "Fechar".

Expected: as três formas de fechar funcionam, e os dois gatilhos (cartaz e link da legenda) abrem o mesmo diálogo.

- [ ] **Step 4: Coluna de reels (Home e `/pt/experiencias/`) — pausa e retomada do cartão**

Clicar num cartão de vídeo da coluna (ex.: "Canoa no igapó"). Confirmar: o diálogo abre com esse vídeo maior e sem som cortado (ainda que não haja áudio real, `controls` deve aparecer, sem erro no console). Fechar. Confirmar que o cartão de origem **volta a tocar em loop mudo** (não fica congelado no primeiro quadro).

Expected: abre, fecha, retoma. Repetir em `/pt/experiencias/` (coluna maior, 8 cartões).

- [ ] **Step 5: Carrossel do hero (Home) — clique focado e não-focado**

Clicar num cartão de vídeo do carrossel que **não** está focado no momento (um dos vizinhos cortados pela metade). Confirmar: o carrossel centraliza esse cartão **e** o diálogo abre imediatamente (não precisa de um segundo clique). Fechar o diálogo. Confirmar que o cartão agora focado volta a tocar mudo em loop.

Expected: um clique já abre, focado ou não; fechar retoma o autoplay do cartão que ficou focado.

- [ ] **Step 6: Teclado**

Na coluna de reels, pressionar Tab repetidamente a partir do início da página. Confirmar que o foco agora **para em cada cartão individualmente** (antes só a `<ul>` inteira era alcançável). Com um cartão de vídeo focado, pressionar Enter → o lightbox abre. Com o lightbox aberto, confirmar que o foco está dentro dele (não voltou à página) e que Tab não escapa para o conteúdo por trás. Fechar com Esc e confirmar que o foco volta para o cartão que abriu o diálogo.

Expected: navegação por teclado alcança cartões individuais (regressão corrigida) e o diálogo se comporta como modal de foco.

- [ ] **Step 7: `prefers-reduced-motion: reduce`**

Nas DevTools, emular `prefers-reduced-motion: reduce` (Rendering tab → Emulate CSS media feature). Repetir a abertura de qualquer um dos três vídeos.

Expected: o diálogo ainda abre e fecha normalmente (é ação do usuário) — só a transição de escala fica suprimida, mantendo o fade, igual ao que já vale para `.mapa-dialogo` hoje.

- [ ] **Step 8: Sem JavaScript**

Nas DevTools, desabilitar JavaScript e recarregar `/pt/`. Clicar no cartaz do vídeo aéreo e no link "Ver o vídeo" → confirmar que o navegador navega para o arquivo `.mp4` puro (o fallback de `<a href>`), não para uma página quebrada. Repetir com um cartão de vídeo da coluna de reels.

Expected: sem JS, os dois pontos que já eram `<a href={video}>` continuam funcionando como link puro para o arquivo. (O carrossel do hero é ilha React e já depende de JS para existir — sem regressão adicional, nenhum cartão dele renderiza sem JS, igual a hoje.)

- [ ] **Step 9: Regressão do mapa**

Em `/pt/como-chegar/` (ou onde `MapaSituacao` aparecer), numa viewport estreita (< 1024px), clicar em "Ampliar o mapa". Confirmar que o diálogo do mapa ainda abre com a mesma transição de fade+scale de antes (a Task 1 só renomeou a classe CSS, não deveria mudar nada visível).

Expected: sem regressão — mapa abre e fecha exatamente como antes desta mudança.

- [ ] **Step 10: Reportar, sem publicar**

Nenhum `git push`. Se algum passo acima falhar, corrigir na task correspondente, rodar `npm run check` de novo, e commitar a correção ali antes de seguir. Reportar ao Carlos que a implementação está pronta e testada localmente, aguardando ordem para deploy.
