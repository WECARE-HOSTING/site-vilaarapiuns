/**
 * Transcodifica em lote a receita medida em docs/video.md §1 (a mesma que
 * gerou o clipe já no ar), gera o cartaz de cada clipe e imprime um resumo
 * para revisão antes do commit. Não decide o que entra — só produz.
 *
 * Cartaz: um quadro a 40% da duração, mesma lógica de acervo-folhas.mjs (foge
 * de fade de abertura e de claquete), aqui salvo como arquivo próprio em vez
 * de miniatura de folha.
 *
 * Nunca amplia: se a origem for menor que a altura pedida, sai do tamanho da
 * origem — a mesma regra de PRODUCT.md, "Procedência da fotografia".
 *
 *   node tools/video-web.mjs <manifesto.tsv> <dir-video-saida> <dir-poster-saida>
 *
 * Manifesto: uma linha por clipe, colunas separadas por TAB —
 *   caminho-de-origem \t corte-em-segundos \t duração-em-segundos \t nome-saida \t recorte-9x16(sim/vazio)
 *
 * Linhas em branco e começando com # são ignoradas.
 */
import { readFileSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';

const [manifesto, dirVideo, dirPoster] = process.argv.slice(2);
if (!manifesto || !dirVideo || !dirPoster) {
  console.error('uso: node tools/video-web.mjs <manifesto.tsv> <dir-video-saida> <dir-poster-saida>');
  process.exit(1);
}
mkdirSync(dirVideo, { recursive: true });
mkdirSync(dirPoster, { recursive: true });

const linhas = readFileSync(manifesto, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

function alturaReal(origem) {
  const saida = execFileSync('ffprobe', [
    '-v', 'quiet', '-select_streams', 'v:0',
    '-show_entries', 'stream=height', '-of', 'csv=p=0', origem,
  ], { encoding: 'utf8' }).trim();
  return +saida || 720;
}

const resumo = [];

for (const linha of linhas) {
  const [origem, corteStr, duracaoStr, nome, recorte9x16] = linha.split('\t').map((s) => s?.trim());
  if (!origem || !nome) {
    process.stderr.write(`  linha malformada, pulando: ${linha}\n`);
    continue;
  }
  const corte = +corteStr || 0;
  const duracao = +duracaoStr || 6;

  // Nunca amplia: a altura de saída é o menor entre 720 e a altura real da origem.
  const altura = Math.min(720, alturaReal(origem));
  const destinoVideo = join(dirVideo, `${nome}.mp4`);
  const destinoPoster = join(dirPoster, `${nome}-poster.jpg`);

  const filtroVideo = recorte9x16
    ? `crop=ih*9/16:ih,scale=-2:${altura},fps=24`
    : `scale=-2:${altura},fps=24`;

  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-ss', String(corte), '-i', origem, '-t', String(duracao), '-an',
    '-vf', filtroVideo,
    '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '31', '-tune', 'film',
    '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p', '-g', '48',
    '-movflags', '+faststart', destinoVideo,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });

  // Cartaz a 40% da duração final (do CLIPE JÁ CORTADO, não da origem inteira).
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-ss', String(duracao * 0.4), '-i', destinoVideo,
    '-frames:v', '1', '-update', '1', destinoPoster,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });

  const bytes = statSync(destinoVideo).size;
  resumo.push({
    nome,
    origem: basename(origem),
    duracao,
    mb: +(bytes / 1048576).toFixed(2),
    recorte: recorte9x16 ? '9:16' : 'nativo',
  });
}

console.log('\nnome                     origem                                  dur   MB    recorte');
for (const r of resumo) {
  console.log(
    `${r.nome.padEnd(24)} ${r.origem.slice(0, 38).padEnd(38)} ${String(r.duracao).padStart(3)}s ${String(r.mb).padStart(5)} ${r.recorte}`
  );
}
console.log(`\n${resumo.length} clipe(s) em ${dirVideo}, cartazes em ${dirPoster}.`);
console.log('Nada foi decidido automaticamente — revisar antes de mover para produção.');
