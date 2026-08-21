# Formulário de reserva — o que só existe no servidor

O site é estático (Astro → `dist/` → FTP). Os dois únicos arquivos com lógica
de servidor são `public/enviar.php` e `public/enviar-mail.php`, e eles
dependem de três coisas que **não** estão no repositório — que é público —
e que por isso precisam ser criadas à mão no cPanel a cada deploy novo de
servidor: a config, o PHPMailer, e a caixa `site@`.

## 0. O que o servidor respondeu em 21/08/2026, e a versão do PHP

Tudo nesta seção foi **medido** contra `https://vilaarapiuns.com.br` nesta
data. Não é suposição, e o resto do documento assume que você leu isto antes.

| Pedido | Resposta | Leitura |
|---|---|---|
| `http://.../pt/reservar/` | `301` → `https://…` | o redirecionamento da seção 6 está no ar |
| `/pt/reservar/` | `200` | o site publicado é de 21/08, 15:40 UTC |
| `/enviar.php` | **`404`** | **o endpoint não está no servidor** |
| `/enviar-mail.php` | **`404`** | idem |
| `/_i18n/pt.json` | **`404`** | os dicionários da seção 3 também não subiram |
| `/og.jpg` | `200` | o resto de `public/` subiu normalmente |
| `/.htaccess` | `200`, conteúdo em texto | quem serve o docroot é nginx — ver seção 6 |

Ou seja: **o formulário publicado hoje dá POST contra um 404.** Quem preencher
não recebe a página de "enviado" nem nada que se pareça com ela, e o pedido
não vai a lugar nenhum. Nada das seções 1, 2, 4 e 5 muda isso — elas só
começam a valer depois que o deploy subir os dois `.php` e o diretório
`_i18n/`, que o mesmo upload que subiu `og.jpg` deixou de fora.

O hospedeiro é HostGator/EIG (reverso `unifiedlayer.com`, SPF
`include:websitewelcome.com`), com nginx na frente do docroot.

### A versão do PHP

O piso é **8.0**, e desde a guarda no topo do `enviar.php` ele é cobrado pelo
próprio código. As três faixas abaixo foram medidas em contêiner
(`php:7.2` … `php:8.1`), não deduzidas da documentação do PHP:

| Versão | O que acontece |
|---|---|
| ≤ 7.3 | **erro de parse** (`1_000_000`, separador numérico que só existe a partir de 7.4) — 500 para todo mundo, nada degrada e nada é logado |
| 7.4 | parseia limpo e **morre em execução**, na primeira `str_contains()` |
| ≥ 8.0 | roda |

Repare no que a 7.4 tem de pior: `php -l` passa limpo, o deploy não reclama de
nada, e o estrago só aparece quando alguém submete — 500 pelado onde
`display_errors` está desligado, e o caminho absoluto do servidor na tela de
quem submeteu onde está ligado:

```
Fatal error: Uncaught Error: Call to undefined function str_contains()
in /home/USUARIO/public_html/enviar.php
```

Com a guarda, essa faixa passou a devolver o mesmo `500 config ausente` pelado
das outras falhas de servidor, e a escrever uma linha em `erros.log` (seção 9):

```
2026-08-21T22:57:05+00:00	PHP 7.4.33 é anterior a 8.0: o endpoint não roda nesta versão — ver docs/deploy-formulario.md
```

A guarda **não** protege da faixa `≤ 7.3`: lá o arquivo nem chega a ser
executado. E, mesmo com ela, escolha **8.1 ou mais nova** se o painel
oferecer: é a versão para a qual este código foi escrito, e é a partir dela
que o `: never` da `responde()` tem semântica de verdade (em 7.4 e 8.0 ele
compila como nome de classe e nunca é cobrado).

Onde conferir e trocar no cPanel: **Software → MultiPHP Manager**, na linha do
domínio.

## 1. `va-config.php`

Fica **um nível acima** do `public_html`, fora do alcance de qualquer
requisição web:

```
/home/USUARIO/va-config.php      <- o real, preenchido, nunca no git
/home/USUARIO/public_html/       <- dist/ sobe aqui por FTP
```

O modelo é `docs/va-config.example.php`. Copie o conteúdo dele para
`/home/USUARIO/va-config.php` e preencha:

