/**
 * Inventário do acervo bruto: metadados + dHash, SEM olhar nenhuma imagem.
 *
 * Existe por uma conta de custo. O acervo tem centenas de fotos e ler cada uma
 * com visão custaria a ordem de um milhão de tokens. Rajada de celular é a
 * maior parte do volume — vinte fotos do mesmo instante —, e rajada dá para
 * detectar sem ver: dHash de 8×8 e distância de Hamming resolvem.
 *
 * O que sai daqui é o número de MOMENTOS distintos, não de arquivos. Só os
 * representantes de cada momento vão para as folhas de contato
 * (tools/acervo-folhas.mjs), e só as folhas custam tokens.
 *
 *   node tools/acervo-inventario.mjs [raiz] [saida.json]
 *
 * Não escreve nada em src/ nem move arquivo nenhum: é leitura pura.
 */
import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import sharp from 'sharp';

const RAIZ = process.argv[2] ?? 'Assets/Media';
const SAIDA = process.argv[3] ?? 'inventario.json';
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

/** Distância a partir da qual duas fotos deixam de ser o mesmo instante.
 *  5 em 64 bits foi calibrado na mão: pega rajada e recorte leve, e não
 *  colapsa duas fotos diferentes do mesmo lugar. */
const LIMITE = 5;

function varrer(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    if (nome.startsWith('.')) continue;
    const caminho = join(dir, nome);
    const st = statSync(caminho);
    if (st.isDirectory()) saida.push(...varrer(caminho));
    else if (EXT.has(extname(nome).toLowerCase())) saida.push({ caminho, bytes: st.size });
  }
  return saida;
}

/**
 * dHash: 9×8 em cinza, e cada bit responde "este pixel é mais claro que o
 * vizinho da direita?". Gradiente sobrevive a reencode e a redimensionamento,
 * que é exatamente o que separa rajada de foto diferente.
 *
 * `.rotate()` antes de tudo: sem ele, retrato gravado com orientação EXIF
 * entra deitado e o hash não casa com a mesma foto já rotacionada.
 */
async function dhash(caminho) {
  const buf = await sharp(caminho).rotate().greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  let bits = '';
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) bits += buf[y * 9 + x] > buf[y * 9 + x + 1] ? '1' : '0';
  return BigInt('0b' + bits);
}

const hamming = (a, b) => {
  let x = a ^ b, n = 0;
  while (x) { x &= x - 1n; n++; }
  return n;
};

const arquivos = varrer(RAIZ);
process.stderr.write(`${arquivos.length} arquivos em ${RAIZ}\n`);

const fotos = [];
for (const [i, f] of arquivos.entries()) {
  try {
    const m = await sharp(f.caminho).metadata();
    // Dimensão COMO SE VÊ: com orientação EXIF de 5 a 8 o arquivo guarda
    // deitado o que a tela mostra em pé.
    const girado = m.orientation && m.orientation >= 5;
    const w = girado ? m.height : m.width;
    const h = girado ? m.width : m.height;
    fotos.push({
      arquivo: relative(RAIZ, f.caminho),
      pasta: relative(RAIZ, dirname(f.caminho)) || '.',
      w, h,
      orientacao: w === h ? 'quadrado' : w > h ? 'paisagem' : 'retrato',
      mb: +(f.bytes / 1048576).toFixed(2),
      hash: (await dhash(f.caminho)).toString(16).padStart(16, '0'),
    });
  } catch (e) {
    process.stderr.write(`  ILEGÍVEL ${f.caminho}: ${e.message}\n`);
  }
  if ((i + 1) % 100 === 0) process.stderr.write(`  ${i + 1}/${arquivos.length}\n`);
}

/* Agrupamento por momento. União simples: cada foto entra no primeiro grupo
   cujo representante está a menos de LIMITE dela. Cruza pasta de propósito —
   é assim que aparecem os derivados baixados do Airbnb que repetem foto que
   já existe em resolução cheia. */
const grupos = [];
for (const foto of fotos) {
  const h = BigInt('0x' + foto.hash);
  const grupo = grupos.find((g) => hamming(BigInt('0x' + g.rep.hash), h) <= LIMITE);
  if (grupo) grupo.membros.push(foto);
  else grupos.push({ rep: foto, membros: [foto] });
}

/* O representante do momento é o arquivo de maior área — e, empatado, o mais
   pesado. Numa rajada é o que tem mais pixel para sobreviver a corte. */
for (const g of grupos) {
  g.membros.sort((a, b) => b.w * b.h - a.w * a.h || b.mb - a.mb);
  g.rep = g.membros[0];
}
grupos.sort((a, b) => a.rep.pasta.localeCompare(b.rep.pasta) || a.rep.arquivo.localeCompare(b.rep.arquivo));

mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, JSON.stringify({ raiz: RAIZ, limite: LIMITE, fotos, grupos }, null, 1));

const porPasta = {};
for (const g of grupos) (porPasta[g.rep.pasta] ??= { momentos: 0, arquivos: 0 }).momentos++;
for (const f of fotos) (porPasta[f.pasta] ??= { momentos: 0, arquivos: 0 }).arquivos++;

console.log('\nmomentos  arquivos  retrato  pasta');
for (const [pasta, n] of Object.entries(porPasta).sort()) {
  const retrato = fotos.filter((f) => f.pasta === pasta && f.orientacao === 'retrato').length;
  console.log(
    String(n.momentos).padStart(8) + String(n.arquivos).padStart(10) +
    String(retrato).padStart(9) + '  ' + pasta
  );
}
console.log(`\n${fotos.length} arquivos → ${grupos.length} momentos distintos`);
console.log(`inventário em ${SAIDA}`);
