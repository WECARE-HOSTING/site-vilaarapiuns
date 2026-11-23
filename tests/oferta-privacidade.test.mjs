import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const checkout = readFileSync('src/components/CheckoutRapido.astro', 'utf8');
const llms = readFileSync('public/llms.txt', 'utf8');
const barra = readFileSync('src/components/BarraPromo.astro', 'utf8');

const landing = readFileSync('src/components/LandingPacote.astro', 'utf8');
const proibidoNoPagamento = /sem acréscimo|sem juros|juros absorvidos|interest-free/i;

test('o fechamento diz café, almoço e jantar, e o acréscimo do parcelamento fica com quem compra', () => {
  assert.match(checkout, /Café da manhã, almoço e jantar incluídos\./);
  assert.match(checkout, /Cartão de crédito em até 12x, pela InfinitePay\. O parcelamento tem acréscimo da InfinitePay, pago por quem compra, e o valor final aparece antes de confirmar\. Pix: fale no WhatsApp\./);
  assert.match(checkout, /Sem disponibilidade, devolução integral do valor\./);
  assert.doesNotMatch(checkout, /Todas as refeições/);
  assert.doesNotMatch(checkout, /all meals/i);
  assert.doesNotMatch(checkout, /Pix disponível/);
  assert.doesNotMatch(checkout, proibidoNoPagamento);
});

test('a landing e o FAQ dizem que o acréscimo do parcelamento é de quem compra, sem isenção', () => {
  assert.match(landing, /Sinal ou total: cartão de crédito em até 12x, pela InfinitePay\. O parcelamento tem acréscimo da InfinitePay, pago por quem compra, e o valor final aparece antes de confirmar\. Para Pix, fale no WhatsApp\./);
  assert.match(landing, /no cartão em até 12x \(InfinitePay, com acréscimo no parcelamento\)/);
  assert.doesNotMatch(landing, /data-tag=/);
  assert.doesNotMatch(landing, /INFINITETAG/);
  assert.doesNotMatch(landing, proibidoNoPagamento);
  for (const pagina of ['src/pages/pt/lp/reveillon.astro', 'src/pages/pt/lp/detox-pos-reveillon.astro']) {
    const texto = readFileSync(pagina, 'utf8');
    assert.match(texto, /O parcelamento tem acréscimo da InfinitePay, pago por quem compra, e o valor final aparece antes de confirmar\./);
    assert.doesNotMatch(texto, proibidoNoPagamento);
  }
});

test('llms.txt não chama a estadia de all meals', () => {
  assert.doesNotMatch(llms, /all meals/i);
  assert.match(llms, /breakfast, lunch and dinner/);
});

test('a faixa do topo não usa areia branca', () => {
  assert.doesNotMatch(barra, /areia branca/i);
  assert.match(barra, /Vire o ano no Rio Arapiuns\. Vagas limitadas\./);
});

test('a política, nos cinco idiomas, traz a identificação jurídica confirmada, sem prazo numérico', () => {
  for (const idioma of ['pt', 'en', 'es', 'de', 'ja']) {
    const json = JSON.parse(readFileSync(`src/i18n/${idioma}.json`, 'utf8'));
    const p = json.privacidade;
    for (const chave of ['baseT', 'baseD', 'prazoT', 'prazoD', 'transferenciaT', 'transferenciaD', 'controladorD']) {
      assert.equal(typeof p[chave], 'string', `${idioma} sem ${chave}`);
      assert.ok(p[chave].trim().length > 0, `${idioma} ${chave} vazio`);
    }
    if (idioma === 'pt') {
      assert.equal(
        p.controladorD,
        'O controlador, na operação da marca Villa Arapiuns, é a We Care Hosting Serviços Ltda, CNPJ 30.870.784/0001-70, Rua Eduardo Souza Aranha, 67, São Paulo/SP. O contato para dados e reservas é reservas@villaarapiuns.com.br.',
      );
    }
    assert.match(p.controladorD, /We Care Hosting Serviços Ltda/);
    assert.match(p.controladorD, /30\.870\.784\/0001-70/);
    assert.match(p.controladorD, /Rua Eduardo Souza Aranha, 67, São Paulo\/SP/);
    assert.match(p.controladorD, /Villa Arapiuns/);
    assert.doesNotMatch(p.controladorD, /Rua Sardenha/);
    assert.doesNotMatch(p.controladorD, /Pass[aá]rgada/);
    assert.match(p.controladorD, /reservas@villaarapiuns\.com\.br/);
    assert.doesNotMatch(p.controladorD, /contato@wecarehosting\.com\.br/i);
    assert.doesNotMatch(p.controladorD, /^(The controller is Villa Arapiuns|El responsable es Villa Arapiuns|Verantwortlich ist die Villa Arapiuns|このサイトの管理者は Villa Arapiuns)/);
    assert.doesNotMatch(p.prazoD, /\d+\s*(anos|years|años|Jahre|年)/i);
    const foraDoNome = p.controladorD.replaceAll('We Care Hosting Serviços Ltda', '');
    assert.doesNotMatch(foraDoNome, /we care/i);
    const bloco = JSON.stringify({
      base: p.baseD, prazo: p.prazoD, fora: p.transferenciaD, quem: p.controladorD,
    });
    assert.doesNotMatch(bloco, /all meals/i);
    assert.doesNotMatch(bloco, /todas as refeições/i);
  }
});
