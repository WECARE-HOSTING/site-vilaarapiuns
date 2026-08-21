# Contato comercial único + formulário de reserva — Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Goal:** Trocar o contato comercial do site por um canal único (Gabriela) e dar à página Reservar um formulário que envia o pedido por e-mail, sem sair da hospedagem estática.

**Architecture:** O contato é um dado em `src/data/site.ts` — trocá-lo propaga sozinho para os 7 CTAs, o rodapé e o JSON-LD, porque tudo já lê de lá. O formulário é um `<form>` nativo que dá POST em `dist/enviar.php`, um endpoint PHP que sobe com o site no cPanel, valida, e envia por SMTP autenticado. JS é só melhoria progressiva. As credenciais moram fora do webroot e fora do repositório.

**Tech Stack:** Astro 7 (saída estática), Tailwind 4, TypeScript, PHP 8 + PHPMailer no servidor, Node para os verificadores em `tools/`.

**Spec:** `docs/superpowers/specs/2026-08-21-contato-comercial-formulario-design.md`

## Global Constraints

- **Contato único:** WhatsApp `5547992067078`, e-mail `gabriela@wecarehosting.com.br`. O número `5511969760096` sai do site inteiro.
- **Remetente SMTP:** `site@vilaarapiuns.com.br`. **BCC:** `carlos@wecarehosting.com.br`. **Prazo prometido:** 24 horas.
- **O repositório é público.** Nenhuma senha, em nenhum arquivo versionado, em nenhuma circunstância. Conferir `git diff` antes de todo commit.
- **Nada de push, nada de deploy.** Publicar é fase separada e só com ordem direta do Carlos. Todos os commits ficam locais, no branch `redesign`.
- **Copy impessoal.** O site não nomeia quem atende. Nunca escrever "Gabriela" em texto visível.
- **Toda chave de `pt.json` entra nos cinco dicionários na mesma tarefa.** Alemão e espanhol no tratamento formal já estabelecido ("Sie", "usted").
- **Sem React.** O projeto mantém uma island só (`CarrosselHero.tsx`), de propósito. O JS do formulário é `<script>` inline.
- **Não inventar fato.** Nada de prazo, nota, ano ou depoimento que o Carlos não confirmou.
- **PHP 8.1 ou maior**, com `mbstring`. O endpoint usa `str_contains` (8.0), tipo de retorno `never` (8.1) e `mb_strlen`. Conferir a versão do PHP no cPanel antes do deploy.
- Gate de tipo em toda tarefa que toca `.astro`/`.ts`: `npm run check` sem erro.

## Pré-requisito de máquina

`php` não está instalado (o macOS parou de embarcar). Antes da Tarefa 5:

```bash
brew install php && php -v   # espera-se PHP 8.x
```

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `tools/i18n-parity.mjs` | **Criar.** Toda chave de `pt.json` existe nos outros quatro |
| `tools/contato-unico.mjs` | **Criar.** O número antigo não reaparece no `dist`; o novo está lá; segredo não vazou |
| `tools/testa-endpoint.mjs` | **Criar.** Suíte HTTP contra `enviar.php` em `dryRun` |
| `src/data/site.ts` | **Modificar.** Contato novo + `telefoneLegivel()` |
| `src/i18n/{pt,en,es,de,ja}.json` | **Modificar.** Copy da Reservar corrigida + blocos `form` e `enviado` |
| `src/i18n/routes.ts` | **Modificar.** Chave `bookSent` + `NOINDEX_KEYS` |
| `src/layouts/BaseLayout.astro` | **Modificar.** Prop `robots` |
| `src/content-pages/PageRenderer.astro` | **Modificar.** Despacho de `bookSent` |
| `src/content-pages/Enviado.astro` | **Criar.** Página de confirmação (caminho sem JS) |
| `src/components/FormularioReserva.astro` | **Criar.** O formulário. Único arquivo com o JS de melhoria |
| `src/content-pages/Reservar.astro` | **Modificar.** Recebe o formulário; cabeçalho reescrito |
| `astro.config.mjs` | **Modificar.** Filtro do sitemap deriva de `NOINDEX_KEYS` |
| `public/enviar.php` | **Criar.** Endpoint: defesas, validação, montagem e envio |
| `public/va-config.example.php` | **Criar.** Chaves sem valores, para o servidor |
| `package.json` | **Modificar.** Scripts `i18n:check`, `contato:check`, `form:check` |

---

### Task 1: Verificador de paridade de dicionário

O comentário em `src/i18n/config.ts` promete este script desde a Fase 6 — *"só entra aqui quando `npm run i18n:check` acusar zero chave faltando contra o pt"* — e ele nunca existiu. Ele vem primeiro porque as tarefas 3, 4 e 6 adicionam ~40 chaves em cinco idiomas, e conferir 591 chaves a olho não é processo, é esperança.

**Files:**
- Create: `tools/i18n-parity.mjs`
- Modify: `package.json` (bloco `scripts`)

**Interfaces:**
- Consumes: nada.
- Produces: `npm run i18n:check` — sai `0` com paridade completa, `1` listando cada chave faltante. Usado como gate nas tarefas 3, 4, 6 e 9.

- [ ] **Step 1: Escrever o verificador**

Criar `tools/i18n-parity.mjs`:

```js
/**
 * Paridade de dicionário: toda chave de pt.json existe em en/es/de/ja.
 *
 * Prometido pelo comentário de READY_LOCALES em src/i18n/config.ts desde a
 * Fase 6 e nunca escrito. Sem ele, "o dicionário está completo" é opinião —
 * e a Fase 6 já mostrou o custo: quatro idiomas foram ao ar renderizando
 * português com <html lang> errado porque ninguém tinha como conferir.
 *
 * Array conta como UMA chave, mas comprimento diferente é erro: useList()
 * devolve a lista inteira, então lista curta é conteúdo faltando.
 *
 *   npm run i18n:check
 */
import { readFileSync } from 'node:fs';

const BASE = 'pt';
const OUTROS = ['en', 'es', 'de', 'ja'];

const carrega = (l) => JSON.parse(readFileSync(`src/i18n/${l}.json`, 'utf8'));

/** Achata {a:{b:'x'}} em ['a.b']. */
function achata(obj, prefixo = '', saida = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const caminho = prefixo ? `${prefixo}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) achata(v, caminho, saida);
    else saida.set(caminho, Array.isArray(v) ? v.length : null);
  }
  return saida;
}

const base = achata(carrega(BASE));
let falhou = false;

for (const l of OUTROS) {
  const dele = achata(carrega(l));
  const faltando = [...base.keys()].filter((k) => !dele.has(k));
  const sobrando = [...dele.keys()].filter((k) => !base.has(k));
  const listaCurta = [...base.entries()].filter(
    ([k, n]) => n !== null && dele.has(k) && dele.get(k) !== n
  );

  if (faltando.length) {
    falhou = true;
    console.error(`\n${l}.json — ${faltando.length} chave(s) faltando contra ${BASE}:`);
    for (const k of faltando) console.error(`  · ${k}`);
  }
  if (listaCurta.length) {
    falhou = true;
    console.error(`\n${l}.json — lista com tamanho diferente do ${BASE}:`);
    for (const [k, n] of listaCurta) console.error(`  · ${k}: ${BASE} tem ${n}, ${l} tem ${dele.get(k)}`);
  }
  if (sobrando.length) {
    console.warn(`\n${l}.json — ${sobrando.length} chave(s) que o ${BASE} não tem (órfã?):`);
    for (const k of sobrando) console.warn(`  · ${k}`);
  }
}

if (falhou) {
  console.error('\nFALHOU. READY_LOCALES em src/i18n/config.ts só admite idioma com dicionário completo.');
  process.exit(1);
}
console.log(`OK — ${base.size} chaves, paridade completa em ${OUTROS.join(', ')}.`);
```

- [ ] **Step 2: Registrar o script**

Em `package.json`, dentro de `"scripts"`, acrescentar:

```json
"i18n:check": "node tools/i18n-parity.mjs"
```

- [ ] **Step 3: Rodar e ver PASSAR no estado atual**

Run: `npm run i18n:check`
Expected: `OK — 591 chaves, paridade completa em en, es, de, ja.` (o número pode divergir; o que importa é sair `0`)

Se falhar aqui, **pare e relate**: significa que o dicionário já estava fora de paridade antes desta mudança, e isso é achado, não erro do script.

- [ ] **Step 4: Provar que ele detecta o defeito que existe para pegar**

```bash
python3 -c "
import json
d = json.load(open('src/i18n/de.json'))
del d['cta']['whatsapp']
json.dump(d, open('src/i18n/de.json','w'), ensure_ascii=False, indent=2)
"
npm run i18n:check; echo "código de saída: $?"
```

Expected: `de.json — 1 chave(s) faltando contra pt:` com `· cta.whatsapp`, e código de saída `1`.

- [ ] **Step 5: Desfazer o dano e confirmar verde**

```bash
git checkout src/i18n/de.json && npm run i18n:check
```

Expected: volta a `OK`.

- [ ] **Step 6: Commit**

```bash
git add tools/i18n-parity.mjs package.json
git commit -m "Verificador de paridade de dicionário, prometido desde a Fase 6

O comentário de READY_LOCALES manda rodar npm run i18n:check e o script
nunca existiu. Com 591 chaves em cinco idiomas, e ~40 entrando agora,
paridade a olho não é processo."
```

---

### Task 2: Contato comercial único

**Files:**
- Modify: `src/data/site.ts` (bloco `contact`, ~linha 55; nova função no fim)
- Modify: `src/components/Footer.astro` (bloco de contato, ~linha 28)
- Create: `tools/contato-unico.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: nada.
- Produces: `SITE.contact.whatsapp: string`, `SITE.contact.email: string` (deixa de ser `null`), `telefoneLegivel(): string`. As tarefas 7 e 8 usam `SITE.contact.email`.

- [ ] **Step 1: Escrever o verificador primeiro**

Criar `tools/contato-unico.mjs`:

```js
/**
 * Guarda do contato comercial no site CONSTRUÍDO.
 *
 * O número do panfleto (+55 11 96976-0096) foi retirado em 21/08/2026: a
 * venda passou a ter canal único. Ele vivia em SITE.contact e vazava para
 * 7 CTAs, o rodapé e o JSON-LD, então reaparecer é fácil — basta alguém
 * escrever um número solto em copy em vez de ler do dado.
 *
 * Também confere o que NÃO pode subir: o repo é público e a credencial de
 * SMTP mora fora do webroot.
 *
 *   node tools/contato-unico.mjs
 */
import { readFileSync, globSync, existsSync } from 'node:fs';

const PROIBIDO = ['5511969760096', '11969760096', '969760096', '96976-0096'];
const OBRIGATORIO = ['5547992067078', 'gabriela@wecarehosting.com.br'];

const paginas = globSync('dist/**/*.html');
if (paginas.length === 0) {
  console.error('Nenhum HTML em dist/. Rode `npm run build` antes.');
  process.exit(1);
}

let falhou = false;

for (const f of paginas) {
  const html = readFileSync(f, 'utf8');
  for (const proibido of PROIBIDO) {
    if (html.includes(proibido)) {
      falhou = true;
      console.error(`${f}: número retirado ainda presente — "${proibido}"`);
    }
  }
}

// O rodapé está em toda página, então o contato novo tem de estar em todas.
for (const obrigatorio of OBRIGATORIO) {
  const sem = paginas.filter((f) => !readFileSync(f, 'utf8').includes(obrigatorio));
  if (sem.length) {
    falhou = true;
    console.error(`"${obrigatorio}" ausente em ${sem.length} de ${paginas.length} páginas, ex.: ${sem[0]}`);
  }
}

// Segredo não sobe. O .example sobe; o real, nunca.
if (existsSync('dist/va-config.php')) {
  falhou = true;
  console.error('dist/va-config.php EXISTE. Credencial no webroot e a caminho de um repo público.');
}
for (const f of globSync('dist/**/*.php')) {
  if (/smtpPass\s*=>\s*['"][^'"]+['"]/.test(readFileSync(f, 'utf8'))) {
    falhou = true;
    console.error(`${f}: senha de SMTP embutida no código.`);
  }
}

if (falhou) { console.error('\nFALHOU.'); process.exit(1); }
console.log(`OK — ${paginas.length} páginas: contato único, sem resíduo, sem segredo.`);
```

