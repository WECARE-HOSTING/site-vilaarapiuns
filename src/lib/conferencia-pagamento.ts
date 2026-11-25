/**
 * Conferência do webhook `paid` da InfinitePay.
 *
 * DESLIGADO. O site publicado é HTML estático: não há processo para receber
 * o POST. Esta função só compara um valor já recebido com a tabela e devolve
 * um registro. Não envia mensagem ao cliente.
 *
 * Fonte do corpo do evento `paid` e de payment_check:
 * https://www.infinitepay.io/checkout-documentacao
 */
import { readFileSync } from 'node:fs';
import { parseTabela, registrarDiferenca, type ConfigQuartos, type Faixa } from '@/data/tabela-reveillon-2026';

export const WEBHOOK_PAGO_LIGADO = false;

export interface EventoPago {
  paid?: boolean;
  amount?: number;
  paid_amount?: number;
  capture_method?: string;
  order_nsu?: string;
  invoice_slug?: string;
  transaction_nsu?: string;
}

export function tabelaOficial(): Record<string, string> {
  return parseTabela(readFileSync('src/data/tabela-reveillon-2026-v1.txt', 'utf8'));
}

export function registrarConferencia(
  evento: EventoPago,
  agoraMs: number,
  config?: ConfigQuartos & { faixa?: Faixa },
): ResultadoConferencia & { ligado: false; enviadoAoCliente: false } {
  const pago = typeof evento.paid_amount === 'number' ? evento.paid_amount : -1;
  const resultado = registrarDiferenca(tabelaOficial(), pago, agoraMs, agoraMs, config);
  return { ...resultado, ligado: false, enviadoAoCliente: false as const };
}
