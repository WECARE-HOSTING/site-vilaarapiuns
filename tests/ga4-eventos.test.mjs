import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function htmls(dir) {
  return readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.html')).map((f) => join(dir, String(f)));
}
const dist = 'dist';
test('build publica click_whatsapp no layout e click_reservar nas páginas de pagamento', { skip: !existsSync(dist) }, () => {
  const home = readFileSync(join(dist, 'pt/index.html'), 'utf8');
  assert.match(home, /click_whatsapp/);
  assert.match(home, /generate_lead/);
  const pagar = htmls(join(dist, 'pt/lp')).map((f) => readFileSync(f, 'utf8')).join('\n');
  const scripts = readdirSync(join(dist, '_astro')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dist, '_astro', f), 'utf8')).join('\n');
  assert.match(pagar + scripts, /click_reservar/);
});
