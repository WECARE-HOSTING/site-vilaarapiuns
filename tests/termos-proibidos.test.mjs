import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { acharTermosProibidos } from '../src/lib/termos.ts';

const ARQUIVOS = [
  'src/lib/fechamento.ts',
  'src/lib/utm.ts',
  'src/lib/consentimento.ts',
  'src/lib/checkout.ts',
  'src/lib/checkout-proxy.ts',
  'src/components/CheckoutRapido.astro',
  'src/components/LandingPacote.astro',
  'src/components/BannerConsentimento.astro',
  'src/components/WhatsappFlutuante.astro',
  'src/components/Rastreio.astro',
  'src/components/Footer.astro',
  'src/components/BarraPromo.astro',
  'src/layouts/BaseLayout.astro',
  'src/pages/pt/lp/pagar-reveillon.astro',
  'src/pages/pt/lp/pagar-detox.astro',
  'src/pages/pt/lp/pagamento-confirmado.astro',
  'src/content-pages/Privacidade.astro',
  'src/content-pages/PageRenderer.astro',
  'src/i18n/routes.ts',
  'workers/infinitepay-proxy/index.ts',
  'workers/infinitepay-proxy/wrangler.toml',
  'docs/checkout-infinitepay.md',
  'public/llms.txt',
];

test('arquivos novos ou editados desta entrega não usam os termos proibidos', () => {
  const achados = [];
  for (const f of ARQUIVOS) {
    const termos = acharTermosProibidos(readFileSync(f, 'utf8'));
    if (termos.length) achados.push(`${f}: ${termos.join(', ')}`);
  }
  assert.deepEqual(achados, []);
});

test('llms.txt não chama o pacote de half board', () => {
  assert.doesNotMatch(readFileSync('public/llms.txt', 'utf8'), /half board/i);
});

test('política e banner, nos cinco idiomas, também passam no filtro', () => {
  const achados = [];
  for (const idioma of ['pt', 'en', 'es', 'de', 'ja']) {
    const json = JSON.parse(readFileSync(`src/i18n/${idioma}.json`, 'utf8'));
    const texto = JSON.stringify({ consent: json.consent, privacidade: json.privacidade, privacy: json.desc.privacy, nav: json.nav.privacy });
    const termos = acharTermosProibidos(texto);
    if (termos.length) achados.push(`${idioma}: ${termos.join(', ')}`);
  }
  assert.deepEqual(achados, []);
});

test('o teste reconhece os termos, inclusive dentro de uma frase', () => {
  assert.ok(acharTermosProibidos('praia de areia branca').includes('areia branca'));
  assert.ok(acharTermosProibidos('WeCare Hosting').includes('We Care'));
  assert.deepEqual(acharTermosProibidos('a pessoa procura a casa'), []);
});