Em `package.json`, `"scripts"`: `"contato:check": "node tools/contato-unico.mjs"`

- [ ] **Step 2: Rodar e ver FALHAR**

Run: `npm run build && npm run contato:check`
Expected: FALHA, com `número retirado ainda presente — "5511969760096"` em muitas páginas e `"5547992067078" ausente em 55 de 55 páginas`.

(`dist/enviar.php` ainda não existe; o script não o exige — a Tarefa 5 cria.)

- [ ] **Step 3: Trocar o dado**

Em `src/data/site.ts`, substituir o bloco `contact` inteiro:

```ts
  contact: {
    /**
     * CANAL COMERCIAL ÚNICO, definido pelo Carlos em 21/08/2026: toda venda
     * vai para uma pessoa só. Aqui vivia o número do panfleto,
     * +55 11 96976-0096, que saiu do site inteiro na mesma mudança.
     *
     * O nome de quem atende NÃO entra aqui nem em copy nenhuma, por decisão
     * do cliente: contato comercial troca de mão, e com copy impessoal o dia
     * em que trocar é uma linha neste arquivo — não um deploy para consertar
     * oito lugares. `tools/contato-unico.mjs` guarda essa fronteira.
     */
    whatsapp: '5547992067078',
    /**
     * Destino do formulário de reserva e do link no rodapé. Era `null` e
     * marcado PENDENTE desde a Fase 2; o bloco de e-mail do Footer já estava
     * escrito esperando por isto e acende sozinho agora.
     */
    email: 'gabriela@wecarehosting.com.br',
    instagram: '@villaarapiuns',
  },
```

E no fim do arquivo, junto de `whatsappUrl()`:

```ts
/**
 * Escreve o WhatsApp para leitura humana: 5547992067078 → +55 47 99206-7078.
 *
 * Deriva dos mesmos dígitos de propósito. Guardar o número formatado num
 * segundo campo é convidar os dois a divergirem, e número de contato errado
 * num site de pousada remota não é erro de formatação, é venda perdida.
 */
export function telefoneLegivel(): string {
  const d = SITE.contact.whatsapp;
  // 55 + DDD(2) + assinante(8 ou 9)
  const pais = d.slice(0, 2);
  const ddd = d.slice(2, 4);
  const resto = d.slice(4);
  const meio = resto.length === 9 ? resto.slice(0, 5) : resto.slice(0, 4);
  const fim = resto.slice(meio.length);
  return `+${pais} ${ddd} ${meio}-${fim}`;
}
```

- [ ] **Step 4: Mostrar o número no rodapé**

Em `src/components/Footer.astro`, trocar `import { SITE, whatsappUrl }` por:

```astro
import { SITE, whatsappUrl, telefoneLegivel } from '@/data/site';
```

E no bloco de contato, depois do link de e-mail, acrescentar:

```astro
          <a href={`tel:+${SITE.contact.whatsapp}`} class="link-texto w-fit text-salvia decoration-salvia/60">
            {telefoneLegivel()}
          </a>
```

- [ ] **Step 5: Rodar e ver PASSAR**

Run: `npm run check && npm run build && npm run contato:check`
Expected: `astro check` sem erro; `OK — 55 páginas: contato único, sem resíduo, sem segredo.`

- [ ] **Step 6: Conferir a mão o que o script não vê**

```bash
grep -o 'telephone":"[^"]*"' dist/pt/index.html
grep -c 'wa.me/5547992067078' dist/pt/reservar/index.html
```

Expected: `telephone":"+5547992067078"`, e contagem ≥ 1.

- [ ] **Step 7: Commit**

```bash
git add src/data/site.ts src/components/Footer.astro tools/contato-unico.mjs package.json
git commit -m "Contato comercial único: canal de venda passa a ser um só

O número do panfleto sai de SITE.contact e com ele dos 7 CTAs, do rodapé e
do telephone do JSON-LD de uma vez — tudo já lia do dado. SITE.contact.email
deixa de ser null e acende o bloco que o Footer tinha pronto desde a Fase 2.

tools/contato-unico.mjs guarda a fronteira nos dois sentidos: número retirado
não volta, e credencial de SMTP não sobe num repo público."
```

---

### Task 3: A copy da Reservar deixa de negar o formulário

`pt.json` diz hoje, em `reservar.intro`: *"Não há formulário nem motor de reserva."* Em cinco idiomas. A frase fica **falsa** quando o formulário entra, e não estava no spec — apareceu na leitura do dicionário.

Na mesma passada, `reservar.respD` se desculpa por demora com *"se o sinal do rio estiver ruim, pode demorar algumas horas"*. Isso deixou de valer: a venda saiu do rio. É justamente o que torna a promessa de 24 horas crível em vez de otimista.

**Files:**
- Modify: `src/i18n/pt.json`, `en.json`, `es.json`, `de.json`, `ja.json` (bloco `reservar`)

**Interfaces:**
- Consumes: `npm run i18n:check` (Tarefa 1).
- Produces: `reservar.intro`, `reservar.respD`, `reservar.comoT` revisadas. A Tarefa 9 renderiza.

- [ ] **Step 1: Reescrever as três chaves em `pt.json`**

Em `src/i18n/pt.json`, bloco `reservar`:

```json
    "intro": "Não há motor de reserva nem carrinho. Você escreve — pelo WhatsApp ou por este formulário — e quem responde é quem recebe.",
    "comoT": "Se preferir o WhatsApp, ajuda dizer de uma vez",
    "respD": "Em até 24 horas, no idioma em que você escrever, pelo WhatsApp ou por e-mail.",
```

`intro` guarda o que a frase antiga tinha de bom — *"quem responde é quem recebe"* — e joga fora só a parte que virou mentira. `comoT` passa a dizer para quem a lista serve, já que o formulário agora pergunta as mesmas coisas em campo.

- [ ] **Step 2: As mesmas três chaves nos outros quatro**

`en.json`:
```json
    "intro": "No booking engine, no cart. You write — on WhatsApp or through this form — and the person who answers is the person who receives you.",
    "comoT": "If you'd rather use WhatsApp, it helps to say up front",
    "respD": "Within 24 hours, in whatever language you write in, by WhatsApp or email.",
```

`es.json` (tratamento formal, "usted"):
```json
    "intro": "No hay motor de reservas ni carrito. Usted escribe — por WhatsApp o con este formulario — y quien responde es quien lo recibe.",
    "comoT": "Si prefiere WhatsApp, ayuda decirlo todo de una vez",
    "respD": "En un plazo de 24 horas, en el idioma en que usted escriba, por WhatsApp o correo.",
```

`de.json` (tratamento formal, "Sie"):
```json
    "intro": "Kein Buchungssystem, kein Warenkorb. Sie schreiben — über WhatsApp oder dieses Formular — und wer antwortet, ist wer Sie empfängt.",
    "comoT": "Wenn Sie WhatsApp bevorzugen, hilft es, alles auf einmal zu sagen",
    "respD": "Innerhalb von 24 Stunden, in der Sprache, in der Sie schreiben, per WhatsApp oder E-Mail.",
```

`ja.json`:
```json
    "intro": "予約エンジンもカートもありません。WhatsAppまたはこのフォームでご連絡いただければ、お迎えする本人がお返事します。",
    "comoT": "WhatsAppをご希望の場合、はじめにお伝えいただけると助かります",
    "respD": "24時間以内に、お書きになった言語で、WhatsAppまたはメールにてお返事します。",
```

- [ ] **Step 3: Gate de paridade e de mentira residual**

```bash
npm run i18n:check
grep -rn "Não há formulário\|No contact form\|no hay formulario" src/i18n/ || echo "OK: nenhuma negação de formulário sobrou"
```

Expected: `OK` nos dois.

- [ ] **Step 4: Conferir a promessa das 24h nos cinco**

```bash
grep -c "24" src/i18n/pt.json src/i18n/en.json src/i18n/es.json src/i18n/de.json src/i18n/ja.json
```

Expected: contagem ≥ 1 em cada arquivo.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/
git commit -m "Reservar deixa de negar o formulário que vai existir

reservar.intro dizia 'Não há formulário nem motor de reserva' nos cinco
idiomas. Metade continua verdade — motor de reserva não vai existir —, a
outra metade fica falsa nesta mudança.

E respD se desculpava por demora citando sinal ruim no rio. A venda saiu do
rio: quem atende não está na Villa. É o que torna as 24 horas uma promessa
e não um otimismo."
```

---

### Task 4: Página de enviado, com noindex e fora do sitemap

O caminho **sem JS** precisa de um lugar para aterrissar depois do POST. Ela vem antes do endpoint porque o `303` da Tarefa 5 aponta para cá.

**Files:**
- Modify: `src/i18n/routes.ts` (`PAGE_KEYS`, `SLUGS`, novo `NOINDEX_KEYS`)
- Modify: `src/layouts/BaseLayout.astro` (`interface Props`, `<head>`)
- Modify: `src/content-pages/PageRenderer.astro` (mapa `PAGINAS`, prop `robots`)
- Create: `src/content-pages/Enviado.astro`
- Modify: `astro.config.mjs` (filtro do sitemap)
- Modify: os cinco dicionários (`nav.bookSent`, `desc.bookSent`, bloco `enviado`)

**Interfaces:**
- Consumes: `href()` de `routes.ts`.
- Produces: `NOINDEX_KEYS: readonly PageKey[]`, chave de página `'bookSent'`, e as 5 URLs `/{locale}/{slug}/`. A Tarefa 5 redireciona para elas.

- [ ] **Step 1: Rota e constante de noindex**

Em `src/i18n/routes.ts`, acrescentar `'bookSent'` ao fim de `PAGE_KEYS`, e a `SLUGS`:

```ts
  bookSent:     { en: 'book/sent',     pt: 'reservar/enviado', es: 'reservar/enviado', de: 'buchen/gesendet', ja: 'book/sent' },
```

E depois de `NAV_KEYS`:

```ts
/**
 * Páginas que existem para o visitante mas não para o índice de busca.
 *
 * Fonte única: o `<meta robots>` do BaseLayout e o filtro do sitemap em
 * astro.config.mjs leem daqui. Antes desta constante o filtro era a string
 * '/styleguide' escrita à mão na config — o que funciona até a segunda
 * página noindex, que em cinco idiomas são cinco strings soltas para
 * alguém esquecer.
 */
