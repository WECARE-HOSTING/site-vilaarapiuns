# Contato comercial único + formulário de reserva por e-mail

**Data:** 21/08/2026
**Status:** aprovado. Sem pendências de cliente.

## Problema

Duas coisas, decididas na mesma conversa e implementadas juntas porque a segunda
depende do dado da primeira.

**1. O contato comercial mudou.** Todo contato de venda da Villa Arapiuns passa a
ser com a Gabriela: `+55 47 99206-7078` e, por e-mail, o alias de função
`reservas@vilaarapiuns.com.br`, que encaminha para ela. O site
hoje publica `+55 11 96976-0096` — o número do panfleto — em sete CTAs, no rodapé
e no `telephone` do JSON-LD. Esse número sai do site inteiro.

**2. O site não tem formulário.** O único caminho de contato é WhatsApp. Quem não
usa WhatsApp, quem está num fuso em que ninguém responde, ou quem prefere escrever
com calma em outro idioma, não tem por onde falar com a Villa. O comentário no topo
de `src/content-pages/Reservar.astro` registra que a ausência era deliberada — não
se prometia canal que não existia. Agora o canal vai existir.

## Decisões tomadas

| Questão | Decisão |
|---|---|
| Número antigo do panfleto | Sai do site inteiro. Gabriela é canal único. |
| Escopo do formulário | Pedido de reserva com **datas aproximadas** (mês/ano, não calendário) |
| Como o e-mail é enviado | Endpoint **PHP no próprio cPanel**, SMTP autenticado |
| Auto-resposta ao visitante | **Sim**, template 100% fixo |
| Cópia de segurança | **BCC** para um segundo endereço |
| Nomear a Gabriela no site | **Não.** Copy segue impessoal, como hoje |
| Gabriela do depoimento da home | **Pessoa diferente.** Depoimento fica intocado |
| Prazo de resposta | **24 horas**, confirmado pelo Carlos |
| Endereço do BCC | `carlos@wecarehosting.com.br` |
| Caixa remetente | `site@vilaarapiuns.com.br` |
| Destino do formulário | `reservas@vilaarapiuns.com.br` — **alias de função**, encaminha para a Gabriela |

## Arquitetura

### Camada de dado — `src/data/site.ts`

```ts
contact: {
  /** Contato comercial ÚNICO. Confirmado por Carlos em 21/08/2026. */
  whatsapp: '5547992067078',
  /** Destino do formulário e do link de e-mail no rodapé. */
  email: 'reservas@vilaarapiuns.com.br',
  instagram: '@villaarapiuns',
}
```

Trocar esses dois valores propaga sozinho para:

- os **7 CTAs de WhatsApp** (Home, Pacotes, Privativa, Chegar, Reservar,
  Avaliações, Footer) — todos chamam `whatsappUrl()`, que lê de `SITE`;
- o **rodapé**, cujo bloco de e-mail está pronto e desligado por
  `SITE.contact.email &&` em `src/components/Footer.astro:30`;
- o **`telephone` do JSON-LD** em `src/layouts/BaseLayout.astro:59`, que já é
  `` `+${SITE.contact.whatsapp}` ``.

Nenhum componente muda para isso acontecer. É o design existente funcionando.

Acrescentar a `site.ts`:

```ts
/** Formata o WhatsApp para leitura: 5547992067078 → +55 47 99206-7078 */
export function telefoneLegivel(): string
```

Exibido no **rodapé** (ao lado do e-mail que passa a acender) e na **página
Reservar**, junto do formulário. Número visível gera mais confiança que só um botão
verde; derivar dos mesmos dígitos evita duas fontes divergirem.

Sai do arquivo o comentário `PENDENTE: e-mail de destino do formulário de reserva`.

E o comentário de cabeçalho de `src/content-pages/Reservar.astro` — *"não há motor
de reserva: o site não promete canal que não existe"* — precisa ser reescrito na
mesma passada. Ele documentava uma decisão que esta mudança reverte; deixá-lo lá
faz o arquivo mentir sobre si mesmo para quem chegar depois.

### Componente — `src/components/FormularioReserva.astro`

`<form method="post" action="/enviar.php">` nativo. **Funciona com JS desligado.**
O JS é melhoria progressiva: valida em tempo real, envia por `fetch`, mostra o
sucesso sem trocar de página. Sem React — o projeto mantém React em uma island só
(`CarrosselHero.tsx`), de propósito; um `<script>` inline não custa hidratação.

