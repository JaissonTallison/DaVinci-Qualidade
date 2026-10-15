import {
  ehConstatacaoDeNc,
  STATUS_AUDITORIA,
  TIPOS_CONSTATACAO,
  type StatusAuditoria,
  type TipoConstatacao,
} from '@davinci/types';

interface ConstatacaoParaRegra {
  tipo: TipoConstatacao | (string & {});
  ncId: string | null;
}

export type AcaoAuditoria =
  'editar' | 'iniciar' | 'constatar' | 'concluir' | 'cancelar';

const PERMITIDA_EM: Record<AcaoAuditoria, readonly StatusAuditoria[]> = {
  editar: ['planejada', 'em_andamento'],
  iniciar: ['planejada'],
  constatar: ['em_andamento'],
  concluir: ['em_andamento'],
  cancelar: ['planejada', 'em_andamento'],
};

const FRASE: Record<AcaoAuditoria, string> = {
  editar: 'alterar a auditoria',
  iniciar: 'iniciar a auditoria',
  constatar: 'registrar constatações',
  concluir: 'concluir a auditoria',
  cancelar: 'cancelar a auditoria',
};

export function recusaDaAcao(
  acao: AcaoAuditoria,
  status: StatusAuditoria,
): string | null {
  if (PERMITIDA_EM[acao].includes(status)) return null;
  const esperados = PERMITIDA_EM[acao]
    .map((s) => `"${STATUS_AUDITORIA[s]}"`)
    .join(' ou ');
  return `Para ${FRASE[acao]}, ela precisa estar ${esperados}. Hoje está "${STATUS_AUDITORIA[status]}".`;
}

/** NCs (maior e menor) ainda não formalizadas: impedem concluir. */
export const ncsPendentes = (constatacoes: readonly ConstatacaoParaRegra[]) =>
  constatacoes.filter(
    (c) => ehConstatacaoDeNc(c.tipo as TipoConstatacao) && !c.ncId,
  ).length;

export function contagemPorTipo(
  constatacoes: readonly ConstatacaoParaRegra[],
): Record<TipoConstatacao, number> {
  const contagem = Object.fromEntries(
    Object.keys(TIPOS_CONSTATACAO).map((t) => [t, 0]),
  ) as Record<TipoConstatacao, number>;
  for (const c of constatacoes) contagem[c.tipo as TipoConstatacao] += 1;
  return contagem;
}

/** NC maior é Alta; NC menor é Média (ajustável depois na própria NC). */
export const gravidadeDaNc = (tipo: TipoConstatacao) =>
  tipo === 'nc_maior' ? 'alta' : 'media';

export function formatarNumeroAuditoria(
  ano: number,
  sequencial: number,
): string {
  return `AUD-${ano}-${String(sequencial).padStart(3, '0')}`;
}
