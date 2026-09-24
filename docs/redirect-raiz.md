# 301 da raiz `/` → `/en/`

O apex não é página. O destino permanente é `/en/` (x-default). Um 302 diz
ao Google que a mudança é temporária; o Search Console trata isso como
redirect ruim e o canonical do apex não consolida em `/en/`.

Em **2026-09-24** o Marketing WECARE aplicou o include no VPS. A negociação
de `Accept-Language` em `/` (`return 302 $idioma_raiz`) saiu de propósito:
o destino fixo é `301` → `/en/` (x-default), por SEO.

## O que está no ar

Medido em **2026-09-24**, depois do reload, contra
`https://villaarapiuns.com.br`. `nginx/1.18.0 (Ubuntu)`.

| Pedido | Resposta | Leitura |
|---|---|---|
| `GET /` | **301** (`HTTP/2 301`), `Location: https://villaarapiuns.com.br/en/`, 178 bytes | include do snippet. Corpo padrão do nginx: `<title>301 Moved Permanently</title>`. Sem `Accept-Language` |
| `GET /index.html` | **200**, 283 bytes | HTML do Astro (`meta refresh` para `/en/`). O `GET /` não chega neste arquivo |
| `GET /nginx-root-redirect.conf` | **200**, `application/octet-stream` | o arquivo continua no docroot e pode ser baixado. Desde o reload ele também é o include do server apex |
| `GET /en/` | **200** | página de idioma |
| `GET /en` (sem barra) | **301**, `Location: https://villaarapiuns.com.br/en/`, 178 bytes | redirect de diretório do nginx |
| `http://` apex | **301**, `Location: https://villaarapiuns.com.br/` | só HTTPS. O 301 para `/en/` é o hop seguinte |
| `https://www` | **301**, `Location: https://villaarapiuns.com.br/` | só o apex. O 301 para `/en/` é o hop seguinte |

O nginx do apex não está neste git. Arquivo de site:
`/etc/nginx/sites-available/villaarapiuns.com.br`. No `server { }` com
`server_name villaarapiuns.com.br` e `root /var/www/vilaarapiuns` saiu:

```nginx
location = / { return 302 $idioma_raiz; }
```

e entrou:

```nginx
include /var/www/vilaarapiuns/nginx-root-redirect.conf;
```

`nginx -t` passou e o reload foi `systemctl reload nginx`.

Não usar `include /home/USUARIO/public_html/nginx-root-redirect.conf;` —
`/home/USUARIO/public_html` era placeholder estilo Hostinger (o mesmo
jeito de `docs/deploy-formulario.md`). Neste VPS o include real é
`/var/www/vilaarapiuns/nginx-root-redirect.conf`.

Antes, no mesmo dia, `GET /` era **302** com `Location: /en/` (na medição
da manhã o header já saía absoluto,
`Location: https://villaarapiuns.com.br/en/`, corpo de 154 bytes,
`<title>302 Found</title>`). Essa regra negociava idioma. Não voltar a
colocá-la.

`return 301 /en/;` sai com `Location` absoluto porque `absolute_redirect`
está ligado por padrão. `astro dev` já respondia `GET /` com **301**. O
302 era só `$idioma_raiz` no nginx da máquina.

## Por que um deploy normal não mexe nisto

Publicar este repositório copia o site para o docroot
(`/var/www/vilaarapiuns`). Isso não edita
`/etc/nginx/sites-available/villaarapiuns.com.br` e não executa reload.
A linha `include` mora nesse arquivo de site, não no git.

O nginx lê o snippet na hora do reload. Trocar o `return 301` no arquivo
do docroot só vale depois de `nginx -t` e `systemctl reload nginx`.
Apagar `nginx-root-redirect.conf` do docroot não muda o processo que já
está no ar; o próximo `nginx -t` falha porque o include some.

Tirar o include sem pôr outro `location = /` com 301 no lugar também não
serve: o nginx entrega o `index.html` com status **200** e `meta refresh`,
que é o mismatch de canonical que este redirect existe para acabar.

## O que conferir no host

O passo abaixo já rodou em 2026-09-24 (`nginx -t` OK, reload OK, `curl`
da tabela acima). Serve para repetir ou para desfazer um regresso.

1. O bloco certo é o `server { }` de `villaarapiuns.com.br` na porta 443,
   `root /var/www/vilaarapiuns`, em
   `/etc/nginx/sites-available/villaarapiuns.com.br`. Os servers de `www`
   e de HTTP já devolvem 301 para o apex HTTPS; não mexer neles.

   ```bash
   sudo nginx -T > /tmp/nginx-T.txt
   grep -n -E 'server_name|root |idioma_raiz|return 302|include .*nginx-root-redirect' /tmp/nginx-T.txt
   ```

2. Nesse bloco deve existir um único `location = /`, via include. Não
   restaurar `return 302 $idioma_raiz`. Não usar `rewrite … redirect;`
   (a flag `redirect` é 302; `permanent` é 301). `location = /`
   duplicado faz o `nginx -t` falhar.

   ```nginx
   include /var/www/vilaarapiuns/nginx-root-redirect.conf;
   ```

   O arquivo incluído contém só isto:

   ```nginx
   location = / {
       return 301 /en/;
   }
   ```

3. Se a config mudou, testar e recarregar:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. Provar, de fora:

   ```bash
   curl -sI https://villaarapiuns.com.br/ | head -n 8
   ```

   Esperado, e o que o ar devolveu em 2026-09-24 depois do reload:
   `HTTP/2 301` e `location: https://villaarapiuns.com.br/en/`. Não 302.
   Sem `-I`, o corpo é a página "301 Moved Permanently" do nginx
   (178 bytes), não "302 Found" (154 bytes).

   `/en/` continua 200. `/en` continua 301.

Git, sozinho, não executa o reload. Sem esse reload, uma edição do
snippet ou do `server { }` não chega no ar.
