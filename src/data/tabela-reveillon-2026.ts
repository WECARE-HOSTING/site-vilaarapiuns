/**
 * Leitura da TABELA-REVEILLON-2026 v1 (src/data/tabela-reveillon-2026-v1.txt).
 * Única fonte de valores do checkout e da conferência. Sem nome de cliente.
 */
export type Faixa = 'cheio' | 'reveillon15' | 'pix20';
export type Ocupacao = 'single' | 'duplo' | 'triplo' | 'crianca_4_12' | 'crianca_ate_3';

export interface ConfigQuartos {
  single: number;
  duplo: number;
  triplo: number;
  cri03: number;
  cri412: number;
}

export interface TotalTabela {
  ok: boolean;
  excede: boolean;
  acimaDe26: boolean;
  total: number;
  pessoas: number;
  bangalos: number;
}

const FAIXAS: Faixa[] = ['cheio', 'reveillon15', 'pix20'];
const OCUPACOES: Ocupacao[] = ['single', 'duplo', 'triplo', 'crianca_4_12', 'crianca_ate_3'];

export function parseTabela(texto: string): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const linha of texto.split(/\r?\n/)) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith('#')) continue;
    const i = limpa.indexOf('=');
    if (i <= 0) continue;
    saida[limpa.slice(0, i).trim()] = limpa.slice(i + 1).trim();
  }
  return saida;
}

export function numero(mapa: Record<string, string>, chave: string): number {
  const bruto = mapa[chave];
  if (bruto == null) throw new Error(`tabela sem ${chave}`);
  const n = Number(bruto);
  if (!Number.isFinite(n)) throw new Error(`tabela ${chave} não é número`);
  return n;
}

export function grade(mapa: Record<string, string>, prefixo: string): Record<Faixa, Record<Ocupacao, number>> {
  const g = {} as Record<Faixa, Record<Ocupacao, number>>;
  for (const faixa of FAIXAS) {
    g[faixa] = {} as Record<Ocupacao, number>;
    for (const oc of OCUPACOES) g[faixa][oc] = numero(mapa, `${prefixo}.${faixa}.${oc}`);
  }
  return g;
}

export function totalTabela(mapa: Record<string, string>, faixa: Faixa, c: ConfigQuartos): TotalTabela {
  const quartos = grade(mapa, 'total_quarto');
  const single = Math.max(c.single || 0, 0);
  const duplo = Math.max(c.duplo || 0, 0);
  const triplo = Math.max(c.triplo || 0, 0);
  const cri03 = Math.max(c.cri03 || 0, 0);
  const cri412 = Math.max(c.cri412 || 0, 0);
  const bangalos = single + duplo + triplo;
  const pessoas = single * 1 + duplo * 2 + triplo * 3 + cri03 + cri412;
  const maxPessoas = numero(mapa, 'capacidade_max_pessoas');
  const maxBangalos = numero(mapa, 'capacidade_max_bangalos');
  const acimaDe26 = pessoas > maxPessoas;
  const excede = acimaDe26 || bangalos > maxBangalos;
  const total = single * quartos[faixa].single
    + duplo * quartos[faixa].duplo
    + triplo * quartos[faixa].triplo
    + cri412 * quartos[faixa].crianca_4_12
    + cri03 * quartos[faixa].crianca_ate_3;
  return { ok: total > 0 && !excede, excede, acimaDe26, total, pessoas, bangalos };
}

/** Faixas que o webhook aceita naquele instante. Depois do prazo, só o cheio. */
export function faixasVigentes(mapa: Record<string, string>, agoraMs: number): Faixa[] {
  const fim = Date.parse(mapa.validade_descontos);
  const aberto = Math.floor(agoraMs / 1000) <= Math.floor(fim / 1000);
  return aberto ? [...FAIXAS] : ['cheio'];
}

export interface ResultadoConferencia {
  bate: boolean;
  manual: boolean;
  motivo: string;
  faixa: Faixa | null;
  esperadoCentavos: number | null;
  pagoCentavos: number;
  diferencaCentavos: number;
  /** Não envia mensagem: não há canal. No máximo um registro de diferença. */
  acao: 'nenhuma' | 'vendas_registra_diferenca';
}

/** min(horário do pagamento + 48h, teto 28/11/2026 23:59:59 BRT). */
export function prazoDiferenca(mapa: Record<string, string>, pagamentoMs: number): number {
  const teto = Date.parse(mapa['regra.diferenca.teto'] || mapa.validade_descontos);
  const horas = Number(mapa['regra.diferenca.horas'] || 48);
  return Math.min(pagamentoMs + horas * 60 * 60 * 1000, teto);
}

export interface RegistroDiferenca extends ResultadoConferencia {
  status: 'pre_reserva_pendente' | 'na_tabela' | 'conferencia_manual';
  confirmada: false;
  mensagemUnica: boolean;
  mensagens: 0 | 1;
  enviada: false;
  motivoEnvio: 'sem_canal' | 'nao_aplicavel' | 'fora_do_prazo';
  dentroDoPrazo: boolean;
  prazoMs: number | null;
}