| Campo | `name` | Tipo | Obrigatório | Validação |
|---|---|---|---|---|
| Nome | `nome` | text | sim | 2–80 caracteres |
| E-mail | `email` | email | sim | `FILTER_VALIDATE_EMAIL` |
| WhatsApp | `whatsapp` | tel | não | dígitos, `+`, espaço, `-`, `()`; 8–20 |
| Mês | `mes` | select | sim | `1`–`12` ou `flexivel` |
| Ano | `ano` | select | condicional | ano do build, +1, +2. Com JS, escondido quando `mes=flexivel`; sem JS aparece sempre e o servidor ignora o valor nesse caso |
| Pessoas | `pessoas` | select | sim | `1`, `2`, `3-6`, `7-14`, `15-26` |
| Interesse | `interesse` | select | não | `pousada`, `pacote`, `privativa`, `naosei` |
| Mensagem | `mensagem` | textarea | não | até 2000 caracteres |

Ocultos: `idioma` (locale da página), `_hp` (honeypot), `_t` (timestamp).

**Cuidado com o `_t`:** a página é *estática*. Um timestamp renderizado no build
seria o horário do build, não o do carregamento — e a checagem de tempo mínimo
nunca dispararia, porque toda submissão pareceria ter levado semanas. O `_t` é
preenchido por **JS no carregamento**. Sem JS ele vem vazio, e o servidor então
**pula** a checagem de tempo em vez de rejeitar: quem está sem JS não é bot por
isso. As outras quatro defesas continuam valendo nesse caminho.

**Por que mês+ano e não `<input type="month">`:** Safari e Firefox não implementam
`type=month` e degradam para campo de texto sem nenhuma pista. Boa parte do público
é internacional e em iPhone. Mês vem do dicionário e traduz de graça nos cinco
idiomas; ano é lista de 3 anos gerada no build.

**Limite conhecido e aceito:** a lista de anos é gerada no build. Três linhas de JS
a reescrevem no cliente a partir de `new Date().getFullYear()`. Sem JS, e se o site
passar anos sem rebuild, a lista envelhece. Aceito: um deploy por ano resolve, e o
campo é aproximado por definição.

**Acessibilidade:** `<label for>` em todo campo; `autocomplete` correto (`name`,
`email`, `tel`); erro ligado por `aria-describedby`; resultado em região
`aria-live="polite"`; foco vai para o primeiro campo com erro ou para a mensagem de
sucesso. Obrigatoriedade dita em palavra, não apenas com asterisco.

**Onde aparece:** só na página Reservar, ao lado do WhatsApp. O WhatsApp segue como
CTA primário — conversa é mais rápida —; o formulário é a alternativa. Os outros 6
CTAs do site continuam como estão.

### Endpoint — `public/enviar.php`

Astro copia `public/` para `dist/` sem tocar. `public/enviar.php` vira
`dist/enviar.php` e sobe por FTP com o resto do site.

Ordem das defesas, e nenhuma é decorativa:

1. **Só POST.** Outro método → `405`.
2. **`Origin`/`Referer` do próprio domínio.** Senão `403`.
3. **Honeypot.** `_hp` preenchido → responde `200 ok` e descarta em silêncio. Não
   se avisa o bot do que ele errou.
4. **Tempo mínimo.** `now - _t < 3s` → mesmo tratamento.
5. **Limite por IP.** 5 por hora, 20 por dia. Contador em arquivo fora do webroot.
6. **Validação com lista branca** em todo select. Valor fora da lista é rejeitado,
   nunca ecoado. Comprimento máximo em todo campo de texto.
7. **Remoção de CR/LF** de nome, e-mail e assunto. Esta é *a* vulnerabilidade
   clássica de form-to-mail em PHP: injeção de cabeçalho é o que transforma o
   servidor em relay de spam de terceiro.
8. **Envio** por SMTP autenticado (PHPMailer), `From: site@vilaarapiuns.com.br`,
   `Reply-To:` no e-mail do visitante, `To:` a Gabriela, `Bcc:` o endereço de
   backup.
9. **Resposta.** `Accept: application/json` → JSON. Senão `303` para a página de
   enviado no idioma de origem.

**Erros como código, não como texto.** O PHP devolve `{"ok":false,"erros":{"email":"invalido"}}`.
O texto sai do dicionário, no idioma do visitante. O endpoint não precisa saber
cinco línguas — e essa é a fronteira que mantém o PHP pequeno.

