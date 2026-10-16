import { somarDias, somarMeses } from '@davinci/shared';
import {
  DIAS_DE_AVISO_DE_VENCIMENTO,
  PERIODICIDADES,
  type Periodicidade,
} from '@davinci/types';

/** Depois de cumprida, a obrigação vence de novo a partir do vencimento anterior (não da data da entrega). */
export function proximoVencimento(
  atual: string,
  periodicidade: Periodicidade,
): string | null {
  const meses = PERIODICIDADES[periodicidade].meses;
  return meses ? somarMeses(atual, meses) : null;
}

export function situacaoDaObrigacao(proximo: string | null, hoje: string) {
  if (!proximo) return 'cumprida' as const;
  if (proximo < hoje) return 'vencida' as const;
  return proximo <= somarDias(hoje, DIAS_DE_AVISO_DE_VENCIMENTO)
    ? ('vence_em_breve' as const)
    : ('em_dia' as const);
}

/** Saídas em kg ou t viram kg; outras unidades (L, m³, unidades) não entram no indicador de massa. */
export const emKg = (quantidade: number, unidade: string): number | null =>
  unidade === 'kg' ? quantidade : unidade === 't' ? quantidade * 1000 : null;

/** Divide com 4 casas; sem divisor, sem indicador. */
export const porUnidade = (total: number | null, producao: number | null) =>
  total === null || !producao
    ? null
    : Math.round((total / producao) * 10000) / 10000;
