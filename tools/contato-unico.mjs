/**
 * Guarda do contato comercial no site CONSTRUÍDO.
 *
 * O número do panfleto (+55 11 96976-0096) foi retirado em 21/08/2026: a
 * venda passou a ter canal único. Ele vivia em SITE.contact e vazava para
 * 7 CTAs, o rodapé e o JSON-LD, então reaparecer é fácil — basta alguém
 * escrever um número solto em copy em vez de ler do dado.
 *
 * Também confere o que NÃO pode subir: o repo é público e a credencial de
 * SMTP mora fora do webroot.
 *
 *   node tools/contato-unico.mjs
 */
import { readFileSync, globSync, existsSync } from 'node:fs';

const PROIBIDO = ['5511969760096', '11969760096', '969760096', '96976-0096'];
const OBRIGATORIO = ['5547992067078', 'gabriela@wecarehosting.com.br'];

const paginas = globSync('dist/**/*.html');
if (paginas.length === 0) {
  console.error('Nenhum HTML em dist/. Rode `npm run build` antes.');
  process.exit(1);
}

let falhou = false;

for (const f of paginas) {
  const html = readFileSync(f, 'utf8');
  for (const proibido of PROIBIDO) {
    if (html.includes(proibido)) {
      falhou = true;
      console.error(`${f}: número retirado ainda presente — "${proibido}"`);
    }
  }
}

// O rodapé está em toda página, então o contato novo tem de estar em todas.
for (const obrigatorio of OBRIGATORIO) {
  const sem = paginas.filter((f) => !readFileSync(f, 'utf8').includes(obrigatorio));
  if (sem.length) {
    falhou = true;
    console.error(`"${obrigatorio}" ausente em ${sem.length} de ${paginas.length} páginas, ex.: ${sem[0]}`);
  }
}

// Segredo não sobe. O .example sobe; o real, nunca.
if (existsSync('dist/va-config.php')) {
  falhou = true;
  console.error('dist/va-config.php EXISTE. Credencial no webroot e a caminho de um repo público.');
}
for (const f of globSync('dist/**/*.php')) {
  if (/smtpPass\s*=>\s*['"][^'"]+['"]/.test(readFileSync(f, 'utf8'))) {
    falhou = true;
    console.error(`${f}: senha de SMTP embutida no código.`);
  }
}

if (falhou) { console.error('\nFALHOU.'); process.exit(1); }
console.log(`OK — ${paginas.length} páginas: contato único, sem resíduo, sem segredo.`);