export const NOINDEX_KEYS: readonly PageKey[] = ['bookSent'];

/** Os caminhos noindex em todos os idiomas, para o filtro do sitemap. */
export function caminhosNoindex(): string[] {
  return NOINDEX_KEYS.flatMap((k) => Object.values(SLUGS[k]));
}
```

- [ ] **Step 2: `BaseLayout` aprende a dizer noindex**

Em `src/layouts/BaseLayout.astro`, na `interface Props`:

```ts
  /**
   * Falso põe a página fora do índice E tira os hreflang: alternates de
   * idioma numa página que não deve ser indexada não servem para nada.
   */
  indexavel?: boolean;
```

Na desestruturação: `const { locale, pageKey, title, description, image, indexavel = true } = Astro.props;`

Trocar o cálculo dos alternates:

```ts
const alternates = indexavel
  ? LOCALES.map((l) => ({ lang: HTML_LANG[l], url: new URL(href(l, pageKey), SITE.domain).toString() }))
  : [];
```

E no `<head>`, junto das outras meta:

```astro
{!indexavel && <meta name="robots" content="noindex, follow" />}
```

- [ ] **Step 3: A página**

Criar `src/content-pages/Enviado.astro`:

```astro
---
/**
 * ENVIADO — o pouso do caminho SEM JavaScript.
 *
 * Com JS, o formulário confirma na própria página e ninguém chega aqui. Ela
 * existe porque `<form method="post">` nativo precisa de um lugar para ir, e
 * porque um visitante com script bloqueado tem o mesmo direito de saber que
 * a mensagem chegou.
 *
 * Fora do índice e fora do sitemap: é página de estado, não de conteúdo.
 */
import AberturaPagina from '@/components/AberturaPagina.astro';
import { href } from '@/i18n/routes';
import { useTranslations } from '@/i18n/utils';
import { whatsappUrl } from '@/data/site';
import type { Locale } from '@/i18n/config';

interface Props { locale: Locale }
const { locale } = Astro.props;
const t = useTranslations(locale);
---

<AberturaPagina titulo={t('enviado.h1')} intro={t('enviado.intro')} />

<section class="pb-24">
  <div class="container-editorial">
    <div class="max-w-2xl">
      <p class="etiqueta">{t('enviado.prazoT')}</p>
      <p class="mt-2">{t('enviado.prazoD')}</p>

      <p class="mt-10 flex flex-wrap gap-3">
        <a href={whatsappUrl(t('whatsapp.geral'))} class="btn btn-primario">{t('cta.whatsapp')}</a>
        <a href={href(locale, 'home')} class="btn btn-secundario">{t('enviado.voltar')}</a>
      </p>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Despachar a rota**

Em `src/content-pages/PageRenderer.astro`: `import Enviado from '@/content-pages/Enviado.astro';`, acrescentar `bookSent: Enviado,` ao mapa `PAGINAS`, e importar `NOINDEX_KEYS` de `@/i18n/routes`. Passar ao layout:

```astro
<BaseLayout
  locale={locale}
  pageKey={pageKey}
  title={title}
  description={description}
  indexavel={!NOINDEX_KEYS.includes(pageKey)}
>
```

- [ ] **Step 5: Fora do sitemap**

Em `astro.config.mjs`, no topo: `import { caminhosNoindex } from './src/i18n/routes.ts';`

**Se o build reclamar do import de `.ts` na config** (o Astro carrega a config por Vite e normalmente resolve, mas não é garantido): não duplique os slugs na config. Mova `NOINDEX_KEYS`/`caminhosNoindex()` para um `src/i18n/noindex.mjs` novo e importe dele nos dois lados — `routes.ts` e `astro.config.mjs`. O ponto da tarefa é haver **uma** fonte para os cinco caminhos; onde ela mora é secundário.

E trocar o filtro:

```js
      // '/styleguide' é a página interna de aprovação de design; os caminhos
      // noindex vêm de NOINDEX_KEYS, uma fonte só para os cinco idiomas.
      filter: (page) =>
        !page.includes('/styleguide') &&
        !caminhosNoindex().some((c) => page.includes(`/${c}/`)),
```

- [ ] **Step 6: As chaves, nos cinco**

`pt.json` — `nav.bookSent`: `"Mensagem enviada"`; `desc.bookSent`: `"Sua mensagem chegou. Respondemos em até 24 horas."`; e bloco novo no topo do arquivo:

```json
  "enviado": {
    "h1": "Sua mensagem chegou",
    "intro": "Alguém já vai ler. Nenhum passo seu ficou pendente.",
    "prazoT": "Resposta",
    "prazoD": "Em até 24 horas, no idioma em que você escreveu. Se tiver pressa, o WhatsApp é mais rápido.",
    "voltar": "Voltar ao início"
  },
```

`en.json`: `nav.bookSent` `"Message sent"`; `desc.bookSent` `"Your message arrived. We reply within 24 hours."`;
```json
  "enviado": {
    "h1": "Your message arrived",
    "intro": "Someone is about to read it. Nothing is left for you to do.",
    "prazoT": "Reply",
    "prazoD": "Within 24 hours, in the language you wrote in. If you're in a hurry, WhatsApp is faster.",
    "voltar": "Back to the start"
  },
```

`es.json` (usted): `"Mensaje enviado"`; `"Su mensaje llegó. Respondemos en un plazo de 24 horas."`;
```json
  "enviado": {
    "h1": "Su mensaje llegó",
    "intro": "Alguien va a leerlo enseguida. No queda nada pendiente de su parte.",
    "prazoT": "Respuesta",
    "prazoD": "En un plazo de 24 horas, en el idioma en que escribió. Si tiene prisa, WhatsApp es más rápido.",
    "voltar": "Volver al inicio"
  },
```

`de.json` (Sie): `"Nachricht gesendet"`; `"Ihre Nachricht ist angekommen. Wir antworten innerhalb von 24 Stunden."`;
```json
  "enviado": {
    "h1": "Ihre Nachricht ist angekommen",
    "intro": "Jemand wird sie gleich lesen. Für Sie bleibt nichts zu tun.",
    "prazoT": "Antwort",
    "prazoD": "Innerhalb von 24 Stunden, in der Sprache, in der Sie geschrieben haben. Wenn es eilt, ist WhatsApp schneller.",
    "voltar": "Zurück zum Anfang"
  },
```

`ja.json`: `"送信完了"`; `"メッセージが届きました。24時間以内にお返事します。"`;
```json
  "enviado": {
    "h1": "メッセージが届きました",
    "intro": "まもなく担当者が読みます。お客様側で必要な手続きはもうありません。",
    "prazoT": "お返事",
    "prazoD": "24時間以内に、お書きになった言語でお返事します。お急ぎの場合はWhatsAppのほうが早いです。",
    "voltar": "はじめに戻る"
  },
```

- [ ] **Step 7: Rodar os gates**

```bash
npm run i18n:check && npm run check && npm run build
```
Expected: os três sem erro.

- [ ] **Step 8: Verificar as cinco URLs, o noindex e a ausência no sitemap**

```bash
ls dist/pt/reservar/enviado/index.html dist/en/book/sent/index.html \
   dist/es/reservar/enviado/index.html dist/de/buchen/gesendet/index.html \
   dist/ja/book/sent/index.html
grep -c 'name="robots" content="noindex' dist/pt/reservar/enviado/index.html
grep -c 'hreflang' dist/pt/reservar/enviado/index.html
grep -c 'enviado\|gesendet\|book/sent' dist/sitemap-0.xml
grep -c 'hreflang' dist/pt/reservar/index.html
```

Expected: os cinco arquivos existem; `1` para o robots; `0` hreflang na página de enviado; `0` ocorrências no sitemap; e a Reservar **continua** com hreflang (a mudança não vazou para páginas indexáveis).

- [ ] **Step 9: Commit**

```bash
git add src/i18n/ src/layouts/BaseLayout.astro src/content-pages/ astro.config.mjs
git commit -m "Página de enviado nos 5 idiomas, noindex e fora do sitemap

Pouso do caminho sem JavaScript: <form method=post> nativo precisa de um
lugar para ir. Com JS ninguém chega nela.

NOINDEX_KEYS em routes.ts passa a ser a fonte única do noindex — o filtro do
sitemap era a string '/styleguide' escrita na config, o que funciona até a
segunda página noindex, que em cinco idiomas são cinco strings para esquecer.
Página noindex também perde os hreflang: alternate de idioma em página que
não deve ser indexada não serve para nada."
```

---

### Task 5: Endpoint PHP — defesas e validação, em `dryRun`

Sem envio real ainda. O objetivo é ter o endpoint **auditável e testável sem credencial nenhuma**.

**Files:**
- Create: `public/enviar.php`
- Create: `public/va-config.example.php`
- Create: `tools/testa-endpoint.mjs`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: as URLs de `bookSent` (Tarefa 4).
- Produces: `POST /enviar.php`. Com `Accept: application/json` → `{"ok":true}` ou `{"ok":false,"erros":{"<campo>":"<codigo>"}}`. Senão → `303` para `/{idioma}/{slug bookSent}/`. Códigos de erro: `obrigatorio`, `invalido`, `longo`, `opcao`. A Tarefa 6 acrescenta o envio; a 7 consome os códigos.

- [ ] **Step 1: Impedir que a credencial real seja versionada**

Em `.gitignore`, acrescentar:

```
# Credencial do endpoint de e-mail. O real mora ACIMA do public_html, no
# servidor. Nunca no repo — que é público.
va-config.php
```

- [ ] **Step 2: O exemplo de config**

Criar `public/va-config.example.php`:

```php
<?php
/**
 * MODELO. Copie para UM NÍVEL ACIMA do public_html, como `va-config.php`, e
 * preencha lá. O arquivo real nunca entra no repositório — que é público.
 *
 *   /home/USUARIO/va-config.php      <- o real, fora do alcance do servidor web
 *   /home/USUARIO/public_html/       <- o site
 */
return [
  'smtpHost' => 'mail.vilaarapiuns.com.br',
  'smtpPort' => 465,
  'smtpUser' => 'site@vilaarapiuns.com.br',
  'smtpPass' => '',

  'from'     => 'site@vilaarapiuns.com.br',
  'fromName' => 'Villa Arapiuns',
  'to'       => 'gabriela@wecarehosting.com.br',
  'bcc'      => 'carlos@wecarehosting.com.br',

  /** true = grava o e-mail em arquivo em vez de enviar. É como se testa local. */
  'dryRun'   => false,
  /** Diretório de log e de contador de limite. FORA do webroot. */
  'varDir'   => '/home/USUARIO/va-var',
];
```

- [ ] **Step 3: O endpoint**

Criar `public/enviar.php`:

```php
<?php
/**
 * Recebe o formulário de reserva e manda por e-mail.
 *
 * Site estático em Apache/cPanel: este arquivo é o único pedaço de servidor
 * que existe. Astro copia public/ para dist/ sem tocar, então ele sobe por
 * FTP com o resto.
 *
 * A ordem das defesas abaixo não é decorativa. A que importa mais é a
 * remoção de CR/LF: injeção de cabeçalho é o que transforma um form-to-mail
 * em relay de spam alheio com o seu domínio na assinatura.
 *
 * Erros saem como CÓDIGO, não como texto. O texto vem do dicionário, no
 * idioma do visitante. É o que mantém este arquivo ignorante de i18n.
 */
declare(strict_types=1);

const LIMITE_HORA = 5;
const LIMITE_DIA  = 20;
const TEMPO_MINIMO = 3;

$DOMINIO = 'vilaarapiuns.com.br';

/** Slug da página de enviado por idioma — espelha SLUGS.bookSent em routes.ts. */
const ENVIADO = [
  'pt' => 'reservar/enviado', 'en' => 'book/sent', 'es' => 'reservar/enviado',
  'de' => 'buchen/gesendet',  'ja' => 'book/sent',
];

const MESES    = ['1','2','3','4','5','6','7','8','9','10','11','12','flexivel'];
const PESSOAS  = ['1','2','3-6','7-14','15-26'];
const INTERESSE = ['pousada','pacote','privativa','naosei'];

// ── Config ───────────────────────────────────────────────────────────────
$cfgPath = __DIR__ . '/../va-config.php';
if (!is_file($cfgPath)) { http_response_code(500); exit('config ausente'); }
$cfg = require $cfgPath;

// ── Resposta ─────────────────────────────────────────────────────────────
$querJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function responde(bool $ok, array $erros, string $idioma, bool $json): never {
  if ($json) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($ok ? 200 : 422);
    echo json_encode(['ok' => $ok, 'erros' => $erros], JSON_UNESCAPED_UNICODE);
    exit;
  }
  $idioma = isset(ENVIADO[$idioma]) ? $idioma : 'en';
  if ($ok) {
    header('Location: /' . $idioma . '/' . ENVIADO[$idioma] . '/', true, 303);
  } else {
    header('Location: /' . $idioma . '/?erro=1', true, 303);
  }
  exit;
}

/** Tira CR e LF. É ISTO que impede injeção de cabeçalho. */
function umaLinha(string $s): string {
  return trim(str_replace(["\r", "\n", "\0"], '', $s));
}

function campo(string $nome): string {
  return umaLinha(mb_substr((string)($_POST[$nome] ?? ''), 0, 3000));
}

// ── 1. Só POST ───────────────────────────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405); header('Allow: POST'); exit('só POST');
}

$idioma = in_array($_POST['idioma'] ?? '', array_keys(ENVIADO), true) ? $_POST['idioma'] : 'en';

// ── 2. Mesma origem ──────────────────────────────────────────────────────
$origem = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
$local = in_array(parse_url($origem, PHP_URL_HOST) ?? '', ['localhost', '127.0.0.1'], true);
if (!str_contains($origem, $DOMINIO) && !$local) {
  http_response_code(403); exit('origem');
}

// ── 3. Honeypot ──────────────────────────────────────────────────────────
// Responde SUCESSO. Dizer "você caiu na armadilha" é ensinar o bot.
if (campo('_hp') !== '') { responde(true, [], $idioma, $querJson); }

// ── 4. Tempo mínimo ──────────────────────────────────────────────────────
// _t é preenchido por JS no CARREGAMENTO. Página estática: um timestamp
// vindo do build seria o horário do build. Vazio = sem JS, e sem JS não se
// rejeita ninguém — as outras quatro defesas seguem valendo.
$t = (int)campo('_t');
if ($t > 0 && (time() - $t) < TEMPO_MINIMO) { responde(true, [], $idioma, $querJson); }

// ── 5. Limite por IP ─────────────────────────────────────────────────────
$varDir = rtrim((string)$cfg['varDir'], '/');
if (!is_dir($varDir)) { @mkdir($varDir, 0700, true); }
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '0');
$arq = $varDir . '/rate-' . hash('sha256', $ip) . '.json';
$agora = time();
$hist = is_file($arq) ? (json_decode((string)file_get_contents($arq), true) ?: []) : [];
$hist = array_values(array_filter($hist, fn($ts) => $agora - $ts < 86400));
$naHora = count(array_filter($hist, fn($ts) => $agora - $ts < 3600));
if ($naHora >= LIMITE_HORA || count($hist) >= LIMITE_DIA) {
  http_response_code(429); exit('limite');
}

// ── 6/7. Validação, lista branca, sanitização ────────────────────────────
$erros = [];

$nome = campo('nome');
if ($nome === '')                { $erros['nome'] = 'obrigatorio'; }
elseif (mb_strlen($nome) < 2)    { $erros['nome'] = 'invalido'; }
elseif (mb_strlen($nome) > 80)   { $erros['nome'] = 'longo'; }

$email = campo('email');
if ($email === '')                                          { $erros['email'] = 'obrigatorio'; }
elseif (!filter_var($email, FILTER_VALIDATE_EMAIL))         { $erros['email'] = 'invalido'; }
elseif (mb_strlen($email) > 120)                            { $erros['email'] = 'longo'; }

$whatsapp = campo('whatsapp');
if ($whatsapp !== '' && !preg_match('/^[0-9+\s()\-]{8,20}$/', $whatsapp)) {
  $erros['whatsapp'] = 'invalido';
}

$mes = campo('mes');
if ($mes === '')                              { $erros['mes'] = 'obrigatorio'; }
elseif (!in_array($mes, MESES, true))         { $erros['mes'] = 'opcao'; }

// Ano só importa se o mês for concreto. Sem JS os dois selects aparecem,
// então o valor vem e é ignorado — não é erro do visitante.
$ano = campo('ano');
if ($mes !== 'flexivel' && $mes !== '' && !preg_match('/^20\d{2}$/', $ano)) {
  $erros['ano'] = 'obrigatorio';
}

$pessoas = campo('pessoas');
if ($pessoas === '')                            { $erros['pessoas'] = 'obrigatorio'; }
elseif (!in_array($pessoas, PESSOAS, true))     { $erros['pessoas'] = 'opcao'; }

$interesse = campo('interesse');
if ($interesse !== '' && !in_array($interesse, INTERESSE, true)) {
  $erros['interesse'] = 'opcao';
}

// A mensagem é o único campo em que quebra de linha é conteúdo, não ataque.
// Ela vai no CORPO, nunca num cabeçalho.
$mensagem = trim(str_replace("\0", '', (string)($_POST['mensagem'] ?? '')));
if (mb_strlen($mensagem) > 2000) { $erros['mensagem'] = 'longo'; }

if ($erros) { responde(false, $erros, $idioma, $querJson); }

// ── 8. Montar (envio entra na Tarefa 6) ──────────────────────────────────
$IDIOMA_NOME = ['pt'=>'Português','en'=>'English','es'=>'Español','de'=>'Deutsch','ja'=>'日本語'];
$MES_PT = [1=>'janeiro','fevereiro','março','abril','maio','junho','julho',
           'agosto','setembro','outubro','novembro','dezembro'];
$INTERESSE_PT = ['pousada'=>'Pousada (só estadia)','pacote'=>'Pacote saindo de Alter do Chão',
                 'privativa'=>'Grupo privativo','naosei'=>'Ainda não sabe'];

$quando = $mes === 'flexivel' ? 'ainda flexível' : ($MES_PT[(int)$mes] . '/' . $ano);
$assunto = sprintf('[Villa Arapiuns] %s — %s pessoas — %s', $nome, $pessoas, $quando);

$corpo = "Pedido pelo formulário do site.\n\n";
if ($idioma !== 'pt') {
  $corpo .= ">>> Este visitante escreveu em {$IDIOMA_NOME[$idioma]}. Responda nesse idioma. <<<\n\n";
}
$corpo .= "Nome:       {$nome}\n";
$corpo .= "E-mail:     {$email}\n";
$corpo .= 'WhatsApp:   ' . ($whatsapp !== '' ? $whatsapp : '(não informou)') . "\n";
$corpo .= "Quando:     {$quando}\n";
$corpo .= "Pessoas:    {$pessoas}\n";
$corpo .= 'Interesse:  ' . ($interesse !== '' ? $INTERESSE_PT[$interesse] : '(não informou)') . "\n";
$corpo .= 'Idioma:     ' . $IDIOMA_NOME[$idioma] . "\n\n";
$corpo .= "Mensagem (no idioma original, sem tradução):\n";
$corpo .= ($mensagem !== '' ? $mensagem : '(não escreveu nada)') . "\n\n";
$corpo .= '— ' . (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('d/m/Y H:i') . " (Brasília)\n";
$corpo .= "Responder neste e-mail vai direto para o visitante.\n";

// Registrar o envio no contador ANTES de enviar: se o SMTP falhar e alguém
// insistir, o limite ainda tem de valer.
$hist[] = $agora;
@file_put_contents($arq, json_encode($hist), LOCK_EX);

require __DIR__ . '/enviar-mail.php';   // criado na Tarefa 6
responde(true, [], $idioma, $querJson);
```

Nesta tarefa, criar `public/enviar-mail.php` como talo de `dryRun`:

```php
<?php
/**
 * Entrega. Isolado do enviar.php de propósito: validação se testa sem
 * credencial nenhuma, entrega precisa de SMTP. A Tarefa 6 troca o corpo
 * desta função pelo envio real.
 *
 * Variáveis do escopo do enviar.php: $cfg, $assunto, $corpo, $nome, $email, $idioma.
 *
 * Alcançável direto em /enviar-mail.php, e chamado assim vazaria caminho de
 * servidor em aviso do PHP. A guarda fecha a porta.
 */
if (!isset($cfg, $assunto, $corpo, $nome, $email, $idioma)) { http_response_code(404); exit; }

$destino = $cfg['varDir'] . '/enviados';
if (!is_dir($destino)) { @mkdir($destino, 0700, true); }
$stamp = date('Ymd-His') . '-' . substr(hash('sha256', $email . microtime()), 0, 6);
file_put_contents(
  "{$destino}/{$stamp}.txt",
  "To: {$cfg['to']}\nBcc: {$cfg['bcc']}\nReply-To: {$nome} <{$email}>\n"
  . "Subject: {$assunto}\n\n{$corpo}"
);
```

- [ ] **Step 4: A suíte**

Criar `tools/testa-endpoint.mjs`:

```js
/**
 * Suíte HTTP contra dist/enviar.php, em dryRun.
 *
 * Sobe o servidor embutido do PHP, exercita cada caso do spec, derruba.
 * Nenhuma credencial de SMTP envolvida: em dryRun o endpoint grava o
 * e-mail em arquivo, e é o arquivo que a suíte inspeciona.
 *
 *   npm run form:check      (exige `npm run build` antes)
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORTA = 4399;
const BASE = `http://127.0.0.1:${PORTA}`;
const varDir = mkdtempSync(join(tmpdir(), 'va-'));

// A config real mora ACIMA do webroot. dist/ é o webroot, então: ao lado dele.
// Template explícito, não JSON massageado com regex: config de teste que
// gera PHP inválido faz a suíte inteira falhar por um motivo que não é o
// que ela está medindo.
writeFileSync('va-config.php', `<?php return [
  'smtpHost' => '', 'smtpPort' => 465, 'smtpUser' => '', 'smtpPass' => '',
  'from' => 'site@vilaarapiuns.com.br', 'fromName' => 'Villa Arapiuns',
  'to' => 'gabriela@wecarehosting.com.br',
  'bcc' => 'carlos@wecarehosting.com.br',
  'dryRun' => true,
  'varDir' => ${JSON.stringify(varDir)},
];`);

