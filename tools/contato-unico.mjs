/**
 * Guarda do contato comercial no site CONSTRUÍDO.
 *
 * O número do panfleto (+55 11 96976-0096) foi retirado em 21/08/2026: a
 * venda passou a ter canal único. Ele vivia em SITE.contact e vazava para
 * 7 CTAs, o rodapé e o JSON-LD, então reaparecer é fácil — basta alguém
 * escrever um número solto em copy em vez de ler do dado.
 *
 * Também confere o que NÃO pode subir: o repo é público e a credencial de
 * SMTP mora fora do webroot. E confere o PHP construído contra o mesmo
 * número: `enviar-mail.php` tem um link wa.me hardcoded para a
 * auto-resposta, fora do alcance da varredura de HTML (achado I5 do review
 * da Tarefa 6).
 *
 *   node tools/contato-unico.mjs
 */
import { readFileSync, globSync, existsSync } from 'node:fs';

const PROIBIDO = ['5511969760096', '11969760096', '969760096', '96976-0096'];
const OBRIGATORIO = ['5547992067078', 'reservas@vilaarapiuns.com.br'];

const paginas = globSync('dist/**/*.html');
if (paginas.length === 0) {
  console.error('Nenhum HTML em dist/. Rode `npm run build` antes.');
  process.exit(1);
}

let falhou = false;

// Rotas sem a chrome comum (sem Footer, portanto sem onde viver o contato),
// declaradas EXPLICITAMENTE por caminho — não por um sniff de conteúdo.
//
// A versão anterior decidia "esta página exige contato" varrendo o HTML por
// um `<footer` literal. Parece razoável até o dia em que o componente
// Footer parar de renderizar numa página de conteúdo de verdade: nesse dia a
// página perde o bloco de contato E a tag `<footer` no mesmo acidente, o
// sniff conclui "sem rodapé, portanto isenta", e o script fica CALADO
// exatamente no pior caso — uma regressão real mascarada de página isenta
// por uma heurística que nunca devia ter existido. Uma lista explícita não
// tem esse ponto cego: uma página só sai da obrigação se alguém a colocar
// aqui de propósito.
//
// Hoje só existe uma rota assim: o stub de detecção de idioma construído a
// partir de `src/pages/index.astro`, que o Astro gera sem cabeçalho nem
// rodapé (é um redirect de 0s, ver comentário no próprio arquivo).
const ROTAS_SEM_CHROME = ['dist/index.html'];

const paginasComContatoObrigatorio = paginas.filter((f) => !ROTAS_SEM_CHROME.includes(f));

// Se uma rota isenta passar a ter rodapé, a lista ficou desatualizada — a
// página deixou de ser um stub sem chrome e provavelmente devia estar
// exigindo contato também. Não falha o build por si só, mas merece atenção.
for (const rota of ROTAS_SEM_CHROME) {
  if (existsSync(rota) && readFileSync(rota, 'utf8').includes('<footer')) {
    console.warn(`AVISO: "${rota}" está listada como sem chrome, mas contém <footer> — ROTAS_SEM_CHROME pode estar desatualizada.`);
  }
}

// PHP construído entra na MESMA varredura de número retirado. `enviar-mail.php`
// hardcoda um link wa.me (não lido do dicionário — ver comentário no próprio
// arquivo), então é tão capaz de reviver o número velho quanto qualquer HTML.
const paginasPhp = globSync('dist/**/*.php');

for (const f of [...paginas, ...paginasPhp]) {
  const html = readFileSync(f, 'utf8');
  for (const proibido of PROIBIDO) {
    if (html.includes(proibido)) {
      falhou = true;
      console.error(`${f}: número retirado ainda presente — "${proibido}"`);
    }
  }
}

/**
 * Fecha o ponto cego descrito no achado I5 do review da Tarefa 6:
 * `enviar-mail.php:35` hardcoda `https://wa.me/5547992067078` para a
 * auto-resposta, fora do alcance da checagem de HTML acima (PHP não é
 * página) e fora do dicionário (mover para lá criaria cinco cópias em vez
 * de uma). O número canônico é `SITE.contact.whatsapp` em
 * `src/data/site.ts`; sem esta checagem, o PHP podia ficar com o número
 * velho enquanto o resto do site já mostra o novo, e ninguém notaria até
 * uma reserva ir para o WhatsApp errado. Aqui é a mesma pergunta feita ao
 * HTML, feita ao PHP: todo link wa.me/ presente tem de ser exatamente o
 * número obrigatório.
 */
const WA_CANONICO = `https://wa.me/${OBRIGATORIO[0]}`;
for (const f of paginasPhp) {
  const php = readFileSync(f, 'utf8');
  const links = php.match(/https:\/\/wa\.me\/\d+/g) ?? [];
  for (const link of links) {
    if (link !== WA_CANONICO) {
      falhou = true;
      console.error(`${f}: link wa.me diverge do número canônico — "${link}" (esperado "${WA_CANONICO}")`);
    }
  }
}

// Toda página fora da lista de isenção tem de conter o contato — ter ou não
// ter `<footer` no HTML é irrelevante agora; ver ROTAS_SEM_CHROME acima.
for (const obrigatorio of OBRIGATORIO) {
  const sem = paginasComContatoObrigatorio.filter((f) => !readFileSync(f, 'utf8').includes(obrigatorio));
  if (sem.length) {
    falhou = true;
    console.error(`"${obrigatorio}" ausente em ${sem.length} de ${paginasComContatoObrigatorio.length} páginas obrigatórias, ex.: ${sem[0]}`);
  }
}

// Segredo não sobe. O .example sobe; o real, nunca.
if (existsSync('dist/va-config.php')) {
  falhou = true;
  console.error('dist/va-config.php EXISTE. Credencial no webroot e a caminho de um repo público.');
}
for (const f of paginasPhp) {
  if (/smtpPass\s*=>\s*['"][^'"]+['"]/.test(readFileSync(f, 'utf8'))) {
    falhou = true;
    console.error(`${f}: senha de SMTP embutida no código.`);
  }
}

if (falhou) { console.error('\nFALHOU.'); process.exit(1); }
console.log(`OK — ${paginas.length} páginas e ${paginasPhp.length} arquivo(s) PHP verificados, ${paginasComContatoObrigatorio.length} páginas exigem contato: contato único, sem resíduo, sem segredo.`);