- `smtpPass` — a senha da caixa `site@vilaarapiuns.com.br` (seção 4).
- `dryRun` — **`true` no primeiro deploy** (seção 7), `false` só depois de
  confirmar que o e-mail chega de verdade.
- `varDir` — já vem como `/home/USUARIO/va-var`; crie esse diretório com
  permissão `0700` se o `enviar.php` não conseguir criar sozinho (ele tenta
  com `@mkdir(..., 0700, true)`, mas o usuário do PHP-FPM às vezes não tem
  permissão de escrita no `$HOME` direto).

Sem este arquivo, `enviar.php` responde 500 pelado (`config ausente`) — de
propósito: quem visita não pode saber que faltou configurar o servidor.

> O modelo vivia em `public/`, e `public/` é copiado inteiro para `dist/`: ele
> subia com o site e ficava buscável em
> `https://vilaarapiuns.com.br/va-config.example.php`, dizendo a quem pedisse
> qual é o endereço do BCC, qual o host e o usuário de SMTP, e onde fica o
> `varDir`. Nada disso é senha, e nada disso precisa estar público — quem
> precisa do modelo pega no repositório, não no site no ar. Por isso ele mora
> em `docs/` desde o review final de 21/08/2026.

## 2. PHPMailer

`public/enviar-mail.php` faz:

```php
require_once $cfg['varDir'] . '/../phpmailer/src/PHPMailer.php';
require_once $cfg['varDir'] . '/../phpmailer/src/SMTP.php';
require_once $cfg['varDir'] . '/../phpmailer/src/Exception.php';
```

Com `varDir = /home/USUARIO/va-var`, isso resolve para:

```
/home/USUARIO/phpmailer/src/PHPMailer.php
/home/USUARIO/phpmailer/src/SMTP.php
/home/USUARIO/phpmailer/src/Exception.php
```

Ou seja: baixe o PHPMailer (release do GitHub, `phpmailer/phpmailer`) e
extraia de forma que `phpmailer/src/*.php` fique **fora do `public_html`**,
ao lado de `va-config.php`. Ele não é vendorizado no repositório de
propósito — é dependência de servidor, não de site.

Atenção ao que o zip de release do GitHub faz: ele extrai para
`PHPMailer-6.x.y/`, **não** para `phpmailer/`. Extrair sem renomear deixa os
arquivos no lugar errado, e é o engano mais provável desta página inteira.

Se algum dos três faltar, o endpoint **não** tenta o `require`. Ele responde o
mesmo `500 config ausente` pelado da config (quem submeteu não descobre nada do
servidor) e escreve em `varDir/erros.log` qual arquivo ele procurou e não achou:

```
2026-08-21T22:01:14+00:00 PHPMailer ausente: /home/USUARIO/va-var/../phpmailer/src/PHPMailer.php não existe ou não é legível — ver docs/deploy-formulario.md §2
```

Antes dessa trava, PHPMailer no lugar errado era erro **fatal** do PHP: tela
branca sem linha nenhuma de log, ou o caminho absoluto do servidor impresso na
tela do visitante. Se o formulário parar de funcionar logo depois de você
trocar `dryRun` para `false`, este log é o primeiro lugar para olhar.

Esse caminho só é alcançado quando `dryRun` é `false`. Em `dryRun`, nenhum
`require` de PHPMailer acontece — é por isso que a suíte local
(`npm run form:check`) nunca precisa dele.

## 3. `dist/_i18n/` — os dicionários da auto-resposta

`enviar-mail.php` lê `__DIR__/_i18n/{idioma}.json` para montar a
auto-resposta (assunto e corpo, um arquivo por idioma — cinco no total).
`npm run build` já gera essa pasta dentro de `dist/`, via
`tools/copia-dicionarios.mjs`; não há nada para criar à mão aqui, diferente
do resto deste documento. O que existe é um risco de **subir incompleto**:

`dist/_i18n/` é um diretório **novo**, que só passou a existir a partir da
Tarefa 6. Um sync por FTP que sobe só "o que mudou" compara contra o que já
está no servidor — e como esse diretório nunca esteve lá, alguns clientes de
FTP/deploy simplesmente não o notam e não o sobem, sem aviso nenhum de que
algo ficou de fora.

Confira, depois de cada deploy (por FTP/File Manager ou SSH):

```
ls /home/USUARIO/public_html/_i18n/
# esperado: de.json  en.json  es.json  ja.json  pt.json
```

