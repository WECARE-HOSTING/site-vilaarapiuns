# 301 da raiz `/` → `/pt/`

O apex não é página. O destino permanente é `/pt/` (x-default). Um 302 diz
ao Google que a mudança é temporária; o Search Console trata isso como
redirect ruim e o canonical do apex não consolida em `/pt/`.

Em **24/09/2026** o dono do site decidiu que o mercado principal da Villa
Arapiuns é o Brasil. A raiz deixa de ir para `/en/` e passa a ir para
`/pt/`. O inglês continua no ar em `/en/`. O que muda no pedido da raiz é
o destino; nas páginas, muda o hreflang `x-default` (passa a apontar para
a versão em português). Os alternates `en`, `pt-BR`, `es`, `de` e `ja` e
o canonical de cada página ficam autorreferentes, como já estavam.

A negociação de `Accept-Language` em `/` (`return 302 $idioma_raiz`)
continua fora. O destino fixo é `301` → `/pt/`.

## O que está no ar

Medido em **24/09/2026 18:12 BRT** contra `https://villaarapiuns.com.br`.

| Pedido | Resposta | Leitura |
|---|---|---|
| `GET /` | **301** (`HTTP/2 301`), `Location: https://villaarapiuns.com.br/pt/` | bloco inline no server apex, no lugar do include |

O nginx do apex não está neste git. Arquivo de site:
`/etc/nginx/sites-available/villaarapiuns.com.br`. No `server { }` com
`server_name villaarapiuns.com.br` e `root /var/www/vilaarapiuns` saiu o
include e entrou o bloco escrito direto:

```nginx
location = / { return 301 /pt/; }
```

Backup dessa edição:
`/root/backups/villaarapiuns.com.br.bak-20260924-181232`.

O include tinha sido aplicado mais cedo no mesmo dia, com o snippet ainda
em `return 301 /en/;`. Por isso o destino novo foi para o arquivo de site,
e não para o include: na hora da medição o
`/var/www/vilaarapiuns/nginx-root-redirect.conf` do docroot ainda mandava
para `/en/`. Este repositório alinha o snippet com `/pt/`.

Antes disso, ainda em 24/09, `GET /` era **302** com `Location` para
`/en/` (corpo de 154 bytes, `<title>302 Found</title>`). Essa regra
negociava idioma. Não voltar a colocá-la.

`return 301 /pt/;` sai com `Location` absoluto porque `absolute_redirect`
está ligado por padrão. `astro dev` responde `GET /` com **301**.

## Depois do deploy, voltar ao include

Um deploy copia `nginx-root-redirect.conf` para o docroot
(`/var/www/vilaarapiuns`) e **não** edita
`/etc/nginx/sites-available/villaarapiuns.com.br` nem executa reload.
Enquanto o bloco inline existir, `GET /` continua 301 para `/pt/` mesmo
que o arquivo do docroot esteja velho.

Quando o deploy deste repositório estiver no docroot, o snippet e o bloco
inline dizem a mesma coisa (`return 301 /pt/;`). Aí dá para tirar o bloco
inline e voltar ao include. O nginx passa a ler o arquivo versionado de
novo, e o próximo ajuste de destino volta a ser editar o snippet, testar
e recarregar.

Ordem: deploy primeiro, include depois. Restaurar o include **antes** do
deploy, com o snippet ainda em `/en/`, devolve `GET /` para o inglês no
reload.

No `server { }` de `villaarapiuns.com.br` (porta 443,
`root /var/www/vilaarapiuns`), no lugar do bloco inline:

```nginx
include /var/www/vilaarapiuns/nginx-root-redirect.conf;
```

Não usar `include /home/USUARIO/public_html/nginx-root-redirect.conf;` —
`/home/USUARIO/public_html` era placeholder estilo Hostinger (o mesmo
jeito de `docs/deploy-formulario.md`). Neste VPS o include real é
`/var/www/vilaarapiuns/nginx-root-redirect.conf`.

O arquivo incluído contém só isto:

```nginx
location = / {
    return 301 /pt/;
}
```

Não restaurar `return 302 $idioma_raiz`. Não usar `rewrite … redirect;`
(a flag `redirect` é 302; `permanent` é 301). `location = /` duplicado —
o inline e o include ao mesmo tempo — faz o `nginx -t` falhar. Fica um
único `location = /`.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Provar, de fora:

```bash
curl -sI https://villaarapiuns.com.br/ | head -n 8
```

Esperado: `HTTP/2 301` e `location: https://villaarapiuns.com.br/pt/`.
Não 302.

`/pt/` e `/en/` continuam 200. `/pt` e `/en` (sem barra) continuam 301
para a versão com barra. Os servers de `www` e de HTTP já devolvem 301
para o apex HTTPS; não mexer neles. O 301 para `/pt/` é o hop seguinte.

## Por que um deploy normal não mexe nisto

Publicar este repositório copia o site para o docroot. Isso não edita o
arquivo de site do nginx e não executa reload. A linha que decide `GET /`
mora em `/etc/nginx/sites-available/villaarapiuns.com.br`.

O nginx lê o snippet na hora do reload, e só se o server o incluir.
Trocar o `return 301` no arquivo do docroot não chega no ar enquanto o
bloco inline estiver no lugar. Com o include de volta, a troca só vale
depois de `nginx -t` e `systemctl reload nginx`.

Apagar `nginx-root-redirect.conf` do docroot não muda o processo que já
está no ar enquanto o destino for o bloco inline. Se o include voltar e
o arquivo sumir, o próximo `nginx -t` falha.

Tirar todo `location = /` (inline e include) também não serve: o nginx
entrega o `index.html` com status **200** e `meta refresh`, que é o
mismatch de canonical que este redirect existe para acabar. Esse HTML de
fallback, gerado pelo Astro, aponta para `/pt/`.

## O que conferir no host

1. O bloco certo é o `server { }` de `villaarapiuns.com.br` na porta 443,
   `root /var/www/vilaarapiuns`, em
   `/etc/nginx/sites-available/villaarapiuns.com.br`.

   ```bash
   sudo nginx -T > /tmp/nginx-T.txt
   grep -n -E 'server_name|root |idioma_raiz|return 302|include .*nginx-root-redirect|return 301 /pt/' /tmp/nginx-T.txt
   ```

2. Hoje esse bloco tem o inline `location = / { return 301 /pt/; }`.
   Depois do deploy, trocar pelo include da seção acima. Não deixar os
   dois.

3. Se a config mudou, testar e recarregar:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. Provar, de fora:

   ```bash
   curl -sI https://villaarapiuns.com.br/ | head -n 8
   ```

   Esperado: `HTTP/2 301` e `location: https://villaarapiuns.com.br/pt/`.
   Não 302.

Git, sozinho, não executa o reload. Sem esse reload, uma edição do
snippet ou do `server { }` não chega no ar.
