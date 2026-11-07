/**
 * Programação (plano anual) de auditorias — serviço auditorias. Planejamento por setor, com normas,
 * frequência, meses e responsável, e acompanhamento das auditorias realizadas (vínculo manual).
 * docs/05-modulos/auditorias.md
 */
import { z } from 'zod';
import { NORMAS, type Norma, type StatusAuditoria } from './auditorias.js';
import { chaves, texto, textoOpcional } from './validadores.js';

export const FREQUENCIAS_DE_AUDITORIA = {
  mensal: 'Mensal',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  pontual: 'Pontual',
} as const;
export type FrequenciaDeAuditoria = keyof typeof FREQUENCIAS_DE_AUDITORIA;

/** Rótulos curtos dos meses (índice 1 = janeiro), para a grade anual. */
export const MESES_ABREVIADOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

const meses = z
  .array(
    z.coerce
      .number()
      .int()
      .min(1, 'Mês inválido.')
      .max(12, 'Mês inválido.'),
  )
  .min(1, 'Escolha ao menos um mês planejado.')
  .transform((m) => [...new Set(m)].sort((a, b) => a - b));

const camposDoItem = {
  ano: z.coerce
    .number()
    .int()
    .min(2000, 'Ano inválido.')
    .max(2100, 'Ano inválido.'),
  setor: texto('o setor ou processo', 150, 2),
  normas: z
    .array(z.enum(chaves(NORMAS), { error: 'Norma desconhecida.' }))
    .min(1, 'Escolha ao menos uma norma.'),
  frequencia: z.enum(chaves(FREQUENCIAS_DE_AUDITORIA), {
    error: 'Escolha a frequência.',
  }),
  meses,
  responsavel: texto('o responsável', 120, 3),
  observacoes: textoOpcional(1000),
};

export const novoItemProgramacaoSchema = z.object(camposDoItem);
export type NovoItemProgramacao = z.input<typeof novoItemProgramacaoSchema>;

export const atualizarItemProgramacaoSchema = z.object({
  ...camposDoItem,
  versao,
});

export const filtroProgramacaoSchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
});

/** Auditoria realizada vinculada a um item da programação (acompanhamento). */
export interface AuditoriaDaProgramacao {
  id: string;
  numero: string;
  status: StatusAuditoria;
  /** Mês da data de início (1–12), para marcar o realizado na grade. */
  mes: number | null;
}

/** Um item do plano anual: um setor auditado com a frequência e os meses planejados. */
export interface ItemDaProgramacao {
  id: string;
  ano: number;
  setor: string;
  normas: Norma[];
  frequencia: FrequenciaDeAuditoria;
  meses: number[];
  responsavel: string;
  observacoes: string | null;
  /** Auditorias já vinculadas a este item (vínculo manual). */
  realizadas: AuditoriaDaProgramacao[];
  versao: string;
}