> **Em 21/08/2026 esta pasta não está no servidor** (`/_i18n/pt.json`
> responde 404 — seção 0). O risco descrito acima não é hipótese: ele já
> aconteceu neste deploy, junto com os dois `.php`.

Se a pasta faltar, ou faltar um dos cinco arquivos, o pedido de venda
continua chegando normalmente e o visitante sem JS ainda vê a página de
"enviado" — nada no fluxo principal aparece quebrado. Só a auto-resposta do
idioma sem dicionário deixa de ser enviada, em silêncio para quem submeteu.
A única pista fica em `erros.log` (seção 9): uma linha `auto-resposta vazia
— idioma=X` por submissão feita naquele idioma, a partir do ajuste do review
da Tarefa 6.

## 4. Criar `site@vilaarapiuns.com.br`

No cPanel: **E-mail → Contas de E-mail → Criar**. Domínio
`vilaarapiuns.com.br`, usuário `site`, senha forte (vai para `smtpPass` em
`va-config.php`). Esse é o remetente (`From`) de todo e-mail que o
formulário manda — venda e auto-resposta.

`smtpHost`/`smtpPort` no modelo já apontam para `mail.vilaarapiuns.com.br`
porta `465` (SSL). Confirme em **E-mail → Contas de E-mail → Configurar
Cliente de E-mail** que esses valores continuam corretos para a conta nova.

`site@` é caixa de **envio**, não de leitura: a auto-resposta sai com
`Reply-To` apontando para `reservas@vilaarapiuns.com.br` (o mesmo alias
de `$cfg['to']`), então quem aperta "responder" cai lá, não em `site@`.
Não é preciso monitorar `site@` por causa disso.

## 5. Conferir SPF e DKIM

Sem os dois, provedor grande (Gmail, Outlook) marca como spam ou rejeita
direto — e ninguém do outro lado vê nem a mensagem de venda nem a
auto-resposta.

No cPanel: **E-mail → Entregabilidade de E-mail**, no domínio
`vilaarapiuns.com.br`. A tela mostra o registro SPF e o DKIM esperados
lado a lado com o que existe hoje no DNS, e diz "Válido" ou não para cada
um. Se o DNS do domínio for gerenciado fora do cPanel (outro provedor), o
botão "Importar os registros DNS sugeridos automaticamente" não funciona —
copie os valores mostrados e crie os registros TXT manualmente onde o DNS
de fato mora. Depois de criar, a propagação pode levar até algumas horas;
a mesma tela revalida quando reaberta.

## 6. `.htaccess` — o redirecionamento para HTTPS **não** vem no `dist/`

O `.htaccess` deste projeto está na **raiz do repositório**, não em `public/` —
e `astro build` só copia para `dist/` o que está em `public/`. Ou seja: ele
**não faz parte da saída do build e não sobe por FTP com o site**. Ele precisa
já estar no servidor, dentro do `public_html`, e continuar lá.

O que ele carrega:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

Isso passou a importar mais desde o formulário. O `<form>` dá POST em
`/enviar.php` com ação **relativa**, então ele herda o esquema da página: quem
abrir `http://vilaarapiuns.com.br/pt/reservar/` sem esse redirecionamento no ar
manda nome, e-mail e telefone do hóspede em texto puro pela rede.

Como confirmar que está valendo, do seu terminal:

```
curl -sI http://vilaarapiuns.com.br/pt/reservar/ | head -3
# esperado: HTTP/1.1 301 (ou 302) e
#           Location: https://vilaarapiuns.com.br/pt/reservar/
```

Um `200` sem `Location:` significa que o redirecionamento não está no ar —
pare aqui e resolva antes de deixar o formulário receber gente.

### Neste servidor quem redireciona é o nginx — o `.htaccess` é decorativo

Medido em 21/08/2026: o redirecionamento **está no ar** — o `curl` acima
devolve `301` com o `Location:` certo. Só que não é este arquivo que o faz.

`https://vilaarapiuns.com.br/.htaccess` responde **`200`, com as três linhas
em texto puro**. Sob Apache com a configuração padrão do cPanel esse pedido
devolve `403`: é a proteção `<Files ~ "^\.ht">` que faz isso. Um `200`
legível significa que quem entrega o docroot é o **nginx** (o `Server:` da
resposta diz `nginx/1.18.0 (Ubuntu)`), e nginx não lê `.htaccess`.

