/**
 * A promessa de prazo de resposta tem de dizer o MESMO número em toda parte.
 *
 * Ela vive em cinco chaves, cada uma nos cinco idiomas — 25 strings:
 *
 *   form.sucessoD    confirmação na própria página (com JS)
 *   enviado.prazoD   página de "enviado" (sem JS)
 *   autoresp.corpo   o e-mail que o visitante recebe
 *   reservar.respD   a página do formulário, antes de enviar
 *   desc.bookSent    a <meta description> da página de enviado
 *
 * O spec argumenta longamente que uma promessa de prazo quebrada é PIOR que
 * nenhuma promessa: quem escreve para uma pousada na Amazônia e ouve "24
 * horas" organiza a viagem em cima disso. E hoje a única coisa que mantém as
 * 25 iguais é alguém lembrar das cinco chaves na hora de mexer numa. Quem
 * ajustar o prazo para 48 horas na página do formulário e esquecer da
 * auto-resposta publica duas promessas diferentes para a MESMA pessoa, no
 * mesmo pedido — e nada no projeto acusa.
 *
 * O numeral está EMBUTIDO em prosa, em cinco idiomas: não existe campo
 * "horas" para ler. A âncora é a UNIDADE, que é o pedaço que cada idioma
 * escreve de um jeito e que ninguém troca por acidente — "horas" (pt/es),
 * "hours" (en), "Stunden" (de), "時間" (ja). O japonês não separa número e
 * unidade com espaço; a expressão abaixo trata o espaço como opcional por
 * isso.
 *
 * Falha em três casos, e todos são deliberados:
 *   1. números diferentes entre chaves/idiomas — a divergência que existe
 *      para pegar;
 *   2. chave sem nenhum prazo — alguém reescreveu a copy e a promessa sumiu
 *      só naquele idioma (pior que divergir: some sem deixar rastro);
 *   3. chave com mais de um prazo na mesma frase — ambíguo para quem lê e
 *      para esta ferramenta; melhor parar do que escolher um dos dois.
 *
 *   npm run prazo:check
 */
import { readFileSync } from 'node:fs';

const IDIOMAS = ['pt', 'en', 'es', 'de', 'ja'];
const CHAVES = [
  'form.sucessoD',
  'enviado.prazoD',
  'autoresp.corpo',
  'reservar.respD',
  'desc.bookSent',
];

/** Número + unidade de hora nos cinco idiomas. Sem `g` fixo: recriado a cada uso. */
const PRAZO = () => /(\d{1,3})\s*(?:horas?|hours?|Stunden?|時間)/g;

function carrega(idioma) {
  const caminho = `src/i18n/${idioma}.json`;
  try {
    return JSON.parse(readFileSync(caminho, 'utf8'));
  } catch (e) {
    console.error(`Não consegui ler ${caminho}: ${e.message}`);
    process.exit(1);
  }
}

/** Desce um caminho "a.b.c" num dicionário. */
function valor(dic, caminho) {
  return caminho.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), dic);
}

let falhou = false;
const achados = [];   // { chave, idioma, horas }

for (const idioma of IDIOMAS) {
  const dic = carrega(idioma);
  for (const chave of CHAVES) {
    const texto = valor(dic, chave);
    if (typeof texto !== 'string' || texto.trim() === '') {
      falhou = true;
      console.error(`${idioma}.json: chave "${chave}" ausente ou vazia — a promessa de prazo não existe neste idioma.`);
      continue;
    }
    const marcas = [...texto.matchAll(PRAZO())].map((m) => Number(m[1]));
    if (marcas.length === 0) {
      falhou = true;
      console.error(`${idioma}.json → ${chave}: nenhum prazo em horas nesta string. Se a promessa mudou de forma, mude nas cinco chaves e ajuste esta ferramenta.`);
      console.error(`    ${JSON.stringify(texto)}`);
      continue;
    }
    if (marcas.length > 1) {
      falhou = true;
      console.error(`${idioma}.json → ${chave}: ${marcas.length} prazos na mesma string (${marcas.join(', ')}). Ambíguo para quem lê.`);
      continue;
    }
    achados.push({ chave, idioma, horas: marcas[0] });
  }
}

// Divergência. A maioria vira a referência só para o RELATO ficar legível —
// a falha não depende de qual lado é maioria, e sim de existir mais de um
// número. Empate técnico (duas metades) continua falhando, e as duas
// aparecem listadas.
const distintos = [...new Set(achados.map((a) => a.horas))];
if (distintos.length > 1) {
  falhou = true;
  const contagem = new Map();
  for (const a of achados) contagem.set(a.horas, (contagem.get(a.horas) ?? 0) + 1);
  const maioria = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0][0];
  console.error(`\nA promessa de prazo NÃO é a mesma em toda parte: ${distintos.sort((a, b) => a - b).join(' e ')} horas.`);
  console.error(`Maioria diz ${maioria}h. Discordam:`);
  for (const a of achados.filter((x) => x.horas !== maioria)) {
    console.error(`  ${a.idioma}.json → ${a.chave}: ${a.horas}h`);
  }
}

if (falhou) {
  console.error('\nFALHOU. O prazo prometido é um compromisso operacional: ou muda nas 25 strings, ou não muda.');
  process.exit(1);
}

console.log(`OK — ${achados.length} strings (${CHAVES.length} chaves × ${IDIOMAS.length} idiomas) prometem ${distintos[0]} horas, todas iguais.`);