const php = spawn('php', ['-S', `127.0.0.1:${PORTA}`, '-t', 'dist'], { stdio: 'ignore' });
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
await dorme(1200);

const VALIDO = { nome: 'Ana Silva', email: 'ana@example.com', whatsapp: '+49 170 1234567',
                 mes: '3', ano: '2027', pessoas: '2', interesse: 'pacote',
                 mensagem: 'Wir möchten im März kommen.', idioma: 'de' };

function enviados() {
  try { return readdirSync(join(varDir, 'enviados')); } catch { return []; }
}
function limpa() {
  try { rmSync(join(varDir, 'enviados'), { recursive: true }); } catch {}
  for (const f of readdirSync(varDir)) if (f.startsWith('rate-')) rmSync(join(varDir, f));
}

async function post(campos, headers = {}) {
  return fetch(`${BASE}/enviar.php`, {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded',
               Origin: 'https://vilaarapiuns.com.br', ...headers },
    body: new URLSearchParams(campos),
  });
}

let falhas = 0;
const ok = (nome, cond, detalhe = '') => {
  console.log(`${cond ? '  ok  ' : ' FALHA'} ${nome}${cond ? '' : ' — ' + detalhe}`);
  if (!cond) falhas++;
};

try {
  // 1. Envio válido, resposta JSON
  limpa();
  let r = await post(VALIDO, { Accept: 'application/json' });
  let j = await r.json();
  ok('envio válido devolve ok', r.status === 200 && j.ok === true, `${r.status} ${JSON.stringify(j)}`);
  const arqs = enviados();
  ok('gravou exatamente um e-mail', arqs.length === 1, `gravou ${arqs.length}`);
  const email = readFileSync(join(varDir, 'enviados', arqs[0]), 'utf8');
  ok('assunto traz nome, pessoas e quando',
     email.includes('[Villa Arapiuns] Ana Silva — 2 pessoas — março/2027'), email.split('\n')[3]);
  ok('avisa o idioma do visitante', email.includes('escreveu em Deutsch'));
  ok('Reply-To é o visitante', email.includes('Reply-To: Ana Silva <ana@example.com>'));
  ok('BCC de segurança presente', email.includes('Bcc: carlos@wecarehosting.com.br'));
  ok('mensagem verbatim, sem tradução', email.includes('Wir möchten im März kommen.'));

  // 2. Sem JS: 303 para a página de enviado no idioma certo
  limpa();
  r = await post({ ...VALIDO, idioma: 'ja' });
  ok('sem JS redireciona 303', r.status === 303, String(r.status));
  ok('303 aponta para o idioma certo',
     r.headers.get('location') === '/ja/book/sent/', String(r.headers.get('location')));

  // 3. Honeypot: responde sucesso e não grava
  limpa();
  r = await post({ ...VALIDO, _hp: 'http://spam.example' }, { Accept: 'application/json' });
  ok('honeypot finge sucesso', (await r.json()).ok === true);
  ok('honeypot não gravou nada', enviados().length === 0);

  // 4. Rápido demais
  limpa();
  r = await post({ ...VALIDO, _t: String(Math.floor(Date.now() / 1000)) }, { Accept: 'application/json' });
  ok('envio instantâneo descartado', enviados().length === 0);

  // 5. Sem _t (sem JS) NÃO é rejeitado
  limpa();
  await post(VALIDO, { Accept: 'application/json' });
  ok('ausência de _t não bloqueia quem está sem JS', enviados().length === 1);

  // 6. Validação
  limpa();
  for (const [nome, patch, campo, codigo] of [
    ['nome vazio',        { nome: '' },                 'nome',     'obrigatorio'],
    ['e-mail inválido',   { email: 'ana@@example' },    'email',    'invalido'],
    ['mensagem gigante',  { mensagem: 'x'.repeat(2001) },'mensagem','longo'],
    ['mês fora da lista', { mes: '13' },                'mes',      'opcao'],
    ['pessoas inventado', { pessoas: '99' },            'pessoas',  'opcao'],
  ]) {
    const rr = await post({ ...VALIDO, ...patch }, { Accept: 'application/json' });
    const jj = await rr.json();
    ok(nome, rr.status === 422 && jj.erros?.[campo] === codigo, JSON.stringify(jj));
  }
  ok('nada inválido foi gravado', enviados().length === 0);

  // 7. Injeção de cabeçalho
  limpa();
  await post({ ...VALIDO, nome: 'Ana\r\nBcc: invasor@example.com' }, { Accept: 'application/json' });
  const inj = readFileSync(join(varDir, 'enviados', enviados()[0]), 'utf8');
  ok('CR/LF removidos do nome', !inj.includes('invasor@example.com'), 'cabeçalho injetado!');

  // 8. Mês flexível dispensa o ano
  limpa();
  r = await post({ ...VALIDO, mes: 'flexivel', ano: '' }, { Accept: 'application/json' });
  ok('mes=flexivel não exige ano', (await r.json()).ok === true);
  ok('grava "ainda flexível"',
     readFileSync(join(varDir, 'enviados', enviados()[0]), 'utf8').includes('ainda flexível'));

  // 9. Origem estranha
  limpa();
  r = await post(VALIDO, { Origin: 'https://evil.example', Accept: 'application/json' });
  ok('origem de fora recusada', r.status === 403, String(r.status));

  // 10. Limite por IP
  limpa();
  for (let i = 0; i < 5; i++) await post({ ...VALIDO, email: `a${i}@example.com` }, { Accept: 'application/json' });
  r = await post(VALIDO, { Accept: 'application/json' });
  ok('6º envio na mesma hora bloqueado', r.status === 429, String(r.status));

  // 11. GET recusado
  r = await fetch(`${BASE}/enviar.php`, { redirect: 'manual' });
  ok('GET devolve 405', r.status === 405, String(r.status));
} finally {
  php.kill();
  rmSync(varDir, { recursive: true, force: true });
  rmSync('va-config.php', { force: true });
}

console.log(falhas ? `\n${falhas} FALHA(S).` : '\nOK — endpoint íntegro.');
process.exit(falhas ? 1 : 0);
```

Em `package.json`: `"form:check": "node tools/testa-endpoint.mjs"`

- [ ] **Step 5: Fase vermelha de verdade — a suíte reprova por comportamento**

```bash
npm run build && rm dist/enviar.php && npm run form:check
```

Expected: FALHA, com `404` no POST em todos os casos.

Isto é a fase vermelha honesta. Rodar a suíte antes do build também falharia, mas por arquivo fora de lugar — o que não prova nada sobre o endpoint. Removendo `dist/enviar.php` de um build completo, o único motivo de falha é ausência de comportamento.

- [ ] **Step 6: Build e rodar de novo**

Run: `npm run build && npm run form:check`
Expected: **todos os casos `ok`** e `OK — endpoint íntegro.`

Se algum falhar, corrija `enviar.php` — não o teste. Cada caso da lista é um requisito do spec.

- [ ] **Step 7: Conferir que segredo não subiu**

```bash
npm run contato:check
git status --short   # va-config.php NÃO pode aparecer
```

- [ ] **Step 8: Commit**

```bash
git add public/enviar.php public/enviar-mail.php public/va-config.example.php \
        tools/testa-endpoint.mjs package.json .gitignore
git commit -m "Endpoint do formulário: defesas e validação, testável sem credencial

O único pedaço de servidor do site. Sete defesas em ordem, e a que mais
importa é a remoção de CR/LF: injeção de cabeçalho é o que transforma
form-to-mail em relay de spam com o nosso domínio na assinatura.

Duas decisões que a suíte fixa. Honeypot e envio instantâneo respondem
SUCESSO — dizer 'você caiu na armadilha' é ensinar o bot. E _t ausente não
bloqueia: a página é estática, então _t vem de JS no carregamento, e quem
está sem JS não é bot por isso.

Entrega isolada em enviar-mail.php para que validação se teste sem SMTP."
```

---

### Task 6: Envio real — SMTP, auto-resposta e BCC

**Files:**
- Modify: `public/enviar-mail.php` (troca o talo pelo envio real, mantendo o `dryRun`)
- Modify: `tools/testa-endpoint.mjs` (casos da auto-resposta)
- Create: `docs/deploy-formulario.md`

**Interfaces:**
- Consumes: `$cfg`, `$assunto`, `$corpo`, `$nome`, `$email`, `$idioma` do escopo do `enviar.php`.
- Produces: dois arquivos por envio em `dryRun` — `*-gabriela.txt` e `*-autoresposta.txt`.

- [ ] **Step 1: Auto-resposta no dicionário, cinco idiomas**

Bloco novo em cada dicionário. Texto **100% fixo** — nada que o visitante digitou é ecoado, exceto o nome no vocativo, que vai sanitizado. Um formulário que manda conteúdo do usuário para endereço do usuário é máquina de spam.

`pt.json`:
```json
  "autoresp": {
    "assunto": "Recebemos sua mensagem — Villa Arapiuns",
    "corpo": "Olá, {nome}!\n\nSua mensagem chegou. Respondemos em até 24 horas, no idioma em que você escreveu.\n\nSe tiver pressa, o WhatsApp é mais rápido: {whatsapp}\n\nAté breve,\nEquipe Villa Arapiuns\nRio Arapiuns, Santarém — Pará, Brasil"
  },
```
`en.json`:
```json
  "autoresp": {
    "assunto": "We received your message — Villa Arapiuns",
    "corpo": "Hello, {nome}!\n\nYour message arrived. We reply within 24 hours, in the language you wrote in.\n\nIf you're in a hurry, WhatsApp is faster: {whatsapp}\n\nSee you soon,\nThe Villa Arapiuns team\nArapiuns River, Santarém — Pará, Brazil"
  },
```
`es.json`:
```json
  "autoresp": {
    "assunto": "Recibimos su mensaje — Villa Arapiuns",
    "corpo": "¡Hola, {nome}!\n\nSu mensaje llegó. Respondemos en un plazo de 24 horas, en el idioma en que escribió.\n\nSi tiene prisa, WhatsApp es más rápido: {whatsapp}\n\nHasta pronto,\nEquipo Villa Arapiuns\nRío Arapiuns, Santarém — Pará, Brasil"
  },
```
`de.json`:
```json
  "autoresp": {
    "assunto": "Wir haben Ihre Nachricht erhalten — Villa Arapiuns",
    "corpo": "Hallo, {nome}!\n\nIhre Nachricht ist angekommen. Wir antworten innerhalb von 24 Stunden, in der Sprache, in der Sie geschrieben haben.\n\nWenn es eilt, ist WhatsApp schneller: {whatsapp}\n\nBis bald,\nIhr Villa-Arapiuns-Team\nRio Arapiuns, Santarém — Pará, Brasilien"
  },
