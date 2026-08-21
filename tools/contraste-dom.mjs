import { readFileSync } from 'node:fs';

const { parseDocument } = await import('htmlparser2');

const css = readFileSync('src/styles/global.css', 'utf8');
const TOK = Object.fromEntries([...css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})/g)].map(m => [m[1], m[2]]));

const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const L = h => { const [r, g, b] = hex2rgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const ratio = (f, b) => { const a = Math.max(L(f), L(b)), c = Math.min(L(f), L(b)); return (a + 0.05) / (c + 0.05); };
const over = (f, b, al) => {
  const F = hex2rgb(f), B = hex2rgb(b);
  return '#' + F.map((v, i) => Math.round(al * v + (1 - al) * B[i]).toString(16).padStart(2, '0')).join('');
};
const resolve = (tok, alphaStr, bg) => {
  const hex = TOK[tok]; if (!hex) return null;
  if (!alphaStr) return hex;
  return over(hex, bg, parseInt(alphaStr, 10) / 100);
};

const findings = [];
let naoVerificavel = 0, checados = 0;

for (const file of process.argv.slice(2)) {
  const doc = parseDocument(readFileSync(file, 'utf8'));
  const walk = (node, bg, fg, tituloCor, etiquetaCor, dentroGradiente) => {
    if (node.type === 'text') {
      const t = node.data.trim();
      if (t && !dentroGradiente) {
        checados++;
        const r = ratio(fg, bg);
        if (r < 4.5) findings.push({ file, txt: t.slice(0, 44), fg, bg, r });
      } else if (t && dentroGradiente) naoVerificavel++;
      return;
    }
    if (node.type !== 'tag') { (node.children || []).forEach(c => walk(c, bg, fg, tituloCor, etiquetaCor, dentroGradiente)); return; }

    const cls = (node.attribs?.class || '').split(/\s+/);
    if (node.attribs?.['aria-hidden'] === 'true' || cls.includes('sr-only')) return;
    if (['script', 'style', 'head', 'svg', 'title'].includes(node.name)) return;

    let g = dentroGradiente || cls.some(c => /^(bg-gradient|bg-linear)/.test(c));

    // O cabeçalho em modo "sobre foto" declara `bg-transparent sobre-escuro`:
    // o que está ATRÁS dele é a fotografia do herói, e a legibilidade ali é
    // garantida pelo véu em gradiente que é IRMÃO deste nó, não ancestral —
    // então a herança de fundo não alcança. Medir contra o fundo da página
    // daria falha onde não há falha. Mesma classe de caso que o gradiente.
    if (cls.includes('bg-transparent') && cls.includes('sobre-escuro')) g = true;

    // `sobre-escuro` NÃO define fundo — só o texto e o título. O fundo vem da
    // classe bg-* irmã, então mexer em `bg` aqui daria falso negativo.
    if (cls.includes('sobre-escuro')) { fg = TOK['espuma']; tituloCor = TOK['areia']; etiquetaCor = TOK['sol']; }
    for (const c of cls) {
      let m = /^bg-([a-z][a-z0-9-]*?)(?:\/(\d+))?$/.exec(c);
      if (m && TOK[m[1]]) { const v = resolve(m[1], m[2], bg); if (v) bg = v; }
      m = /^text-([a-z][a-z0-9-]*?)(?:\/(\d+))?$/.exec(c);
      if (m && TOK[m[1]]) { const v = resolve(m[1], m[2], bg); if (v) fg = v; }
      if (c === 'cor-titulo') fg = tituloCor;
      // `etiqueta` pinta com var(--cor-etiqueta), que vira por contexto. Sem
      // isto o verificador media a etiqueta com a cor do corpo — e a etiqueta
      // é justamente o valor mais fraco da escada, o primeiro a reprovar.
      if (c === 'etiqueta') fg = etiquetaCor;
    }
    if (['h1', 'h2', 'h3'].includes(node.name) && !cls.some(c => /^text-[a-z]/.test(c) && TOK[c.replace(/^text-/, '').split('/')[0]])) fg = tituloCor;

    (node.children || []).forEach(c => walk(c, bg, fg, tituloCor, etiquetaCor, g));
  };
  // Padrão do documento: chão de areia, corpo em tinta de mar, título em mar,
  // etiqueta em areia molhada. Era o inverso até 21/08/2026.
  walk(doc, TOK['areia-clara'], TOK['mar-fundo'], TOK['mar'], TOK['areia-funda'], false);
}

console.log(`  nós de texto checados: ${checados}  ·  sobre gradiente (não verificável estaticamente): ${naoVerificavel}`);
const vistos = new Set();
const unicos = findings.filter(f => { const k = f.txt + f.fg + f.bg; if (vistos.has(k)) return false; vistos.add(k); return true; });
if (!unicos.length) console.log('  ABAIXO DE 4,5:1 → nenhum');
else {
  console.log(`  ABAIXO DE 4,5:1 → ${unicos.length} casos distintos:`);
  unicos.sort((a, b) => a.r - b.r).forEach(f =>
    console.log(`    ${f.r.toFixed(2)}:1  fg ${f.fg} sobre bg ${f.bg}  "${f.txt}"  (${f.file.replace('dist/', '')})`));
}
