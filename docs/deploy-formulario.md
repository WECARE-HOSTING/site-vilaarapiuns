# Formulário de reserva — o que só existe no servidor

O site é estático (Astro → `dist/` → FTP). Os dois únicos arquivos com lógica
de servidor são `public/enviar.php` e `public/enviar-mail.php`, e eles
dependem de três coisas que **não** estão no repositório — que é público —
e que por isso precisam ser criadas à mão no cPanel a cada deploy novo de
servidor: a config, o PHPMailer, e a caixa `site@`.

## 1. `va-config.php`

Fica **um nível acima** do `public_html`, fora do alcance de qualquer
requisição web:

```
/home/USUARIO/va-config.php      <- o real, preenchido, nunca no git
/home/USUARIO/public_html/       <- dist/ sobe aqui por FTP
```

O modelo é `public/va-config.example.php` (sobe com o site, sem segredo
nenhum). Copie o conteúdo dele para `/home/USUARIO/va-config.php` e preencha:

- `smtpPass` — a senha da caixa `site@vilaarapiuns.com.br` (seção 4).
- `dryRun` — **`true` no primeiro deploy** (seção 6), `false` só depois de
  confirmar que o e-mail chega de verdade.
- `varDir` — já vem como `/home/USUARIO/va-var`; crie esse diretório com
  permissão `0700` se o `enviar.php` não conseguir criar sozinho (ele tenta
  com `@mkdir(..., 0700, true)`, mas o usuário do PHP-FPM às vezes não tem
  permissão de escrita no `$HOME` direto).

Sem este arquivo, `enviar.php` responde 500 pelado (`config ausente`) — de
propósito: quem visita não pode saber que faltou configurar o servidor.

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

Se a pasta faltar, ou faltar um dos cinco arquivos, o pedido de venda
continua chegando normalmente e o visitante sem JS ainda vê a página de
"enviado" — nada no fluxo principal aparece quebrado. Só a auto-resposta do
idioma sem dicionário deixa de ser enviada, em silêncio para quem submeteu.
A única pista fica em `erros.log` (seção 7): uma linha `auto-resposta vazia
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

## 6. Primeiro envio de teste, com `dryRun` ligado

Antes de deixar qualquer visitante real acionar SMTP de verdade:

1. Suba o `dist/` construído (com `dryRun: true` em `va-config.php`).
2. Preencha o formulário do site publicado, normalmente, com um e-mail seu.
3. Confira os dois arquivos gravados em `varDir/enviados/` — por
   FTP/File Manager, ou por SSH:

   ```
   ls -la /home/USUARIO/va-var/enviados/
   cat /home/USUARIO/va-var/enviados/*-gabriela.txt       # o que a Gabriela receberia
   cat /home/USUARIO/va-var/enviados/*-autoresposta.txt   # o que o visitante receberia
   ```

4. Leia os dois inteiros: destinatário, assunto, corpo, o aviso de idioma
   no e-mail de venda, a ausência de qualquer texto do visitante na
   auto-resposta (só o nome no vocativo é esperado ali).
5. Só depois de ler e aprovar, edite `va-config.php` no servidor e troque
   `dryRun` para `false`. A partir daí o mesmo formulário manda e-mail de
   verdade — nenhuma outra mudança de código é necessária.

Repita este teste sempre que `smtpHost`/`smtpPort`/`smtpUser`/`smtpPass`
mudarem, ou depois de qualquer atualização do PHPMailer no servidor.

## 7. Onde ficam os logs e o contador de limite

Tudo dentro de `varDir` (`/home/USUARIO/va-var`), fora do webroot:

| Arquivo/pasta | O que é | Quando aparece |
|---|---|---|
| `enviados/*.txt` | Só em `dryRun`: o e-mail de venda (`-gabriela.txt`) e a auto-resposta (`-autoresposta.txt`, só quando o corpo não sai vazio) que teriam sido enviados | Todo envio aceito, em `dryRun` |
| `erros.log` | Uma linha por falha de SMTP (data, destinatário, mensagem da exceção do PHPMailer) OU por auto-resposta que saiu vazia (data, idioma) — ver seção 3 | Falha de SMTP só com `dryRun: false`; auto-resposta vazia em qualquer modo, inclusive `dryRun`; para de crescer sozinho ao passar de 1&nbsp;MB, mesmo teto de `descartes.log` |
| `descartes.log` | Uma linha por honeypot ou envio "rápido demais" descartado em silêncio — a única forma de saber que a defesa comeu um pedido | Sempre, mesmo em `dryRun`; para de crescer sozinho ao passar de 1&nbsp;MB |
| `rate-<hash>.json` | Contador de envios aceitos por IP (ou por bloco /64, em IPv6), para o limite de 5/hora e 20/dia | Um arquivo por IP/bloco que já enviou; se apaga sozinho quando o histórico esvazia |

Nenhum desses arquivos entra no repositório — vivem só no servidor, dentro
de `varDir`.