Isso não prova que não exista um Apache atrás para o PHP — nginx na frente
servindo estático e Apache rodando `.php` é arranjo comum. Prova outra coisa:
o `.htaccess` **não governa o que o nginx entrega**, e o que o nginx entrega
inclui todas as páginas do site.

Duas consequências que valem mais do que a curiosidade:

- **Não conte com `.htaccess` para proteger nada aqui.** O `Require all
  denied` que o endpoint escreve dentro do `varDir` (seção 9) é exatamente
  essa classe de regra: se um dia o `varDir` cair dentro do `public_html`,
  nginx serve `enviados/*.txt` — PII de hóspede em texto puro — sem olhar o
  arquivo. O que protege de verdade é o `varDir` morar **fora** do
  `public_html`, e isso não é opcional.
- O arquivo é **legível pela web** como está. Hoje ele não diz nada que já não
  esteja no repositório público; qualquer regra futura ali (bloqueio por IP,
  caminho interno, nome de arquivo) já nasce pública — e possivelmente
  ignorada.

Se um dia aquele `curl` voltar `200` sem `Location:`, o lugar de resolver é a
configuração do servidor, pelo painel ou pelo suporte da hospedagem — não
este arquivo.

**Não mova este arquivo para `public/` para "resolver" isso.** O `.htaccess` do
`public_html` costuma acumular regras que o próprio cPanel escreve (PHP
selector, cache, bloqueios); um deploy que sobrescrevesse o arquivo do servidor
apagaria essas regras sem aviso. Ele é estado do servidor, não saída de build.

## 7. Primeiro envio de teste, com `dryRun` ligado

Antes de deixar qualquer visitante real acionar SMTP de verdade:

1. Suba o `dist/` construído (com `dryRun: true` em `va-config.php`).
2. **A partir deste instante o site está no ar e recebendo gente de verdade.**
   `dryRun` não desliga o formulário: quem chegar preenche normalmente, vê a
   página de confirmação e lê a promessa de resposta em 24 horas — e o pedido
   dele vai para um arquivo de texto que ninguém foi avisado para ler.

   Enquanto `dryRun` estiver ligado, `varDir/enviados/` **é a caixa de
   entrada**, e olhar para ela é obrigação sua. Se houver mais arquivos do que
   os que o seu próprio teste escreveu, alguém real escreveu para a pousada:
   responda essas pessoas antes de qualquer outra coisa, dentro do prazo que o
   site prometeu a elas. Não deixe esta janela aberta mais do que o tempo de
   conferir os arquivos e trocar `dryRun` para `false`.
3. Preencha o formulário do site publicado, normalmente, com um e-mail seu.
4. Confira os dois arquivos gravados em `varDir/enviados/` — por
   FTP/File Manager, ou por SSH:

   ```
   ls -la /home/USUARIO/va-var/enviados/
   cat /home/USUARIO/va-var/enviados/*-venda.txt          # o que quem responde receberia
   cat /home/USUARIO/va-var/enviados/*-autoresposta.txt   # o que o visitante receberia
   ```

5. **Confirme que o contador de limite está gravando de verdade:**

   ```
   ls -la /home/USUARIO/va-var/rate-*.json
   ls -la /home/USUARIO/va-var/.htaccess
   ```

   Tem de existir pelo menos um `rate-<hash>.json`, com a hora do envio que
   você acabou de fazer. Se não existir nenhum, o PHP **não consegue escrever**
   no `varDir` — e o endpoint não checa isso em lugar nenhum: ele cria o
   diretório com `@mkdir(...)` e segue em frente. Toda leitura do contador
   passa a achar "nenhum envio", a conta fica em zero para sempre, e o limite
   de 5/hora e 20/dia **nunca engata** — em silêncio, permanentemente, sem
   nada aparecer quebrado. O `.htaccess` (`Require all denied`, escrito pelo
   próprio endpoint) é o mesmo teste pela outra ponta: se ele também não
   aparecer, é permissão.

   Corrija o dono e a permissão (`0700`, dono = o usuário sob o qual o PHP
   roda) e repita o envio até os dois arquivos aparecerem. Não siga adiante
   com esse sintoma.
