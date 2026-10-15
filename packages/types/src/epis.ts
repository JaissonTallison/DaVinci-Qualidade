/**
 * Controle de EPIs: catálogo com CA e entregas por funcionário (serviço seguranca). docs/05-modulos/epis.md
 */
import { z } from 'zod';
import {
  chaves,
  data,
  enumOpcional,
  opcional,
  texto,
  textoOpcional,
} from './validadores.js';

export const MOTIVOS_ENTREGA = {
  primeira_entrega: 'Primeira entrega',
  troca_desgaste: 'Troca por desgaste',
  troca_periodica: 'Troca periódica',
  perda: 'Perda',
  dano: 'Dano',
} as const;
export type MotivoEntrega = keyof typeof MOTIVOS_ENTREGA;

export const SITUACOES_ENTREGA = {
  em_uso: 'Em uso',
  troca_vencida: 'Troca vencida',
  devolvido: 'Devolvido',
  anulada: 'Anulada',
} as const;
export type SituacaoEntrega = keyof typeof SITUACOES_ENTREGA;

/** Dias de antecedência do aviso de CA vencendo. */
export const DIAS_DE_AVISO_DO_CA = 30;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

const camposDoEpi = {
  nome: texto('o nome do EPI', 120, 3),
  ca: z
    .string({ error: 'Informe o número do CA.' })
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(
      z.string().regex(/^\d{3,7}$/, 'O CA tem de 3 a 7 dígitos (ex.: 32157).'),
    ),
  validadeCa: data('a validade do CA'),
  vidaUtilDias: opcional(
    z.coerce
      .number({ error: 'Informe a vida útil em dias.' })
      .int('Use um número inteiro de dias.')
      .min(1, 'Ao menos 1 dia.')
      .max(3650, 'No máximo 3.650 dias.'),
  ),
};
export const novoEpiSchema = z.object(camposDoEpi);
export type NovoEpi = z.input<typeof novoEpiSchema>;
export const atualizarEpiSchema = z.object({ ...camposDoEpi, versao });
export const situacaoDoEpiSchema = z.object({
  versao,
  ativo: z.boolean({ error: 'Informe se fica ativo.' }),
});
export const filtroEpisSchema = z.object({
  situacao: z.enum(['ativos', 'inativos', 'todos']).default('ativos'),
});

export const registrarEntregaSchema = z.object({
  funcionarioId: z.uuid('Escolha o funcionário.'),
  epiId: z.uuid('Escolha o EPI.'),
  quantidade: z.coerce
    .number({ error: 'Informe a quantidade.' })
    .int('Use um número inteiro.')
    .min(1, 'Ao menos 1.')
    .max(1000),
  data: data('a data da entrega'),
  motivo: z.enum(chaves(MOTIVOS_ENTREGA), { error: 'Escolha o motivo.' }),
  termoAssinado: z.boolean().default(false),
  observacao: textoOpcional(500),
});
export type RegistrarEntrega = z.input<typeof registrarEntregaSchema>;

export const devolverEntregaSchema = z.object({
  data: data('a data da devolução'),
});
export const anularEntregaSchema = z.object({
  motivo: texto('o motivo da anulação', 300, 10),
});

export const filtroEntregasSchema = z.object({
  funcionarioId: opcional(z.uuid('Funcionário inválido.')),
  epiId: opcional(z.uuid('EPI inválido.')),
  situacao: enumOpcional(SITUACOES_ENTREGA, 'Situação desconhecida.'),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce
    .number()
    .int()
    .refine(
      (v) => v === 25 || v === 50 || v === 100,
      'Use 25, 50 ou 100 por página.',
    )
    .default(50),
});

export interface Epi {
  id: string;
  nome: string;
  ca: string;
  validadeCa: string;
  /** CA vencido hoje: o EPI não pode ser entregue. */
  caVencido: boolean;
  caVenceEmBreve: boolean;
  vidaUtilDias: number | null;
  ativo: boolean;
  versao: string;
}

export interface EntregaEpi {
  id: string;
  funcionarioId: string;
  funcionarioNome: string;
  funcionarioMatricula: string;
  epiId: string;
  epiNome: string;
  /** CA do EPI no dia da entrega. */
  ca: string;
  quantidade: number;
  data: string;
  motivo: MotivoEntrega;
  termoAssinado: boolean;
  observacao: string | null;
  proximaTroca: string | null;
  devolvidoEm: string | null;
  motivoAnulacao: string | null;
  situacao: SituacaoEntrega;
}

export interface ResumoEpis {
  trocasVencidas: number;
  /** CAs de EPIs ativos que vencem em até 30 dias ou já venceram. */
  casVencendo: number;
  semTermo: number;
}
