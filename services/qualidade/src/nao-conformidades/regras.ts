import { ehStatusFinalNc, STATUS_NC, type StatusNc } from '@davinci/types';

export type AcaoNc =
  | 'registrarTratamento'
  | 'enviarParaVerificacao'
  | 'verificarEficacia'
  | 'cancelar'
  | 'editar';

/**
 * De quais status cada ação parte. Cancelar e editar valem em qualquer status não final.
 * Registrar o tratamento vale também em tratamento: é como se revisa a análise depois de uma ação ineficaz.
 */
const ORIGEM_DA_ACAO: Record<
  Exclude<AcaoNc, 'cancelar' | 'editar'>,
  readonly StatusNc[]
> = {
  registrarTratamento: ['aberta', 'em_tratamento'],
  enviarParaVerificacao: ['em_tratamento'],
  verificarEficacia: ['em_verificacao'],
};

/** "Não é possível ___ uma NC encerrada." */
const ACAO_EM_UMA_NC: Record<AcaoNc, string> = {
  registrarTratamento: 'registrar o tratamento de',
  enviarParaVerificacao: 'enviar para verificação',
  verificarEficacia: 'verificar a eficácia de',
  cancelar: 'cancelar',
  editar: 'alterar',
};

/** "Para ___, ela precisa estar…" */
const PARA_A_NC: Record<Exclude<AcaoNc, 'cancelar' | 'editar'>, string> = {
  registrarTratamento: 'registrar o tratamento da NC',
  enviarParaVerificacao: 'enviar a NC para verificação',
  verificarEficacia: 'verificar a eficácia da NC',
};

/** Mensagem de recusa quando a ação não cabe no status atual; `null` quando cabe. */
export function recusaDaTransicao(
  acao: AcaoNc,
  status: StatusNc,
): string | null {
  if (ehStatusFinalNc(status))
    return `Não é possível ${ACAO_EM_UMA_NC[acao]} uma NC ${STATUS_NC[status].toLowerCase()}.`;
  if (acao === 'cancelar' || acao === 'editar') return null;
  const esperados = ORIGEM_DA_ACAO[acao];
  if (esperados.includes(status)) return null;
  const nomes = esperados.map((s) => `"${STATUS_NC[s]}"`).join(' ou ');
  return `Para ${PARA_A_NC[acao]}, ela precisa estar ${nomes}. Hoje está "${STATUS_NC[status]}".`;
}

/** Resultado da verificação: eficaz encerra; ineficaz devolve para tratamento (novo ciclo). */
export function statusAposVerificacao(eficaz: boolean): StatusNc {
  return eficaz ? 'encerrada' : 'em_tratamento';
}

/** Vencida: prazo anterior a hoje e NC ainda não terminada. `hoje` no formato AAAA-MM-DD. */
export function estaVencida(
  prazo: string,
  status: StatusNc,
  hoje: string,
): boolean {
  return !ehStatusFinalNc(status) && prazo < hoje;
}

/** `NC-2026-007`. Três dígitos no mínimo; passa de 999 sem quebrar (`NC-2026-1000`). */
export function formatarNumeroNc(ano: number, sequencial: number): string {
  return `NC-${ano}-${String(sequencial).padStart(3, '0')}`;
}

/** Data de hoje (AAAA-MM-DD) no fuso de Brasília: o prazo é uma data civil, não um instante. */
export function hojeEmBrasilia(agora = new Date()): string {
  return agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}
