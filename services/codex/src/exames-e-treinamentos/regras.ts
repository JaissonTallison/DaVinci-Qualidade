import {
  DIAS_DE_AVISO_DE_VENCIMENTO,
  type SituacaoVencimento,
} from '@davinci/types';

const dias = (de: string, ate: string) =>
  Math.round(
    (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) /
      86_400_000,
  );

/** Vencido no dia seguinte à validade; até 30 dias antes, "vence em breve". */
export function situacaoDoVencimento(
  validade: string,
  hoje: string,
): SituacaoVencimento {
  const faltam = dias(hoje, validade);
  if (faltam < 0) return 'vencido';
  return faltam <= DIAS_DE_AVISO_DE_VENCIMENTO ? 'vence_em_breve' : 'em_dia';
}