### Credenciais — nunca no repositório

O repo é **público**. Nenhuma senha entra no git em nenhuma circunstância.

`enviar.php` lê `../va-config.php` — um nível **acima** do `public_html`, fora do
alcance do servidor web. O repo leva só `va-config.example.php`, com as chaves e
sem os valores:

```php
return [
  'smtpHost' => '', 'smtpPort' => 465, 'smtpUser' => '', 'smtpPass' => '',
  'from' => 'site@vilaarapiuns.com.br',
  'to' => 'reservas@vilaarapiuns.com.br',
  'bcc' => 'carlos@wecarehosting.com.br',
  'dryRun' => false,      // true = grava em arquivo em vez de enviar
  'logDir' => '',         // fora do webroot
];
```

Os três endereços ficam no config e não no código de propósito: trocar quem
recebe é editar um arquivo no servidor, sem rebuild e sem commit.

**PHPMailer mora no servidor**, ao lado do `va-config.php`, instalado uma vez —
não vendorizado no repo. Motivos: repo público não precisa carregar código de
terceiro, o webroot fica limpo, e o desenvolvimento local nunca precisa dele
(roda em `dryRun`). Se a instalação manual se mostrar chata na prática, a
alternativa é vendorizar em `public/_lib/phpmailer/` com um `.htaccess` de
`Require all denied`.

### O e-mail que a Gabriela recebe

Assunto: `[Villa Arapiuns] Ana Silva — 2 pessoas — março/2027`

Corpo em **texto puro** — chega inteiro em qualquer cliente e não cai em filtro de
imagem. Rótulos em português, que é a língua dela. E no topo, em destaque:

```
>>> Este visitante escreveu em Deutsch. Responda em alemão. <<<
```

Os valores de select chegam traduzidos para PT. A mensagem livre do visitante chega
**verbatim**, no idioma original — traduzir automaticamente seria inventar palavras
que ele não escreveu. Mais: página de origem, data e hora em Brasília, e o
`Reply-To` já apontando para ele, então responder é só apertar "responder".

### A auto-resposta ao visitante

E-mail curto no idioma dele, texto **100% fixo**, vindo do dicionário: recebemos,
**respondemos em até 24 horas**, e o WhatsApp se tiver pressa. Assinado
impessoalmente ("Equipe Villa Arapiuns") — coerente com a decisão de não nomear
ninguém no site.

**Nada que o visitante digitou é ecoado nessa mensagem.** Um formulário que manda
conteúdo controlado pelo usuário para um endereço controlado pelo usuário é uma
máquina de spam com o seu domínio na assinatura. O nome dele no vocativo é a única
exceção, e vai sanitizado.

Se o envio da auto-resposta falhar, **não falha a submissão** — o e-mail para a
Gabriela é o que importa, e a falha vai para o log.

### Página de "enviado"

Chave nova `bookSent` em `src/i18n/routes.ts`:

```
/pt/reservar/enviado/   /en/book/sent/   /es/reservar/enviado/
/de/buchen/gesendet/    /ja/book/sent/
```

Conteúdo curto: confirma, promete as 24 horas, oferece o WhatsApp como caminho
mais rápido, e um link de volta. Fora de `NAV_KEYS`, então não entra no menu.

Só o caminho **sem JS** passa por ela; com JS o sucesso é inline.

Duas mudanças de infra que ela exige:

- `BaseLayout` ganha `robots?: boolean`. Quando falso, emite
  `<meta name="robots" content="noindex, follow">` e **omite os hreflang** —
  alternates de idioma numa página noindex não servem para nada.
- O filtro do sitemap em `astro.config.mjs` hoje exclui `/styleguide` por string
  literal. Passa a excluir também os slugs de `bookSent`, derivados de uma
  constante `NOINDEX_KEYS` nova em `routes.ts` — uma fonte de verdade, em vez de
  cinco strings soltas na config.

### i18n

Aproximadamente 35 chaves novas (rótulos, opções de select, mensagens de erro,
sucesso, corpo da auto-resposta, página de enviado). Entram nos **cinco**
dicionários na mesma passada, conforme a regra de trabalho do projeto. Alemão e
espanhol seguem o tratamento formal já estabelecido ("Sie", "usted").

`nav.bookSent` e `desc.bookSent` são obrigatórias — `PageRenderer.astro` monta
título e description a partir delas para toda chave de página.

## Como testar localmente

`astro dev` não executa PHP. O caminho é:

