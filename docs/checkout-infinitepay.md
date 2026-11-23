# Checkout Integrado — o que o site estático não faz sozinho

O site é Astro em HTML estático, servido por nginx. `POST /enviar.php` responde
405: PHP não executa neste docroot (`docs/deploy-formulario.md`). Por isso o
Checkout Integrado da InfinitePay **não mora no `dist/`**.

Quem cobra é um proxy pequeno, em `workers/infinitepay-proxy/`. Ele:

1. Recebe a ocupação (Single, Duplo, Triplo, crianças) e o `order_nsu`.
2. Recalcula o valor no servidor com `src/lib/fechamento.ts`. O navegador não
   escolhe o preço. O Réveillon publicado é Single R$ 9.000, Duplo R$ 6.000,
   Triplo R$ 5.000 por pessoa, sinal de 30%. O total também pode ser cobrado
   a partir da landing, com a mesma tabela.
3. O Detox está na estrutura e **não tem preço**. O proxy responde 409
   `preco_nao_publicado`. Nada é inventado.
4. Chama `POST https://api.checkout.infinitepay.io/links` com o handle
   `carlospecucci`, o valor **em centavos**, `order_nsu` e `redirect_url`
   apontando para `/pt/lp/pagamento-confirmado/` (noindex).
5. Se existir `INFINITEPAY_API_KEY`, manda `X-Api-Key`. Se existir
   `INFINITEPAY_WEBHOOK_URL`, manda `webhook_url`. As duas são opcionais e
   ficam só no ambiente do proxy.
6. `POST /payment-check` repete a consulta
   `POST https://api.checkout.infinitepay.io/payment_check`. A página de
   obrigado só dispara `purchase` quando `paid === true`, uma vez por pedido.

Sem `PUBLIC_CHECKOUT_API_BASE` no build, ou se o proxy falhar, o botão não abre
link de pagamento. A pessoa vê o aviso e segue no WhatsApp com o resumo, o
pacote e a etiqueta de UTM. Nada é cobrado.

## O que precisa existir antes de ligar em produção

Isto não está no repositório e não sobe com o push:

1. **Conta InfinitePay do Carlos** (`handle: carlospecucci`). Confirmar com ele
   se a API de links exige chave. Se exigir, guardar como segredo do Worker,
   não no git e não no HTML.
2. **Subir o Worker** (Cloudflare ou outro runtime que execute
   `workers/infinitepay-proxy/index.ts`). Exemplo:

   ```
   cd workers/infinitepay-proxy
   npx wrangler secret put INFINITEPAY_API_KEY   # só se a conta exigir
   npx wrangler deploy
   ```

   Anotar a URL pública, sem barra no final. Ex.: `https://checkout.villaarapiuns.com.br`.
3. **Build com a URL.** Quem publica roda o build no servidor, e lá não existe
   o `.env` de ninguém. Sem a variável, o botão cai no WhatsApp:

   ```
   PUBLIC_CHECKOUT_API_BASE=https://checkout.villaarapiuns.com.br
   ```

4. **Google Ads**, na mesma build, quando o Leonardo tiver o rótulo da conversão
   de compra. Sem os dois, o `purchase` do GA4 continua; a conversão de Ads não
   dispara (e `click_reservar` não é essa conversão — está suspensa):

   ```
   PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXX
   PUBLIC_GOOGLE_ADS_PURCHASE_LABEL=xxxxxxxx
   ```

5. **Meta Pixel**, na mesma build. O script só entra depois do aceite de
   marketing no banner. Sem o ID, nada do Pixel é carregado:

   ```
   PUBLIC_META_PIXEL_ID=000000000000000
   ```

6. **Origens.** O proxy só aceita `redirect_url` em
   `villaarapiuns.com.br`, `vilaarapiuns.com.br` e localhost. Outro domínio
   precisa entrar em `ALLOWED_ORIGINS` no `wrangler.toml`.

## Prova de que ligou

- `POST {PUBLIC_CHECKOUT_API_BASE}/links` com 1 Duplo devolve uma URL `https://`
  e `price` igual a 360000 (30% de R$ 12.000, em centavos).
- Pagar e voltar para `/pt/lp/pagamento-confirmado/?order_nsu&transaction_nsu&slug`
  mostra a confirmação só quando `payment_check` responde `paid: true`.
- Recarregar essa URL não dispara `purchase` de novo.
