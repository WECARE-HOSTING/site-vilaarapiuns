/**
 * Resolver mínimo (sem dependência nova) só pra permitir que os testes
 * importem arquivos .ts que usam o alias "@/" (configurado no tsconfig
 * pra bundlers/editor, mas que o Node puro não entende sozinho).
 *
 * O projeto já assume Node >= 22 (ver tools/testa-endpoint.mjs) por causa
 * do suporte nativo a importar .ts direto — este loader só completa isso
 * com a resolução do alias, sem precisar instalar nada (ex: tsconfig-paths,
 * vitest). Registrado via `--experimental-loader` no script "test" do
 * package.json.
 */

const SRC_URL = new URL('../src/', import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    let mapped = new URL(specifier.slice(2), SRC_URL).href;
    if (!/\.[a-zA-Z]+$/.test(mapped)) mapped += '.ts';
    return nextResolve(mapped, context);
  }
  // Imports relativos sem extensão (ex: `./config` dentro de utils.ts) também
  // não resolvem sozinhos no Node puro — só o alias "@/" ganhava esse
  // tratamento antes, mas o mesmo problema aparece em imports internos do
  // próprio código-fonte que não usam o alias.
  const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
  if (isRelative && !/\.[a-zA-Z]+$/.test(specifier)) {
    try {
      return await nextResolve(specifier, context);
    } catch (err) {
      if (err?.code !== 'ERR_MODULE_NOT_FOUND') throw err;
      return nextResolve(`${specifier}.ts`, context);
    }
  }
  return nextResolve(specifier, context);
}

// utils.ts importa os dicionários (`./en.json` etc) sem atributo de import
// (`with { type: "json" }`) porque bundlers como o do Astro/Vite não exigem
// isso. O Node puro em ESM estrito exige. Em vez de mexer no código-fonte só
// pra agradar o runner de teste, o loader intercepta `.json` e entrega o
// módulo ele mesmo — sem passar pela validação de atributo do Node.
export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const { readFile } = await import('node:fs/promises');
    const { fileURLToPath } = await import('node:url');
    const source = await readFile(fileURLToPath(url), 'utf8');
    return { format: 'json', source, shortCircuit: true };
  }
  if (url.endsWith('.ts')) {
    // `import.meta.env` (injetado pelo Vite/Astro em runtime real) não existe
    // no Node puro — vira `undefined`, e `import.meta.env.DEV` explode. Só
    // usado hoje pra um `console.warn` de debug, então um literal fixo (modo
    // "produção") é equivalente pros testes.
    const result = await nextLoad(url, context);
    if (typeof result.source === 'string' || result.source instanceof Uint8Array) {
      const text = typeof result.source === 'string'
        ? result.source
        : Buffer.from(result.source).toString('utf8');
      if (text.includes('import.meta.env')) {
        const patched = text.replaceAll('import.meta.env', '({DEV:false,PROD:true,SSR:false})');
        return { ...result, source: patched };
      }
    }
    return result;
  }
  return nextLoad(url, context);
}
