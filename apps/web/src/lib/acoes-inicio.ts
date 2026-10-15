"use server";

import type { NcsDoMes, PainelDeVencimentos, Prazo } from "@davinci/types";
import { chamarApi } from "./api";

export type Periodo = 30 | 90 | 365;

/** Meses do gráfico de NCs para cada período do filtro. */
export async function mesesDoPeriodo(dias: Periodo): Promise<number> {
  return dias === 30 ? 3 : dias === 90 ? 6 : 12;
}

/** Dados que mudam com o filtro de período do início: prazos no horizonte e NCs por mês. */
export async function dadosDoPeriodo(
  dias: Periodo,
  comNcs: boolean,
): Promise<{ prazos: Prazo[]; ncsPorMes: NcsDoMes[] | null }> {
  const valido: Periodo = dias === 90 || dias === 365 ? dias : 30;
  const [painel, ncs] = await Promise.all([
    chamarApi<PainelDeVencimentos>(`/paineis/vencimentos?dias=${valido}`),
    comNcs
      ? chamarApi<NcsDoMes[]>(
          `/nao-conformidades/por-mes?meses=${await mesesDoPeriodo(valido)}`,
        )
      : null,
  ]);
  return {
    prazos: painel.ok ? painel.dados.prazos : [],
    ncsPorMes: ncs?.ok ? ncs.dados : null,
  };
}
