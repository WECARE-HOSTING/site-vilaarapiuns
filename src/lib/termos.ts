/**
 * Termos que não podem entrar em copy nova nem em arquivo editado desta entrega.
 * Frases compostas casam em qualquer lugar; palavras curtas exigem fronteira,
 * para não acusar "procura" por causa de "cura".
 */

export const TERMOS_PROIBIDOS: { nome: string; re: RegExp }[] = [
  { nome: 'areia branca', re: /areia branca/i },
  { nome: 'pôr do sol', re: /p[oô]r do sol/i },
  { nome: 'pé na areia', re: /p[eé]s? na areia/i },
  { nome: 'Caribe', re: /\bcaribe\b/i },
  { nome: 'perto de', re: /perto de/i },
  { nome: 'próxima a', re: /pr[oó]xima a/i },
  { nome: 'pensão', re: /\bpens[aã]o\b/i },
  { nome: 'half board', re: /half board/i },
  { nome: 'terapêutico', re: /terap[eê]utic/i },
  { nome: 'desintoxica', re: /desintoxic/i },
  { nome: 'imunidade', re: /\bimunidade\b/i },
  { nome: 'sound healing', re: /sound healing/i },
  { nome: 'We Care', re: /we\s*care/i },
  { nome: 'cura', re: /\bcura\b/i },
];

export function acharTermosProibidos(texto: string): string[] {
  return TERMOS_PROIBIDOS.filter((t) => t.re.test(texto)).map((t) => t.nome);
}
