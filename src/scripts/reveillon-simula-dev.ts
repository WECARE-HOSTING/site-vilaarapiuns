/**
 * Simulação de data SÓ para o `astro dev`. O build de produção não
 * importa este arquivo: o CheckoutRapido só chama o import dentro de
 * `import.meta.env.DEV`, e o Vite corta esse ramo no build.
 *
 * Não existe parâmetro de URL no artefato que vai para o ar.
 */
export function lerSimula(search: string): number | null {
  const bruto = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('va_simula');
  if (!bruto) return null;
  const ms = Date.parse(bruto);
  return Number.isNaN(ms) ? null : ms;
}
