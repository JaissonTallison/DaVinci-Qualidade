import { somarMeses } from '@davinci/shared';
import {
  DIAS_DE_AVISO_DE_CALIBRACAO,
  type SituacaoInstrumento,
} from '@davinci/types';

interface CalibracaoParaRegra {
  data: string;
  aprovada: boolean;
  anulada: boolean;
}

/** Dias entre duas datas civis. */
function diasEntre(de: string, ate: string): number {
  return Math.round(
    (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) /
      86_400_000,
  );
}

/** A calibração que vale: a mais recente não anulada (por data; empate, a registrada por último vem antes na lista). */
export function calibracaoVigente<T extends CalibracaoParaRegra>(
  historico: readonly T[],
): T | null {
  return historico
    .filter((c) => !c.anulada)
    .reduce<T | null>(
      (maior, c) => (!maior || c.data > maior.data ? c : maior),
      null,
    );
}

/**
 * Situação do instrumento pelo histórico e pela data de hoje. Fora de uso vence tudo; reprovado bloqueia até nova
 * calibração aprovada; o vencimento é no dia seguinte à data da próxima calibração.
 */
export function situacaoDoInstrumento(
  emUso: boolean,
  frequenciaMeses: number,
  historico: readonly CalibracaoParaRegra[],
  hoje: string,
): {
  situacao: SituacaoInstrumento;
  ultima: string | null;
  proxima: string | null;
} {
  const vigente = calibracaoVigente(historico);
  const proxima = vigente ? somarMeses(vigente.data, frequenciaMeses) : null;
  const ultima = vigente?.data ?? null;
  if (!emUso) return { situacao: 'fora_de_uso', ultima, proxima };
  if (!vigente) return { situacao: 'sem_calibracao', ultima, proxima };
  if (!vigente.aprovada) return { situacao: 'reprovado', ultima, proxima };
  const faltam = diasEntre(hoje, proxima!);
  if (faltam < 0) return { situacao: 'vencido', ultima, proxima };
  return {
    situacao:
      faltam <= DIAS_DE_AVISO_DE_CALIBRACAO ? 'vence_em_breve' : 'em_dia',
    ultima,
    proxima,
  };
}

export { somarMeses };
