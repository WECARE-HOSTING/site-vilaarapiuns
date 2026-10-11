/**
 * IndexNow: avisa Bing, Yandex, Seznam, Naver e quem mais participar do
 * protocolo que as URLs do site existem ou mudaram, sem login no Bing
 * Webmaster Tools. Um POST em api.indexnow.org é repassado a todos os
 * buscadores participantes. (SEO W43)
 *
 * POR QUE IMPORTA AQUI. Em 11/10/2026 `site:villaarapiuns.com.br` no Bing
 * voltava vazio, e o Bing é uma das fontes de busca do ChatGPT e do Copilot.
 *
 * A PROVA DE POSSE é a chave publicada na raiz do site: o buscador baixa
 * `https://villaarapiuns.com.br/<KEY>.txt` e confere que o conteúdo é a
 * própria chave. O arquivo mora em `public/<KEY>.txt`, e o Astro o copia
 * para `dist/` no build. A chave NÃO é segredo: ela é pública por
 * construção. Trocar a chave = trocar o nome do arquivo e esta constante
 * juntos (tests/indexnow.test.mjs confere os dois).
 *
 * O QUE ENVIA: as URLs do sitemap CONSTRUÍDO (dist/sitemap-index.xml e os
 * sitemaps filhos), que são exatamente as URLs indexáveis, já sem o
 * styleguide e sem a página de "enviado".
 *
 * ANTES DE ENVIAR, confere no ar que a chave responde. Se o arquivo ainda não
 * estiver publicado (ex.: antes do merge em main), o script PARA, porque o
 * IndexNow responderia 403 e uma chave reprovada não ajuda ninguém.
 *
 *   npm run build && npm run indexnow -- --dry-run   # só lista o que mandaria
 *   npm run build && npm run indexnow                # envia
 */
import { readFileSync, existsSync } from 'node:fs';

export const HOST = 'villaarapiuns.com.br';
export const KEY = '34fae50eab48f4e9dd256335e8cfd320';
export const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
/** Limite do protocolo por requisição. */
const MAX_POR_ENVIO = 10000;

const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

/** Lê o índice construído e devolve as URLs de todas as páginas. */
export function urlsDoSitemap(dist = 'dist') {
  const indice = `${dist}/sitemap-index.xml`;
  if (!existsSync(indice)) throw new Error(`${indice} não existe. Rode \`npm run build\` antes.`);
  const urls = new Set();
  for (const filho of locs(readFileSync(indice, 'utf8'))) {
    const { pathname, host } = new URL(filho);
    if (host !== HOST) throw new Error(`sitemap filho fora do domínio: ${filho}`);
    const local = `${dist}${pathname}`;
    if (!existsSync(local)) throw new Error(`sitemap filho ${filho} não está em ${local}.`);
    for (const u of locs(readFileSync(local, 'utf8'))) {
      if (new URL(u).host !== HOST) throw new Error(`URL fora do domínio no sitemap: ${u}`);
      urls.add(u);
    }
  }
  return [...urls];
}

async function chaveNoAr() {
  try {
    const r = await fetch(KEY_LOCATION, { redirect: 'follow' });
    if (!r.ok) return `HTTP ${r.status}`;
    const corpo = (await r.text()).trim();
    return corpo === KEY ? null : `conteúdo diferente da chave (${JSON.stringify(corpo.slice(0, 60))})`;
  } catch (e) {
    return e.message;
  }
}

async function main() {
  const seco = process.argv.includes('--dry-run');
  const urls = urlsDoSitemap();
  if (urls.length === 0) { console.error('Nenhuma URL no sitemap.'); process.exit(1); }
  console.log(`${urls.length} URLs no sitemap construído.`);

  if (seco) {
    for (const u of urls) console.log(`  ${u}`);
    console.log(`\n--dry-run: nada enviado. keyLocation = ${KEY_LOCATION}`);
    return;
  }

  const problema = await chaveNoAr();
  if (problema) {
    console.error(`A chave não responde em ${KEY_LOCATION}: ${problema}.`);
    console.error('Publique o site (merge em main) antes de avisar o IndexNow. Nada foi enviado.');
    process.exit(1);
  }

  for (let i = 0; i < urls.length; i += MAX_POR_ENVIO) {
    const lote = urls.slice(i, i + MAX_POR_ENVIO);
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: lote }),
    });
    // 200 = aceito; 202 = recebido, chave ainda em validação. 400/403/422/429 = erro.
    const corpo = await r.text().catch(() => '');
    console.log(`IndexNow: HTTP ${r.status} para ${lote.length} URLs${corpo ? ` · ${corpo.slice(0, 200)}` : ''}`);
    if (r.status !== 200 && r.status !== 202) process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
