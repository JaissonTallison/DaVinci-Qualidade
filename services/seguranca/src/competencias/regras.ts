import { somarDias } from '@davinci/shared';
import {
  DIAS_DE_AVISO_DE_VENCIMENTO,
  type SituacaoDoRequisito,
} from '@davinci/types';

/**
 * EPI exigido pela função: atende quem tem uma entrega em uso (não devolvida nem anulada). Troca vencida conta
 * como vencido; troca nos próximos 30 dias, vence em breve; sem entrega em uso, não tem.
 */
export function situacaoDoEpi(
  emUso: { proximaTroca: string | null } | undefined,
  hoje: string,
): SituacaoDoRequisito {
  if (!emUso) return 'ausente';
  if (!emUso.proximaTroca) return 'em_dia';
  if (emUso.proximaTroca < hoje) return 'vencido';
  return emUso.proximaTroca <= somarDias(hoje, DIAS_DE_AVISO_DE_VENCIMENTO)
    ? 'vence_em_breve'
    : 'em_dia';
}