6. Leia os dois e-mails inteiros: destinatário, assunto, corpo, o aviso de
   idioma no e-mail de venda, a ausência de qualquer texto do visitante na
   auto-resposta (só o nome no vocativo é esperado ali).
7. Só depois de ler e aprovar, edite `va-config.php` no servidor e troque
   `dryRun` para `false`. A partir daí o mesmo formulário manda e-mail de
   verdade — nenhuma outra mudança de código é necessária. E aí falta o passo
   da seção 8, que é o que fecha o deploy.

## 8. Primeiro envio de VERDADE, com `dryRun` desligado

Este passo **não é opcional**. Trocar `dryRun` para `false` é a primeira vez
que o caminho de produção roda: SMTP autenticado, PHPMailer, SPF/DKIM, o alias
de destino, o BCC, e a auto-resposta saindo para um endereço de fora. Nada
disso foi executado até aqui — nem no servidor (a seção 7 inteira grava em
arquivo) nem na suíte local (`npm run form:check` roda inteira em `dryRun`, sem
credencial nenhuma, de propósito). Ler o código não substitui este envio.

1. Preencha o formulário do site publicado **uma vez**, com um e-mail seu de
   verdade — de preferência num provedor grande (Gmail, Outlook), que é onde
   SPF e DKIM se provam.
2. Confirme as **três** entregas, uma por uma:
   - o pedido chegou em `reservas@vilaarapiuns.com.br` (na caixa para onde o
     alias encaminha);
   - a cópia oculta chegou em `carlos@wecarehosting.com.br`;
   - a auto-resposta chegou no endereço que você digitou no formulário.
3. Nas três, confira se caiu na **caixa de entrada** e não no spam. Se caiu no
   spam, volte à seção 5 (SPF e DKIM) antes de considerar isto pronto.
4. Confira que `varDir/erros.log` **não** ganhou linha nova depois deste envio.
   Uma linha ali significa que alguma entrega falhou em silêncio — a
   auto-resposta é cortesia e falhar nela não derruba a submissão nem aparece
   para o visitante.
5. Anote a data deste teste. Repita ele inteiro (seções 7 e 8) sempre que
   `smtpHost`/`smtpPort`/`smtpUser`/`smtpPass` mudarem, ou depois de qualquer
   atualização do PHPMailer no servidor.

Até este envio ter sido feito e conferido, o único caminho de código que a
produção usa nunca foi executado — e "o formulário está no ar" é suposição.

## 9. Onde ficam os logs e o contador de limite

Tudo dentro de `varDir` (`/home/USUARIO/va-var`), fora do webroot:

| Arquivo/pasta | O que é | Quando aparece |
|---|---|---|
| `enviados/*.txt` | Só em `dryRun`: o e-mail de venda (`-venda.txt`) e a auto-resposta (`-autoresposta.txt`, só quando o corpo não sai vazio) que teriam sido enviados | Todo envio aceito, em `dryRun` |
| `erros.log` | Uma linha por falha de SMTP (data, destinatário, mensagem da exceção do PHPMailer) OU por auto-resposta que saiu vazia (data, idioma) — ver seção 3 | Falha de SMTP só com `dryRun: false`; auto-resposta vazia em qualquer modo, inclusive `dryRun`; para de crescer sozinho ao passar de 1&nbsp;MB, mesmo teto de `descartes.log` |
| `descartes.log` | Uma linha por honeypot ou envio "rápido demais" descartado em silêncio — a única forma de saber que a defesa comeu um pedido | Sempre, mesmo em `dryRun`; para de crescer sozinho ao passar de 1&nbsp;MB |
| `rate-<hash>.json` | Contador de envios aceitos por IP (ou por bloco /64, em IPv6), para o limite de 5/hora e 20/dia | Um arquivo por IP/bloco que já enviou; se apaga sozinho quando o histórico esvazia. **Se nunca aparecer nenhum, o limite não está engatando** — ver seção 7, passo 5 |
| `.htaccess` | `Require all denied`, escrito pelo próprio endpoint na primeira submissão | Cinto e suspensório: se um dia o `varDir` cair dentro do `public_html`, `enviados/*.txt` é PII de hóspede em texto puro servida pela web. Fora do webroot o arquivo é inerte |

Nenhum desses arquivos entra no repositório — vivem só no servidor, dentro
de `varDir`.
