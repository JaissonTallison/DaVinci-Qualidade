import {
  ehStatusFinalPlano,
  STATUS_PLANO,
  type SituacaoTarefa,
  type StatusPlano,
} from '@davinci/types';

/** A situação vem do banco como texto; a restrição de valores está no CHECK da tabela. */

interface TarefaParaRegra {
  situacao: SituacaoTarefa | (string & {});
  prazo: string;
}

const ativas = <T extends TarefaParaRegra>(tarefas: readonly T[]) =>
  tarefas.filter((t) => t.situacao !== 'cancelada');

/**
 * Status de um plano não final a partir das tarefas: tudo concluído leva a "aguardando eficácia";
 * qualquer pendente mantém (ou devolve) "em execução".
 */
export function statusPelasTarefas(
  tarefas: readonly TarefaParaRegra[],
): StatusPlano {
  const validas = ativas(tarefas);
  return validas.length > 0 && validas.every((t) => t.situacao === 'concluida')
    ? 'aguardando_eficacia'
    : 'em_execucao';
}

/** Concluídas ÷ não canceladas, arredondado (0 a 100). */
export function progresso(tarefas: readonly TarefaParaRegra[]): number {
  const validas = ativas(tarefas);
  if (!validas.length) return 0;
  return Math.round(
    (validas.filter((t) => t.situacao === 'concluida').length /
      validas.length) *
      100,
  );
}

/** Maior prazo entre as tarefas não canceladas (AAAA-MM-DD). */
export function prazoDoPlano(tarefas: readonly TarefaParaRegra[]): string {
  return ativas(tarefas).reduce(
    (maior, t) => (t.prazo > maior ? t.prazo : maior),
    '',
  );
}

export const tarefaAtrasada = (t: TarefaParaRegra, hoje: string) =>
  t.situacao === 'pendente' && t.prazo < hoje;

export function planoAtrasado(
  status: StatusPlano,
  tarefas: readonly TarefaParaRegra[],
  hoje: string,
): boolean {
  return (
    !ehStatusFinalPlano(status) && tarefas.some((t) => tarefaAtrasada(t, hoje))
  );
}

/** Recusa quando o plano já terminou; `null` quando ainda aceita mudanças. */
export function recusaPorStatusFinal(status: StatusPlano): string | null {
  return ehStatusFinalPlano(status)
    ? `O plano está ${STATUS_PLANO[status].toLowerCase()}: não aceita mais alterações.`
    : null;
}

export function formatarNumeroPlano(ano: number, sequencial: number): string {
  return `PA-${ano}-${String(sequencial).padStart(3, '0')}`;
}
