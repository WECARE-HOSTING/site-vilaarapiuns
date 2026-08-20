/**
 * Caça classe fantasma: classe presente no HTML construído que NÃO tem regra
 * nenhuma no CSS construído.
 *
 * Existe porque esse defeito voltou quatro vezes nesta sessão, com causas
 * diferentes — token renomeado, @utility apagado por regex guloso, e um `\b`
 * casando dentro de um nome composto. O verificador de contraste não pega:
 * ele confere cor contra cor, e classe sem regra nenhuma simplesmente não
 * aparece para ele.
 *
 *   node tools/classes-fantasma.mjs $(find dist -name index.html)
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

let css = globSync('dist/_astro/*.css').map((f) => readFileSync(f, 'utf8')).join('\n');
// Estilo com escopo do Astro vai INLINE no <style> da página, não no CSS
// externo — sem ler os dois, toda classe de <style> parece fantasma.
for (const f of process.argv.slice(2)) {
  for (const m of readFileSync(f, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) css += '\n' + m[1];
}

// Classes que legitimamente não têm regra no CSS: gancho de script e de estado.
const PERMITIDAS = new Set(['group', 'ltr', 'peer']);

const esc = (c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const deHtml = (c) => c.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const temRegra = (c) => {
  // Tailwind escapa : / [ ] % . no seletor
  const escapado = deHtml(c).replace(/([:/[\]%.,()#&>!*+~^$'"])/g, '\\$1');
  return css.includes('.' + escapado) || css.includes('.' + esc(deHtml(c))) || css.includes('.' + esc(c));
};

const vistas = new Map();
for (const file of process.argv.slice(2)) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) {
      if (!c || PERMITIDAS.has(c)) continue;
      if (!vistas.has(c)) vistas.set(c, file);
    }
  }
}

const fantasmas = [...vistas].filter(([c]) => !temRegra(c));
console.log(`  classes distintas no HTML: ${vistas.size}`);
if (!fantasmas.length) {
  console.log('  SEM REGRA NO CSS → nenhuma');
} else {
  console.log(`  SEM REGRA NO CSS → ${fantasmas.length}:`);
  for (const [c, f] of fantasmas) console.log(`    ${c}   (${f.replace('dist/', '')})`);
  process.exitCode = 2;
}
