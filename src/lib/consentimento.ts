/**
 * Escolha LGPD. Essenciais não desligam: só lembram esta escolha.
 * Meta (Pixel) só depois de marketing. Google entra pelo Consent Mode.
 */

export const CHAVE_CONSENTIMENTO = 'va_consent_v1';

export type EscolhaConsentimento = {
  essenciais: true;
  estatisticas: boolean;
  marketing: boolean;
  atualizadoEm: string;
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type EstadoConsentMode = {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  functionality_storage: 'granted';
  security_storage: 'granted';
};

export function escolhaPadraoNegada(agora = ''): EscolhaConsentimento {
  return { essenciais: true, estatisticas: false, marketing: false, atualizadoEm: agora };
}

export function aceitarTudo(agora: string): EscolhaConsentimento {
  return { essenciais: true, estatisticas: true, marketing: true, atualizadoEm: agora };
}

export function recusarNaoEssenciais(agora: string): EscolhaConsentimento {
  return escolhaPadraoNegada(agora);
}

export function preferencias(
  parcial: { estatisticas: boolean; marketing: boolean },
  agora: string,
): EscolhaConsentimento {
  return {
    essenciais: true,
    estatisticas: !!parcial.estatisticas,
    marketing: !!parcial.marketing,
    atualizadoEm: agora,
  };
}

export function lerEscolha(storage: StorageLike): EscolhaConsentimento | null {
  try {
    const cru = storage.getItem(CHAVE_CONSENTIMENTO);
    if (!cru) return null;
    const obj = JSON.parse(cru) as Partial<EscolhaConsentimento>;
    if (obj.essenciais !== true) return null;
    if (typeof obj.estatisticas !== 'boolean' || typeof obj.marketing !== 'boolean') return null;
    return {
      essenciais: true,
      estatisticas: obj.estatisticas,
      marketing: obj.marketing,
      atualizadoEm: typeof obj.atualizadoEm === 'string' ? obj.atualizadoEm : '',
    };
  } catch {
    return null;
  }
}

export function salvarEscolha(storage: StorageLike, escolha: EscolhaConsentimento): void {
  storage.setItem(CHAVE_CONSENTIMENTO, JSON.stringify(escolha));
}

/** Estado antes de qualquer clique: tudo que não é essencial fica negado. */
export function consentModePadrao(): EstadoConsentMode {
  return consentModeDe(escolhaPadraoNegada());
}

export function consentModeDe(escolha: Pick<EscolhaConsentimento, 'estatisticas' | 'marketing'>): EstadoConsentMode {
  const estatisticas = escolha.estatisticas ? 'granted' : 'denied';
  const marketing = escolha.marketing ? 'granted' : 'denied';
  return {
    analytics_storage: estatisticas,
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
    functionality_storage: 'granted',
    security_storage: 'granted',
  };
}

export type EventoMeta = 'PageView' | 'InitiateCheckout' | 'Contact' | 'Purchase';

/** O Pixel inteiro, e cada evento dele, depende de marketing. */
export function deveDispararMeta(evento: EventoMeta, escolha: EscolhaConsentimento | null, pixelId: string): boolean {
  void evento;
  return !!(escolha?.marketing && pixelId.trim());
}
