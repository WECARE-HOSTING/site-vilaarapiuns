# Checkout InfinitePay — caminho no ar

O botão de pagar abre o link estático da conta da Villa (InfiniteTag `$wecarehosting`):

```
https://pay.infinitepay.io/wecarehosting/{valor}
```

O handle na URL não leva `$`. O valor é o sinal ou o total já calculado na página, com vírgula nos centavos. Exemplo: sinal de R$ 3.600 de 1 Duplo → `https://pay.infinitepay.io/wecarehosting/3600,00`. Não há campo livre de valor.

Esse link não devolve o visitante para `/pt/lp/pagamento-confirmado/`. Por isso o clique **não** dispara `purchase` no GA4 nem conversão de compra no Google Ads. A página de obrigado, se for aberta, só registra compra quando `payment_check` responder `paid === true`. Sem isso, ela não inventa compra.

Não é preciso `PUBLIC_CHECKOUT_API_BASE` nem deploy de Worker para o botão funcionar. A conta é `wecarehosting`.

Sem valor calculado (pacote ainda sem preço, ou acima da capacidade), o botão não monta link: a conversa segue no WhatsApp.

## Worker, só para um Checkout Integrado futuro

O código em `workers/infinitepay-proxy/` permanece no repositório, mas **não** é o caminho publicado. Ele chamaria `POST https://api.checkout.infinitepay.io/links` e `payment_check`, com handle `wecarehosting`, valor em centavos e `redirect_url` para a página de obrigado. Chave e webhook, se um dia a conta exigir, ficam no ambiente do Worker, não no HTML. Ligar isso é decisão posterior: hoje o botão não depende disso.