```
`ja.json`:
```json
  "autoresp": {
    "assunto": "メッセージを受け取りました — Villa Arapiuns",
    "corpo": "{nome} 様\n\nメッセージが届きました。24時間以内に、お書きになった言語でお返事します。\n\nお急ぎの場合はWhatsAppのほうが早いです：{whatsapp}\n\nそれでは、またご連絡します。\nVilla Arapiuns スタッフ\nブラジル パラー州 サンタレン アラピウンス川"
  },
```

Rodar: `npm run i18n:check` → `OK`.

- [ ] **Step 2: PHP lê a auto-resposta dos mesmos dicionários**

O PHP não pode ter um sexto lugar onde essa copy vive. Ele lê os JSON direto — são arquivos, e `enviar.php` está em `dist/`, ao lado de nada; então o build tem de copiá-los. Acrescentar em `astro.config.mjs` **não** é o caminho: `public/` é copiado verbatim, então o passo é um script de build.

Em `package.json`, trocar o script `build`:

```json
"build": "astro build && node tools/copia-dicionarios.mjs"
```

Criar `tools/copia-dicionarios.mjs`:

```js
/**
 * Copia os dicionários para dist/_i18n/, porque enviar.php precisa da copy
 * da auto-resposta nos cinco idiomas.
 *
 * A alternativa era escrever essa copy uma segunda vez dentro do PHP. Um
 * texto que vive em dois lugares divergentes é um texto errado esperando a
 * vez, e este em particular carrega a promessa das 24 horas.
 */
import { mkdirSync, copyFileSync } from 'node:fs';

mkdirSync('dist/_i18n', { recursive: true });
for (const l of ['pt', 'en', 'es', 'de', 'ja']) {
  copyFileSync(`src/i18n/${l}.json`, `dist/_i18n/${l}.json`);
}
console.log('dicionários copiados para dist/_i18n/');
```

- [ ] **Step 3: Substituir `public/enviar-mail.php`**

```php
<?php
/**
 * Entrega: e-mail para quem vende + auto-resposta para o visitante.
 *
 * Isolado do enviar.php porque validação se testa sem credencial e entrega
 * não. Em dryRun grava os dois em arquivo — é assim que se testa local, e é
 * assim que se vê exatamente o que chega na caixa de entrada.
 *
 * Do escopo do enviar.php: $cfg, $assunto, $corpo, $nome, $email, $idioma.
 *
 * Este arquivo fica em dist/, então é alcançável direto em /enviar-mail.php.
 * Chamado assim, roda com variável nenhuma definida e vaza caminho de
 * servidor no aviso do PHP. A guarda abaixo fecha essa porta.
 */
if (!isset($cfg, $assunto, $corpo, $nome, $email, $idioma)) {
  http_response_code(404);
  exit;
}

/** Lê uma chave dos dicionários copiados pelo build. Sem i18n no PHP. */
function textoAuto(string $idioma, string $chave, array $trocas): string {
  foreach ([$idioma, 'en'] as $tentativa) {
    $arq = __DIR__ . "/_i18n/{$tentativa}.json";
    if (!is_file($arq)) continue;
    $d = json_decode((string)file_get_contents($arq), true);
    $v = $d['autoresp'][$chave] ?? null;
    if (is_string($v) && $v !== '') return strtr($v, $trocas);
  }
  return '';
}

$trocas = [
  // Único dado do visitante que entra: o nome, já sem CR/LF pelo umaLinha().
  '{nome}' => $nome,
  '{whatsapp}' => 'https://wa.me/5547992067078',
];
$autoAssunto = textoAuto($idioma, 'assunto', []);
$autoCorpo   = textoAuto($idioma, 'corpo', $trocas);

if ($cfg['dryRun']) {
  $destino = $cfg['varDir'] . '/enviados';
  if (!is_dir($destino)) { @mkdir($destino, 0700, true); }
  $stamp = date('Ymd-His') . '-' . substr(hash('sha256', $email . microtime()), 0, 6);
  file_put_contents("{$destino}/{$stamp}-gabriela.txt",
    "To: {$cfg['to']}\nBcc: {$cfg['bcc']}\nReply-To: {$nome} <{$email}>\nSubject: {$assunto}\n\n{$corpo}");
  file_put_contents("{$destino}/{$stamp}-autoresposta.txt",
    "To: {$email}\nSubject: {$autoAssunto}\n\n{$autoCorpo}");
  return;
}

require_once $cfg['varDir'] . '/../phpmailer/src/PHPMailer.php';
require_once $cfg['varDir'] . '/../phpmailer/src/SMTP.php';
require_once $cfg['varDir'] . '/../phpmailer/src/Exception.php';

function enviaSmtp(array $cfg, string $para, string $assunto, string $corpo, ?array $replyTo, ?string $bcc): bool {
  $m = new PHPMailer\PHPMailer\PHPMailer(true);
  try {
    $m->isSMTP();
    $m->Host = $cfg['smtpHost'];
    $m->Port = (int)$cfg['smtpPort'];
    $m->SMTPAuth = true;
    $m->Username = $cfg['smtpUser'];
    $m->Password = $cfg['smtpPass'];
    $m->SMTPSecure = (int)$cfg['smtpPort'] === 465 ? 'ssl' : 'tls';
    $m->CharSet = 'UTF-8';
    $m->setFrom($cfg['from'], $cfg['fromName']);
    $m->addAddress($para);
    if ($bcc) { $m->addBCC($bcc); }
    if ($replyTo) { $m->addReplyTo($replyTo[0], $replyTo[1]); }
    $m->Subject = $assunto;
    $m->Body = $corpo;   // texto puro: chega inteiro em qualquer cliente
    $m->send();
    return true;
  } catch (Throwable $e) {
    @file_put_contents($cfg['varDir'] . '/erros.log',
      date('c') . " {$para}: " . $e->getMessage() . "\n", FILE_APPEND | LOCK_EX);
    return false;
  }
}

// O e-mail de venda é o que importa. Se ele falhar, o visitante tem de saber.
if (!enviaSmtp($cfg, $cfg['to'], $assunto, $corpo, [$email, $nome], $cfg['bcc'] ?: null)) {
  http_response_code(500);
  exit('envio');
}

// Auto-resposta é cortesia. Falhar aqui NÃO derruba a submissão — o pedido
// já está na caixa de quem vende, e é ela que fecha a venda.
if ($autoCorpo !== '') {
  enviaSmtp($cfg, $email, $autoAssunto, $autoCorpo, null, null);
}
```

- [ ] **Step 4: Ampliar a suíte**

Em `tools/testa-endpoint.mjs`, ajustar `enviados()` e acrescentar, dentro do `try`, depois do bloco 1:

```js
  // 1b. Auto-resposta
  const auto = enviados().find((f) => f.endsWith('-autoresposta.txt'));
  ok('gravou a auto-resposta', Boolean(auto), enviados().join());
  const ar = readFileSync(join(varDir, 'enviados', auto), 'utf8');
  ok('auto-resposta vai para o visitante', ar.includes('To: ana@example.com'));
  ok('auto-resposta no idioma do visitante', ar.includes('Ihre Nachricht ist angekommen'));
  ok('auto-resposta trata pelo nome', ar.includes('Hallo, Ana Silva!'));
  ok('auto-resposta promete 24 horas', ar.includes('24 Stunden'));
  ok('auto-resposta NÃO ecoa o texto do visitante',
     !ar.includes('Wir möchten im März kommen.'), 'eco = relay de spam');
  ok('auto-resposta não vaza o destino comercial', !ar.includes('gabriela@'));
```

E no bloco 1, substituir as três linhas que localizam o e-mail:

```js
  const arqs = enviados();
  ok('gravou exatamente um e-mail', arqs.length === 1, `gravou ${arqs.length}`);
  const email = readFileSync(join(varDir, 'enviados', arqs[0]), 'utf8');
```

por:

```js
  const arqs = enviados();
  ok('gravou os dois e-mails', arqs.length === 2, `gravou ${arqs.length}: ${arqs.join()}`);
  const arqVenda = arqs.find((f) => f.endsWith('-gabriela.txt'));
  ok('gravou o e-mail de venda', Boolean(arqVenda), arqs.join());
  const email = readFileSync(join(varDir, 'enviados', arqVenda), 'utf8');
```

Nos blocos 3, 4 e 6, `enviados().length === 0` continua valendo sem mudança. No bloco 7 e no 8, trocar `enviados()[0]` por `enviados().find((f) => f.endsWith('-gabriela.txt'))`.

- [ ] **Step 5: Rodar**

Run: `npm run i18n:check && npm run build && npm run form:check`
Expected: tudo `ok`, incluindo os seis casos novos.

- [ ] **Step 6: Documentar o que só existe no servidor**

Criar `docs/deploy-formulario.md` com: onde fica `va-config.php` (`/home/USUARIO/`), onde fica o PHPMailer (`/home/USUARIO/phpmailer/`), como criar `site@vilaarapiuns.com.br`, como conferir SPF/DKIM, como fazer o primeiro envio de teste com `dryRun` ligado no servidor antes de desligar, e onde ficam `erros.log` e o contador de limite.

- [ ] **Step 7: Commit**

```bash
git add public/enviar-mail.php src/i18n/ tools/ package.json docs/deploy-formulario.md
git commit -m "Envio real: SMTP autenticado, auto-resposta e BCC de segurança

A auto-resposta lê a copy dos mesmos dicionários do site, copiados para
dist/_i18n/ no build. A alternativa era escrever a mesma copy uma segunda
vez dentro do PHP — e ela carrega a promessa das 24 horas, que não pode
existir em duas versões divergentes.

Nada que o visitante digitou é ecoado na auto-resposta, só o nome no
vocativo. Conteúdo do usuário mandado de volta para endereço do usuário é
uma máquina de spam com o nosso domínio na assinatura.

Falha na auto-resposta não derruba a submissão: o pedido já está na caixa de
quem vende, e é ela que fecha a venda. Falha no e-mail de venda, sim."
```

---

### Task 7: O formulário, com POST nativo

Sem JS ainda. O gate é: **funciona com script desligado**.

**Files:**
- Create: `src/components/FormularioReserva.astro`
- Modify: `src/content-pages/Reservar.astro`
- Modify: os cinco dicionários (bloco `form`)

**Interfaces:**
- Consumes: `POST /enviar.php` (Tarefas 5–6); os slugs de `bookSent` (Tarefa 4).
- Produces: `<FormularioReserva locale={locale} />`. IDs estáveis para a Tarefa 8: `#form-reserva`, `#form-resultado`, `[data-erro="<campo>"]`, `#form-ano-wrap`.

- [ ] **Step 1: Bloco `form` em `pt.json`**

