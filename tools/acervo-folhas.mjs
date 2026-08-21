/**
 * Folhas de contato: muitas miniaturas numeradas numa imagem só.
 *
 * É a peça que torna viável catalogar um acervo de milhares de arquivos.
 * O custo de uma imagem em contexto é proporcional à ÁREA, não à quantidade
 * de coisas dentro dela: ler 20 fotos de 2048px uma a uma custa ~44k tokens;
 * as mesmas 20 numa folha de 1600×1040 custam ~2k. O fator de 20 é a folha.
 *
 * Vídeo entra pelo mesmo caminho — um quadro extraído a 40% da duração vira
 * miniatura como qualquer foto. Assim o acervo de vídeo é catalogado sem
 * assistir a nada.
 *
 *   node tools/acervo-folhas.mjs <manifesto.txt> <dir-saida> [colunas] [linhas]
 *
 * O manifesto é um caminho por linha, relativo à raiz do projeto. A ordem do
 * arquivo é a ordem das células, e o índice impresso em cada célula é a linha
 * do manifesto — é por ele que a leitura se refere a cada foto.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const [manifesto, dirSaida, colunas = 5, linhas = 4] = process.argv.slice(2);
if (!manifesto || !dirSaida) {
  console.error('uso: node tools/acervo-folhas.mjs <manifesto.txt> <dir-saida> [colunas] [linhas]');
  process.exit(1);
}
const COLS = +colunas, ROWS = +linhas;
const CELA_W = 320, CELA_H = 240, RODAPE = 20;
const POR_FOLHA = COLS * ROWS;
const VIDEO = new Set(['.mp4', '.mov', '.m4v', '.avi']);

const arquivos = readFileSync(manifesto, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
mkdirSync(dirSaida, { recursive: true });

/** Um quadro a 40% da duração: escapa de fade de abertura e de claquete. */
function quadroDeVideo(caminho) {
  const dur = +execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration',
    '-of', 'csv=p=0', caminho], { encoding: 'utf8' }).trim() || 1;
  return execFileSync('ffmpeg', ['-v', 'quiet', '-ss', String(dur * 0.4), '-i', caminho,
    '-frames:v', '1', '-f', 'image2', '-vcodec', 'png', '-'],
    { maxBuffer: 64 * 1024 * 1024 });
}

async function miniatura(caminho) {
  const fonte = VIDEO.has(extname(caminho).toLowerCase()) ? quadroDeVideo(caminho) : caminho;
  return sharp(fonte).rotate()
    .resize(CELA_W, CELA_H, { fit: 'contain', background: { r: 20, g: 24, b: 18 } })
    .toBuffer();
}

const folhas = Math.ceil(arquivos.length / POR_FOLHA);
for (let f = 0; f < folhas; f++) {
  const lote = arquivos.slice(f * POR_FOLHA, (f + 1) * POR_FOLHA);
  const W = COLS * CELA_W, H = Math.ceil(lote.length / COLS) * (CELA_H + RODAPE);
  const camadas = [];
  let rotulos = '';

  for (const [i, caminho] of lote.entries()) {
    const col = i % COLS, lin = Math.floor(i / COLS);
    const x = col * CELA_W, y = lin * (CELA_H + RODAPE);
    try {
      camadas.push({ input: await miniatura(caminho), left: x, top: y });
    } catch (e) {
      process.stderr.write(`  ILEGÍVEL ${caminho}: ${e.message.slice(0, 80)}\n`);
    }
    // Índice global (linha do manifesto, base 1) impresso sob a miniatura.
    const n = f * POR_FOLHA + i + 1;
    rotulos += `<text x="${x + 6}" y="${y + CELA_H + 15}" font-family="monospace" `
      + `font-size="14" fill="#e8e4d8">${n}</text>`;
  }

  const svg = `<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#141812"/>${rotulos}</svg>`;
  const nome = join(dirSaida, `folha-${String(f + 1).padStart(2, '0')}.jpg`);
  await sharp(Buffer.from(svg)).composite(camadas).jpeg({ quality: 82 }).toFile(nome);
  console.log(`${nome}  ${W}×${H}  células ${f * POR_FOLHA + 1}–${f * POR_FOLHA + lote.length}`);
}

/* O índice em texto: é ele que liga o número impresso na folha ao caminho. */
writeFileSync(join(dirSaida, 'indice.txt'),
  arquivos.map((a, i) => `${i + 1}\t${a}`).join('\n') + '\n');
console.log(`\n${arquivos.length} arquivos em ${folhas} folhas · índice em ${join(dirSaida, 'indice.txt')}`);
