/**
 * Competências por função: o que cada função exige (treinamentos no codex, EPIs na segurança, ASO de todos)
 * e a conformidade de cada pessoa. docs/05-modulos/competencias.md
 */
import { z } from 'zod';

export const SITUACOES_DO_REQUISITO = {
  em_dia: 'Em dia',
  vence_em_breve: 'Vence em breve',
  vencido: 'Vencido',
  ausente: 'Não tem',
} as const;
export type SituacaoDoRequisito = keyof typeof SITUACOES_DO_REQUISITO;

export const TIPOS_DE_REQUISITO = {
  aso: 'Exame (ASO)',
  treinamento: 'Treinamento',
  epi: 'EPI',
} as const;
export type TipoDeRequisito = keyof typeof TIPOS_DE_REQUISITO;

export const filtroDaFuncaoSchema = z.object({
  funcaoId: z.uuid('Função inválida.'),
});

/** Treinamentos obrigatórios da função: a lista inteira substitui a anterior. */
export const definirTreinamentosDaFuncaoSchema = z.object({
  funcaoId: z.uuid('Função inválida.'),
  treinamentoIds: z
    .array(z.uuid('Treinamento inválido.'))
    .max(60, 'No máximo 60 treinamentos por função.')
    .default([]),
});

/** EPIs obrigatórios da função, cada um com o risco do PGR que o justifica (opcional). */
export const definirEpisDaFuncaoSchema = z.object({
  funcaoId: z.uuid('Função inválida.'),
  itens: z
    .array(
      z.object({
        epiId: z.uuid('EPI inválido.'),
        riscoId: z.uuid('Risco inválido.').nullish(),
      }),
    )
    .max(60, 'No máximo 60 EPIs por função.')
    .default([]),
});

export interface RequisitoDaFuncao {
  tipo: TipoDeRequisito;
  /** Id do treinamento ou do EPI; "aso" para o exame. */
  id: string;
  nome: string;
  /** Norma do treinamento ou CA do EPI. */
  referencia: string | null;
  /** EPI: o perigo do PGR que justifica. */
  motivo: string | null;
  riscoId: string | null;
}

export interface RequisitoAtendido extends RequisitoDaFuncao {
  situacao: SituacaoDoRequisito;
  /** Validade (treinamento, próximo exame) ou próxima troca (EPI); null quando não vence. */
  validade: string | null;
}

export interface ConformidadeDoFuncionario {
  funcionarioId: string;
  requisitos: RequisitoAtendido[];
  /** Requisitos vencidos ou ausentes. */
  pendentes: number;
}

export interface LinhaDaMatriz {
  funcionarioId: string;
  nome: string;
  matricula: string;
  /** Chave `tipo:id` do requisito → situação. */
  situacoes: Record<string, SituacaoDoRequisito>;
  pendentes: number;
}

export interface MatrizDaFuncao {
  funcaoId: string;
  requisitos: RequisitoDaFuncao[];
  linhas: LinhaDaMatriz[];
}

export const chaveDoRequisito = (r: Pick<RequisitoDaFuncao, 'tipo' | 'id'>) =>
  `${r.tipo}:${r.id}`;

/** Vencido ou ausente pesa como pendência; vence em breve é só aviso. */
export const pendente = (s: SituacaoDoRequisito) =>
  s === 'vencido' || s === 'ausente';