```
npm run build
php -S localhost:4322 -t dist
```

Com `'dryRun' => true` no config, o endpoint **grava o e-mail em arquivo em vez de
enviar** — dá para testar de ponta a ponta sem nenhuma credencial de SMTP, e você
lê exatamente o que a Gabriela receberia.

Casos a verificar antes de aprovar:

- Envio válido nos 5 idiomas; o e-mail gravado traz o idioma certo no topo
- **JS desligado**: POST nativo funciona e cai na página de enviado do idioma certo
- E-mail inválido, nome vazio, mensagem de 3000 caracteres
- Honeypot preenchido → responde ok, nada é gravado
- Envio em menos de 3 segundos → mesma coisa
- 6º envio na mesma hora → bloqueado
- `Nome\r\nBcc: alguem@outro.com` no campo nome → CR/LF removidos, sem cabeçalho novo
- `mes=13`, `pessoas=99` → rejeitados pela lista branca
- Auto-resposta gravada, no idioma do visitante, sem eco do texto dele
- `+55 11 96976-0096` não aparece em `grep -r` nenhum do `dist`

## O que você precisa providenciar

1. Criar a caixa `site@vilaarapiuns.com.br` com senha, para o SMTP
2. Criar o alias `reservas@vilaarapiuns.com.br` encaminhando para `gabriela@wecarehosting.com.br`
3. PHP habilitado no plano
4. SPF e DKIM do domínio conferidos — o `Bcc:` vai para `@wecarehosting.com.br`,
   outro domínio, então o alinhamento importa para não cair em spam
5. PHPMailer e `va-config.php` instalados uma vez acima do `public_html`

As cinco estão do seu lado da cerca, sendo você a WeCare.

## Correção de 21/08/2026 — por que o e-mail é um alias e não a pessoa

A primeira versão deste spec mandava publicar `gabriela@wecarehosting.com.br`
direto. Um review na Tarefa 2 mostrou que isso **contradiz a decisão de copy
impessoal** tomada no mesmo dia: o rodapé renderiza o e-mail como texto visível,
então preencher esse campo punha o nome da pessoa em 51 páginas — exatamente o
que a decisão de não nomear quem atende existia para evitar.

O alias resolve os dois lados, e resolve melhor do que só esconder o endereço: o
motivo declarado da copy impessoal era que contato comercial troca de mão. Um
endereço pessoal publicado **morre** quando a pessoa sai, inclusive para o
hóspede antigo que salvou o contato. Um alias sobrevive à troca sem que nada no
site mude.

## As 24 horas são um compromisso operacional

O prazo aparece em **dois lugares e cinco idiomas**: a auto-resposta e a página de
enviado. Depois de publicado, é promessa — e promessa de prazo não cumprida é pior
que prazo nenhum, porque o visitante que espera 24h e não recebe nada não volta ao
WhatsApp, ele vai procurar outra pousada.

Duas consequências práticas: o prazo mora numa chave de dicionário e não em copy
solta, então revisar para cima ou para baixo é uma edição em cinco arquivos; e o
BCC para `carlos@` existe justamente para que o relógio não dependa de uma única
caixa de entrada estar sendo lida.

## Fora de escopo

- Motor de reserva, calendário de disponibilidade, pagamento online
- CAPTCHA. reCAPTCHA é terceiro e é assunto de GDPR num público europeu; honeypot
  + tempo + limite por IP é proporcional ao volume de uma pousada de 13 bangalôs
- Traduzir automaticamente a mensagem do visitante
- Os ~20–30 `alt` de imagem estática ainda em português (pendência conhecida,
  registrada em outro lugar)
- Deploy. Publicar é fase separada e só com ordem direta

## Riscos

| Risco | Mitigação |
|---|---|
| PHP indisponível ou restrito no plano | Verificar antes de escrever o endpoint. Se cair, o plano B é serviço de terceiro, já avaliado e recusado por LGPD |
| E-mail cai em spam da Gabriela | SMTP autenticado no domínio remetente + SPF/DKIM + texto puro + BCC de segurança |
| Lista de anos envelhece sem rebuild | Correção no cliente por JS; degradação aceita sem JS |
| Senha de SMTP vazar no repo público | Config fora do webroot, só o `.example` versionado. Verificar no `git diff` antes de qualquer commit |
| Formulário virar relay de spam | Auto-resposta com texto fixo, sanitização de CR/LF, honeypot, limite por IP |
