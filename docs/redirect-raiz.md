# 301 da raiz `/` → `/en/`

O apex não é página. O destino permanente é `/en/` (x-default). Um 302 diz
ao Google que a mudança é temporária; o Search Console trata isso como
redirect ruim e o canonical do apex não consolida em `/en/`.

Medido em **2026-09-24** contra `https://villaarapiuns.com.br`.

## O que está no ar

| Pedido | Resposta | Leitura |
|---|---|---|
| `GET /` | **302**, `Location: https://villaarapiuns.com.br/en/`, 154 bytes | página interna do nginx: `<title>302 Found</title>` e `nginx/1.18.0 (Ubuntu)` |
| `GET /index.html` | **200**, 283 bytes | HTML do Astro (`meta refresh` para `/en/`). O `GET /` não chega neste arquivo |
| `GET /nginx-root-redirect.conf` | **200**, `application/octet-stream` (203 bytes nesse dia, igual ao arquivo do repo) | o snippet `return 301` está no docroot e é servido como download. Config incluída não responde HTTP |
| `GET /en` (sem barra) | **301**, 178 bytes | redirect de diretório do próprio nginx, já permanente |
| `http://` e `www` | **301** | host e HTTPS já são permanentes |

Os 154 bytes são o corpo padrão do nginx para um redirect que **ele** gerou
(`return` ou `rewrite`). Não é o `index.html` do Astro e não é o
`.htaccess` (nginx não lê `.htaccess`; `GET /.htaccess` é 403).

`astro dev` já responde `GET /` com **301**. O 302 existe só na configuração
do nginx da máquina.

## Por que um deploy normal não corrige

Publicar este repositório copia o site para o docroot (o checkout git é o
docroot: `/dist/index.html` e `/nginx-root-redirect.conf` coexistem). Isso
não edita o `server { }` do nginx e não executa reload. O arquivo
`nginx-root-redirect.conf` na raiz do repo **não é** um include automático.

Apagar a regra 302 sem pôr um 301 no lugar também não serve: o nginx passa
a entregar o `index.html` com status **200** e `meta refresh`, que é o
mismatch de canonical que este redirect existe para acabar.

## O que o Carlos/WeCare roda no host

1. Achar a regra que emite o 302 e o `root` do server que responde pelo apex:

   ```bash
   sudo nginx -T > /tmp/nginx-T.txt
   grep -n -E 'server_name|root |return 302|rewrite .+ redirect;' /tmp/nginx-T.txt
   ```

   O bloco certo é o `server { }` de `villaarapiuns.com.br` na porta 443
   cujo `GET /` é o 302. Os servers de `www` e de HTTP já devolvem 301;
   não mexer neles.

2. Remover desse bloco o `return 302 …` ou o `rewrite … redirect;`.
   Não deixar os dois: `location = /` duplicado faz o `nginx -t` falhar.
   No lugar, incluir o snippet do docroot (o `root` desse server é o
   diretório onde `nginx-root-redirect.conf` está; neste projeto isso é
   `/home/USUARIO/public_html`, o mesmo caminho de
   `docs/deploy-formulario.md`):

   ```nginx
   include /home/USUARIO/public_html/nginx-root-redirect.conf;
   ```

   O arquivo incluído contém só isto:

   ```nginx
   location = / {
       return 301 /en/;
   }
   ```

   `return 301 /en/;` já sai com `Location` absoluto
   (`https://villaarapiuns.com.br/en/`) porque `absolute_redirect` está
   ligado por padrão. Não trocar por `rewrite ^/?$ /en/ redirect;` —
   essa flag é 302, que é o que o ar faz hoje.

3. Testar a configuração e recarregar:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. Provar, de fora:

   ```bash
   curl -sI https://villaarapiuns.com.br/ | head -n 8
   ```

   Esperado: `HTTP/2 301` e `location: https://villaarapiuns.com.br/en/`.
   Não 302. O corpo, se baixado sem seguir o redirect, é a página
   "301 Moved Permanently" do nginx (178 bytes com este `Server`), não
   "302 Found" (154 bytes).

   `/en/` continua 200. `/en` continua 301.

Git, sozinho, não executa o passo 3. Sem esse reload o próximo deploy
continua 302.
