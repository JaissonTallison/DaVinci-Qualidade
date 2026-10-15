import { somarDias } from '@davinci/shared';
import { DIAS_DE_AVISO_DO_CA, type SituacaoEntrega } from '@davinci/types';

/** Próxima troca pela vida útil; sem vida útil, não há troca periódica. */
export const proximaTroca = (data: string, vidaUtilDias: number | null) =>
  vidaUtilDias ? somarDias(data, vidaUtilDias) : null;

/** CA vale até o dia da validade, inclusive. */
export const caValidoEm = (validadeCa: string, data: string) =>
  validadeCa >= data;
export const caVenceEmBreve = (validadeCa: string, hoje: string) =>
  validadeCa >= hoje && validadeCa <= somarDias(hoje, DIAS_DE_AVISO_DO_CA);

export function situacaoDaEntrega(
  e: {
    proximaTroca: string | null;
    devolvidoEm: string | null;
    motivoAnulacao: string | null;
  },
  hoje: string,
): SituacaoEntrega {
  if (e.motivoAnulacao) return 'anulada';
  if (e.devolvidoEm) return 'devolvido';
  return e.proximaTroca && e.proximaTroca < hoje ? 'troca_vencida' : 'em_uso';
}