```json
  "form": {
    "titulo": "Ou escreva por aqui",
    "intro": "Sem WhatsApp, sem app, sem cadastro. Os campos com «obrigatório» são os únicos de que precisamos.",
    "nome": "Seu nome",
    "email": "Seu e-mail",
    "whatsapp": "WhatsApp ou telefone",
    "quando": "Quando você pensa em vir",
    "mes": "Mês",
    "ano": "Ano",
    "flexivel": "Ainda não sei",
    "pessoas": "Quantas pessoas",
    "interesse": "O que te interessa",
    "mensagem": "Alguma coisa que a gente deva saber",
    "obrigatorio": "obrigatório",
    "opcional": "opcional",
    "escolha": "Escolha",
    "enviar": "Enviar pedido",
    "enviando": "Enviando…",
    "sucessoT": "Sua mensagem chegou",
    "sucessoD": "Respondemos em até 24 horas, no idioma em que você escreveu.",
    "erroGeral": "Não conseguimos enviar. Tente de novo, ou fale no WhatsApp.",
    "erroCampos": "Confira os campos marcados.",
    "meses": ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],
    "interesses": {
      "pousada": "Pousada — só a estadia",
      "pacote": "Pacote saindo de Alter do Chão",
      "privativa": "Villa privativa para um grupo",
      "naosei": "Ainda estou decidindo"
    },
    "erro": {
      "obrigatorio": "Precisamos deste campo.",
      "invalido": "Confira este campo.",
      "longo": "Ficou longo demais.",
      "opcao": "Escolha uma das opções."
    }
  },
```

Traduzir o bloco inteiro para `en`, `es` (usted), `de` (Sie) e `ja`, mantendo **exatamente as mesmas chaves** e os 12 meses em cada `meses`. Glossário fixo, para não divergir do resto do site: *pousada* = `lodge` / `posada` / `Lodge` / ロッジ; *pacote* = `package` / `paquete` / `Paket` / パッケージ; *Alter do Chão* nunca se traduz. `npm run i18n:check` é o gate — ele acusa chave faltante e lista de tamanho diferente.

- [ ] **Step 2: O componente**

Criar `src/components/FormularioReserva.astro`:

```astro
---
/**
 * FORMULÁRIO DE RESERVA — <form> nativo, JS é só melhoria.
 *
 * Dá POST em /enviar.php, um arquivo PHP que Astro copia de public/ para
 * dist/ sem tocar. Com script desligado o navegador submete, o PHP responde
 * 303 e o visitante cai na página de enviado do idioma dele. O JS da Tarefa
 * 8 troca isso por confirmação na própria página — mas o caminho de baixo
 * continua inteiro, e é ele que o teste sem JS exercita.
 *
 * Nada de React: o projeto mantém uma island só (CarrosselHero), de
 * propósito. Um <script> inline não custa hidratação nenhuma.
 *
 * `mes` aceita 1–12 ou "flexivel". Quando é "flexivel" o ano não importa —
 * o JS esconde o select, e sem JS ele aparece e o servidor ignora o valor.
 * A lista de anos é gerada no BUILD e corrigida no cliente; sem JS e sem
 * rebuild ela envelhece, o que é aceitável num campo aproximado por
 * definição.
 */
import { useTranslations, useList } from '@/i18n/utils';
import { SITE } from '@/data/site';
import type { Locale } from '@/i18n/config';

interface Props { locale: Locale }
const { locale } = Astro.props;
const t = useTranslations(locale);
const tList = useList(locale);

const meses = tList<string>('form.meses');
const anoBase = new Date().getFullYear();
const anos = [anoBase, anoBase + 1, anoBase + 2];
const interesses = ['pousada', 'pacote', 'privativa', 'naosei'] as const;
const pessoas = ['1', '2', '3-6', '7-14', '15-26'] as const;
---

<div id="formulario">
  <h2 class="font-display text-secao">{t('form.titulo')}</h2>
  <p class="mt-3 max-w-prose">{t('form.intro')}</p>

  <form
    id="form-reserva"
    method="post"
    action="/enviar.php"
    class="mt-8 grid gap-5"
  >
    <input type="hidden" name="idioma" value={locale} />
    {/* Armadilha. Fica fora do fluxo mas NÃO com display:none — leitor de
        tela ignora por aria-hidden e tabindex, e bot preenche. */}
    <div class="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
      <label for="form-hp">Não preencha</label>
      <input type="text" id="form-hp" name="_hp" tabindex="-1" autocomplete="off" />
    </div>
    <input type="hidden" name="_t" id="form-t" value="" />

    <div class="grid gap-5 sm:grid-cols-2">
      <p class="grid gap-1.5">
        <label for="f-nome" class="etiqueta">{t('form.nome')} <span class="opacity-70">({t('form.obrigatorio')})</span></label>
        <input type="text" id="f-nome" name="nome" required maxlength="80" autocomplete="name"
               aria-describedby="e-nome" class="campo-form" />
        <span id="e-nome" data-erro="nome" class="meta texto-erro" hidden></span>
      </p>

      <p class="grid gap-1.5">
        <label for="f-email" class="etiqueta">{t('form.email')} <span class="opacity-70">({t('form.obrigatorio')})</span></label>
        <input type="email" id="f-email" name="email" required maxlength="120" autocomplete="email"
               aria-describedby="e-email" class="campo-form" />
        <span id="e-email" data-erro="email" class="meta texto-erro" hidden></span>
      </p>

      <p class="grid gap-1.5">
        <label for="f-whatsapp" class="etiqueta">{t('form.whatsapp')} <span class="opacity-70">({t('form.opcional')})</span></label>
        <input type="tel" id="f-whatsapp" name="whatsapp" maxlength="20" autocomplete="tel"
               aria-describedby="e-whatsapp" class="campo-form" />
        <span id="e-whatsapp" data-erro="whatsapp" class="meta texto-erro" hidden></span>
      </p>

      <p class="grid gap-1.5">
        <label for="f-pessoas" class="etiqueta">{t('form.pessoas')} <span class="opacity-70">({t('form.obrigatorio')})</span></label>
        <select id="f-pessoas" name="pessoas" required aria-describedby="e-pessoas" class="campo-form">
          <option value="">{t('form.escolha')}</option>
          {pessoas.map((p) => <option value={p}>{p}</option>)}
        </select>
        <span id="e-pessoas" data-erro="pessoas" class="meta texto-erro" hidden></span>
      </p>
    </div>

    <fieldset class="grid gap-1.5">
      <legend class="etiqueta">{t('form.quando')} <span class="opacity-70">({t('form.obrigatorio')})</span></legend>
      <div class="flex flex-wrap gap-3">
        <span class="grid gap-1.5">
          <label for="f-mes" class="sr-only">{t('form.mes')}</label>
          <select id="f-mes" name="mes" required aria-describedby="e-mes" class="campo-form">
            <option value="">{t('form.escolha')}</option>
            {meses.map((m, i) => <option value={String(i + 1)}>{m}</option>)}
            <option value="flexivel">{t('form.flexivel')}</option>
          </select>
        </span>
        <span id="form-ano-wrap" class="grid gap-1.5">
          <label for="f-ano" class="sr-only">{t('form.ano')}</label>
          <select id="f-ano" name="ano" class="campo-form">
            {anos.map((a) => <option value={String(a)}>{a}</option>)}
          </select>
        </span>
      </div>
      <span id="e-mes" data-erro="mes" class="meta texto-erro" hidden></span>
      <span id="e-ano" data-erro="ano" class="meta texto-erro" hidden></span>
    </fieldset>

    <p class="grid gap-1.5">
      <label for="f-interesse" class="etiqueta">{t('form.interesse')} <span class="opacity-70">({t('form.opcional')})</span></label>
      <select id="f-interesse" name="interesse" aria-describedby="e-interesse" class="campo-form">
        <option value="">{t('form.escolha')}</option>
        {interesses.map((k) => <option value={k}>{t(`form.interesses.${k}`)}</option>)}
      </select>
      <span id="e-interesse" data-erro="interesse" class="meta texto-erro" hidden></span>
    </p>

    <p class="grid gap-1.5">
      <label for="f-mensagem" class="etiqueta">{t('form.mensagem')} <span class="opacity-70">({t('form.opcional')})</span></label>
      <textarea id="f-mensagem" name="mensagem" rows="4" maxlength="2000"
                aria-describedby="e-mensagem" class="campo-form"></textarea>
      <span id="e-mensagem" data-erro="mensagem" class="meta texto-erro" hidden></span>
    </p>

    <p class="mt-2">
      <button type="submit" class="btn btn-primario">{t('form.enviar')}</button>
    </p>

    <div id="form-resultado" role="status" aria-live="polite" tabindex="-1" hidden></div>
  </form>
</div>
```

Acrescentar em `src/styles/global.css`, junto das outras `@utility`, **um bloco por utilitário** (o padrão do arquivo é um `@utility` com aninhados `&:` dentro, como `btn-primario` — dois blocos com o mesmo nome fazem o segundo sobrescrever o primeiro):

```css
/* Campo de formulário: o btn-secundario aplicado a entrada de texto.
   Transparente sobre o chão escuro, com o filete de embutido na borda.
   NENHUMA cor nova entra na paleta, e isso é deliberado: cada token deste
   tema carrega razão de contraste medida no comentário, então inventar um
   vermelho de erro obrigaria a auditar a paleta de novo. O anel de foco
   global (--anel-foco, palha, 8,5:1 sobre breu) já vale aqui sem override,
   e o erro usa a terracota clara que o tema já mede em 4,6:1 como TEXTO. */
@utility campo-form {
  width: 100%;
  min-height: 3rem;
  background-color: color-mix(in srgb, var(--color-creme) 6%, transparent);
  color: var(--color-creme);
  border: 1px solid var(--cor-emenda);
  border-radius: 0;   /* marchetaria não tem raio */
  padding: 0.75rem 0.875rem;
  font-family: var(--font-sans);
  font-size: 1rem;
  &::placeholder { color: color-mix(in srgb, var(--color-salvia) 70%, transparent); }
}

/* Erro nunca é comunicado só por cor: vem com texto e com aria-invalid. */
@utility texto-erro {
  color: var(--color-terra-luz);
}
```

**Atenção ao tema.** O site é escuro (`color-scheme: dark`, corpo em `--color-mata-funda`). Campo com fundo creme e texto verde — que seria o natural num site claro — exigiria sobrescrever `--anel-foco` localmente, porque o anel global é creme e desapareceria sobre creme. O campo transparente evita isso inteiro.

- [ ] **Step 3: Pôr na página Reservar**

Em `src/content-pages/Reservar.astro`, reescrever o comentário de cabeçalho:

```astro
/**
 * RESERVAR — uma conversa, não um checkout.
 *
 * Dois caminhos, de propósito: o WhatsApp, que é mais rápido e é onde a
 * venda acontece hoje; e o formulário, para quem não usa WhatsApp, está num
 * fuso em que ninguém responde, ou prefere escrever com calma em outro
 * idioma. Motor de reserva continua não existindo, e a copy continua dizendo
 * isso.
 *
 * O formulário dá POST em /enviar.php e funciona com JavaScript desligado.
 */
```

Importar `FormularioReserva` e `telefoneLegivel`, e depois do bloco de Instagram acrescentar:

```astro
          <p class="numero etiqueta mt-4">
            <a href={`tel:+${SITE.contact.whatsapp}`} class="link-texto">{telefoneLegivel()}</a>
          </p>
```

E no fim da coluna da direita, depois da `<figure>`:

```astro
        <div class="emenda mt-14 border-t pt-10">
          <FormularioReserva locale={locale} />
        </div>
```

- [ ] **Step 4: Gates**

```bash
npm run i18n:check && npm run check && npm run build && npm run contato:check
node tools/classes-fantasma.mjs $(find dist -name 'index.html' -path '*reservar*')
```
Expected: os quatro sem erro, e nenhuma classe fantasma — `campo-form` e `texto-erro` têm de ter regra no CSS.

