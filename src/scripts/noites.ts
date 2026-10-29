/** Detox: limita chegada a [min,max] e as noites para o check-out não passar de data-fim. */
const DIA = 864e5;
export function limitarNoites(f: HTMLFormElement): { chegada: Date; noites: number; saida: Date } {
  const ch = f.elements.namedItem('chegada') as HTMLInputElement;
  const sel = f.elements.namedItem('noites') as HTMLSelectElement | HTMLInputElement;
  if (ch.min && ch.value < ch.min) ch.value = ch.min;
  if (ch.max && ch.value > ch.max) ch.value = ch.max;
  const chegada = new Date(ch.value + 'T00:00:00Z');
  const fim = f.dataset.fim ? new Date(f.dataset.fim + 'T00:00:00Z') : null;
  if (sel instanceof HTMLSelectElement && fim && !isNaN(chegada.getTime())) {
    const limite = Math.round((fim.getTime() - chegada.getTime()) / DIA);
    for (const o of sel.options) o.disabled = +o.value > limite;
    if (+sel.value > limite) sel.value = String(limite);
  }
  const noites = +sel.value || 0;
  return { chegada, noites, saida: new Date(chegada.getTime() + noites * DIA) };
}