/**
 * Diferença a menor: um único registro, status pre_reserva_pendente, sem
 * confirmação. Não manda mensagem — não há canal nem credencial.
 */
export function registrarDiferenca(
  mapa: Record<string, string>,
  pagoCentavos: number,
  pagamentoMs: number,
  agoraMs: number,
  config?: ConfigQuartos & { faixa?: Faixa },
): RegistroDiferenca {
  const base = conferirPago(mapa, pagoCentavos, agoraMs, config);
  const prazoMs = prazoDiferenca(mapa, pagamentoMs);
  const dentroDoPrazo = agoraMs <= prazoMs;
  const mensagemUnica = mapa['regra.diferenca.mensagem_unica'] === 'true';
  const statusDiferenca = mapa['regra.diferenca.status_ate_pagar'];
  if (statusDiferenca !== 'pre_reserva_pendente') {
    throw new Error(`status de diferença desconhecido: ${statusDiferenca}`);
  }
  if (base.acao !== 'vendas_registra_diferenca') {
    return {
      ...base,
      status: base.bate ? 'na_tabela' : 'conferencia_manual',
      confirmada: false,
      mensagemUnica,
      mensagens: 0,
      enviada: false,
      motivoEnvio: 'nao_aplicavel',
      dentroDoPrazo,
      prazoMs,
    };
  }
  return {
    ...base,
    status: statusDiferenca,
    confirmada: false,
    mensagemUnica,
    mensagens: dentroDoPrazo && mensagemUnica ? 1 : 0,
    enviada: false,
    motivoEnvio: dentroDoPrazo ? 'sem_canal' : 'fora_do_prazo',
    dentroDoPrazo,
    prazoMs,
  };
}

function centavos(reais: number): number {
  return Math.round(reais * 100);
}

function combinacoes(mapa: Record<string, string>): ConfigQuartos[] {
  const maxB = numero(mapa, 'capacidade_max_bangalos');
  const maxP = numero(mapa, 'capacidade_max_pessoas');
  const lista: ConfigQuartos[] = [];
  for (let single = 0; single <= maxB; single++) {
    for (let duplo = 0; duplo <= maxB - single; duplo++) {
      for (let triplo = 0; triplo <= maxB - single - duplo; triplo++) {
        if (single + duplo + triplo === 0) continue;
        for (let cri412 = 0; cri412 <= 10; cri412++) {
          const pessoas = single + duplo * 2 + triplo * 3 + cri412;
          if (pessoas > maxP) continue;
          lista.push({ single, duplo, triplo, cri03: 0, cri412 });
        }
      }
    }
  }
  return lista;
}

/**
 * Confere um valor pago (centavos) com a tabela. Não envia nada ao cliente.
 * Sem a configuração do pedido, aceita só se o valor for exatamente um total
 * vigente. Sinal de 30% não fecha sozinho: fica para conferência manual.
 */
export function conferirPago(
  mapa: Record<string, string>,
  pagoCentavos: number,
  agoraMs: number,
  config?: ConfigQuartos & { faixa?: Faixa },
): ResultadoConferencia {
  const base = {
    pagoCentavos,
    diferencaCentavos: 0,
    acao: 'nenhuma' as const,
    faixa: null as Faixa | null,
    esperadoCentavos: null as number | null,
  };
  if (!Number.isInteger(pagoCentavos) || pagoCentavos <= 0) {
    return { ...base, bate: false, manual: true, motivo: 'valor_fora_da_tabela' };
  }
  const vigentes = faixasVigentes(mapa, agoraMs);
  if (config) {
    const faixa = config.faixa && vigentes.includes(config.faixa) ? config.faixa : vigentes[0];
    const esperado = centavos(totalTabela(mapa, faixa, config).total);
    const diff = esperado - pagoCentavos;
    if (pagoCentavos === esperado) {
      return { ...base, bate: true, manual: false, motivo: 'tabela', faixa, esperadoCentavos: esperado };
    }
    if (diff > 0) {
      return {
        ...base,
        bate: false,
        manual: true,
        motivo: 'pago_menor',
        faixa,
        esperadoCentavos: esperado,
        diferencaCentavos: diff,
        acao: 'vendas_registra_diferenca',
      };
    }
    return { ...base, bate: false, manual: true, motivo: 'valor_fora_da_tabela', faixa, esperadoCentavos: esperado, diferencaCentavos: diff };
  }
  for (const faixa of vigentes) {
    for (const c of combinacoes(mapa)) {
      if (centavos(totalTabela(mapa, faixa, c).total) === pagoCentavos) {
        return { ...base, bate: true, manual: false, motivo: 'tabela', faixa, esperadoCentavos: pagoCentavos };
      }
    }
  }
  return { ...base, bate: false, manual: true, motivo: 'valor_fora_da_tabela' };
}