- [ ] **Step 5: Provar o caminho SEM JavaScript**

```bash
npm run form:check          # a suíte não usa navegador: já é o caminho sem JS
php -S localhost:4322 -t dist &
```

Depois, no navegador, com **JavaScript desligado** (Safari: Desenvolvedor → Desativar JavaScript), abrir `http://localhost:4322/pt/reservar/`, preencher e enviar.

Expected: o navegador aterrissa em `/pt/reservar/enviado/`, e o e-mail aparece em `enviados/` do `varDir` configurado. Repetir em `/de/buchen/` → aterrissa em `/de/buchen/gesendet/`.

- [ ] **Step 6: Conferir acessibilidade a mão**

Com JS ligado, na página `/pt/reservar/`: navegar o formulário inteiro **só com Tab**, confirmando que todo campo anuncia seu rótulo e que o foco fica visível; e conferir que o campo-armadilha `_hp` não recebe foco.

- [ ] **Step 7: Commit**

```bash
git add src/components/FormularioReserva.astro src/content-pages/Reservar.astro \
        src/i18n/ src/styles/global.css
git commit -m "Formulário de reserva na página Reservar, POST nativo

<form method=post> de verdade: funciona com JavaScript desligado, e é esse
o caminho que a suíte exercita. O JS vem depois e é só melhoria.

Sem React — o projeto mantém uma island só, de propósito.

A armadilha de bot fica fora da tela por posicionamento e não por
display:none, com aria-hidden e tabindex=-1: leitor de tela e teclado
ignoram, bot preenche."
```

---

### Task 8: Melhoria progressiva

**Files:**
- Modify: `src/components/FormularioReserva.astro` (só o `<script>` no fim)

**Interfaces:**
- Consumes: os IDs da Tarefa 7; os códigos de erro da Tarefa 5; `form.erro.*` do dicionário.
- Produces: nada para tarefas seguintes.

- [ ] **Step 1: O script**

No fim de `src/components/FormularioReserva.astro`, depois do `</div>` de fechamento:

```astro
{/* define:vars já implica script inline no Astro — não somar `is:inline`. */}
<script define:vars={{
  textos: {
    enviando: t('form.enviando'),
    enviar: t('form.enviar'),
    sucessoT: t('form.sucessoT'),
    sucessoD: t('form.sucessoD'),
    erroGeral: t('form.erroGeral'),
    erroCampos: t('form.erroCampos'),
    erro: {
      obrigatorio: t('form.erro.obrigatorio'),
      invalido: t('form.erro.invalido'),
      longo: t('form.erro.longo'),
      opcao: t('form.erro.opcao'),
    },
  },
}}>
  (function () {
    var form = document.getElementById('form-reserva');
    if (!form) return;
    var resultado = document.getElementById('form-resultado');
    var botao = form.querySelector('button[type=submit]');

    // _t é o horário do CARREGAMENTO. A página é estática: um valor vindo do
    // build seria o horário do build, e a checagem de tempo mínimo do
    // servidor nunca dispararia. Sem JS ele fica vazio, e o servidor então
    // pula essa checagem em vez de barrar quem não tem script.
    document.getElementById('form-t').value = String(Math.floor(Date.now() / 1000));

    // A lista de anos vem do build. Reescrever no cliente é o que impede que
    // ela envelheça num site estático que pode ficar meses sem rebuild.
    var ano = document.getElementById('f-ano');
    var atual = new Date().getFullYear();
    if (ano && Number(ano.options[0].value) !== atual) {
      ano.innerHTML = '';
      for (var i = 0; i < 3; i++) {
        var o = document.createElement('option');
        o.value = o.textContent = String(atual + i);
        ano.appendChild(o);
      }
    }

    // Mês flexível não tem ano para escolher.
    var mes = document.getElementById('f-mes');
    var anoWrap = document.getElementById('form-ano-wrap');
    function sincronizaAno() {
      anoWrap.hidden = mes.value === 'flexivel' || mes.value === '';
    }
    mes.addEventListener('change', sincronizaAno);
    sincronizaAno();

    function limpaErros() {
      form.querySelectorAll('[data-erro]').forEach(function (s) {
        s.hidden = true;
        s.textContent = '';
        var campo = form.elements[s.getAttribute('data-erro')];
        if (campo) campo.removeAttribute('aria-invalid');
      });
    }

    function mostraErros(erros) {
      var primeiro = null;
      Object.keys(erros).forEach(function (nome) {
        var span = form.querySelector('[data-erro="' + nome + '"]');
        var campo = form.elements[nome];
        if (!span) return;
        span.textContent = textos.erro[erros[nome]] || textos.erro.invalido;
        span.hidden = false;
        if (campo) { campo.setAttribute('aria-invalid', 'true'); primeiro = primeiro || campo; }
      });
      resultado.hidden = false;
      resultado.className = 'meta texto-erro';
      resultado.textContent = textos.erroCampos;
      if (primeiro) primeiro.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      limpaErros();
      botao.disabled = true;
      botao.textContent = textos.enviando;

      fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.j && res.j.ok) {
            // Trocar o formulário pela confirmação: deixá-lo na tela convida
            // a mandar de novo, e envio duplicado gasta o tempo de quem vende.
            form.innerHTML = '';
            resultado.hidden = false;
            resultado.className = 'emenda border-t pt-6';
            resultado.innerHTML =
              '<p class="etiqueta">' + textos.sucessoT + '</p>' +
              '<p class="mt-2">' + textos.sucessoD + '</p>';
            form.appendChild(resultado);
            resultado.focus();
            return;
          }
          if (res.j && res.j.erros && Object.keys(res.j.erros).length) { mostraErros(res.j.erros); }
          else { throw new Error('sem detalhe'); }
        })
        .catch(function () {
          resultado.hidden = false;
          resultado.className = 'meta texto-erro';
          resultado.textContent = textos.erroGeral;
          resultado.focus();
        })
        .finally(function () {
          if (botao.isConnected) { botao.disabled = false; botao.textContent = textos.enviar; }
        });
    });
  })();
</script>
```

- [ ] **Step 2: Gates automáticos**

```bash
npm run check && npm run build && npm run form:check && npm run contato:check
```
Expected: os quatro sem erro. `form:check` continua verde: ele não usa navegador, então exercita o caminho sem JS, que não pode ter regredido.

- [ ] **Step 3: Verificar no navegador, com JS ligado**

```bash
php -S localhost:4322 -t dist
```

Em `http://localhost:4322/pt/reservar/`, conferir um por um:

1. Enviar vazio → erros inline em nome, e-mail, mês e pessoas; foco vai para o campo de nome; **a URL não muda**.
2. `nome@@errado` no e-mail → erro só nesse campo.
3. Escolher "Ainda não sei" no mês → o select de ano desaparece; escolher "março" → volta.
4. Envio válido → o formulário é substituído pela confirmação, sem trocar de página, e o e-mail aparece em `enviados/`.
5. Conferir no inspetor que `_t` deixou de estar vazio.
6. Ler o resultado com leitor de tela (VoiceOver: Cmd+F5) → a região `aria-live` anuncia sucesso e erro.
7. Em `/ja/book/`, repetir o item 1 → as mensagens de erro saem em japonês.

- [ ] **Step 4: Commit**

```bash
git add src/components/FormularioReserva.astro
git commit -m "Melhoria progressiva do formulário: erro inline e sucesso na página

O servidor devolve CÓDIGO de erro, não texto; o texto sai do dicionário no
idioma do visitante. É o que mantém o PHP ignorante de i18n.

Dois valores que só o cliente pode saber num site estático: _t, o horário do
carregamento (vindo do build seria o horário do build, e a defesa de tempo
mínimo nunca dispararia), e a lista de anos, que reescrita no cliente não
envelhece se o site ficar meses sem rebuild.

No sucesso o formulário sai da tela: deixá-lo ali convida a mandar de novo, e
envio duplicado gasta o tempo de quem vende."
```

---

### Task 9: Fechamento — verificação de ponta a ponta

**Files:** nenhum, exceto correção do que aparecer.

- [ ] **Step 1: Suíte inteira do zero**

```bash
rm -rf dist && npm run i18n:check && npm run check && npm run build \
  && npm run contato:check && npm run form:check \
  && node tools/classes-fantasma.mjs $(find dist -name 'index.html') \
  && node tools/contraste-dom.mjs
```
Expected: tudo verde.

- [ ] **Step 2: Varredura do número retirado no repositório inteiro**

```bash
grep -rn "5511969760096\|96976-0096" src public docs *.mjs *.json | grep -v "specs/\|plans/" || echo "OK: só em spec e plano, como registro histórico"
```

- [ ] **Step 3: Varredura de segredo**

```bash
git status --short
git log --oneline main..HEAD
git diff main..HEAD -- . | grep -niE "smtpPass' => '.+|password|senha:" || echo "OK: nenhum segredo no diff"
ls dist/va-config.php 2>/dev/null && echo "PROBLEMA: config no webroot" || echo "OK: config fora do dist"
```

- [ ] **Step 4: Conferência de conteúdo nos cinco idiomas**

Para cada `pt en es de ja`: abrir `/{l}/{slug de book}/` e confirmar que o formulário está traduzido inteiro, sem chave crua na tela (`form.` aparecendo literalmente significa chave faltando), e que a página de enviado do idioma existe.

```bash
for l in pt en es de ja; do echo "-- $l"; grep -o 'form\.[a-z]*' dist/$l/*/index.html | sort -u | head; done
```
Expected: nenhuma saída — chave crua no HTML é chave não resolvida.

- [ ] **Step 5: Relatar ao Carlos e PARAR**

Subir `php -S localhost:4322 -t dist`, entregar a URL, e listar: o que mudou, o que ele precisa fazer no servidor (`docs/deploy-formulario.md`), e que **nada foi publicado**. Não fazer push. Não fazer deploy.

---

## Auto-revisão do plano

**Cobertura do spec** — cada seção tem tarefa: dado e propagação → T2; formulário e campos → T7; endpoint e as 7 defesas → T5; credenciais fora do repo → T5 passo 1–2; e-mail para quem vende → T5 passo 3; auto-resposta → T6; BCC → T6; página de enviado, noindex, sitemap → T4; i18n nos cinco → T3, T4, T6, T7; teste local com `dryRun` → T5, T6; os 11 casos de teste do spec → T5 passo 4 (todos, um a um); 24h como compromisso → T3, T4, T6.

**Achados fora do spec, incorporados:** a copy que negava o formulário (T3) e o `php` ausente na máquina (pré-requisito).

**Consistência de nomes** conferida ponta a ponta: `_hp`, `_t`, `mes`, `ano`, `pessoas`, `interesse`, `idioma`; códigos `obrigatorio`/`invalido`/`longo`/`opcao`; `NOINDEX_KEYS`, `caminhosNoindex()`, `telefoneLegivel()`, `indexavel`; IDs `#form-reserva`, `#form-resultado`, `#form-ano-wrap`, `[data-erro]`; `varDir`, `dryRun`.

**Duas coisas que só se verificam no deploy**, e o plano não finge o contrário: a entrega real por SMTP (local roda em `dryRun`) e o alinhamento de SPF/DKIM. Ambas em `docs/deploy-formulario.md`.
