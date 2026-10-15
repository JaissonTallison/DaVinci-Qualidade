/**
 * Auditorias e constatações (serviço auditorias): contratos e regras de validação. docs/05-modulos/auditorias.md
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

export const TIPOS_AUDITORIA = {
  interna: 'Interna',
  certificacao: 'Externa de certificação',
  fornecedor: 'De fornecedor',
} as const;
export type TipoAuditoria = keyof typeof TIPOS_AUDITORIA;

export const NORMAS = {
  iso9001: 'ISO 9001',
  iso14001: 'ISO 14001',
  iso45001: 'ISO 45001',
  iso27001: 'ISO 27001',
  iso28000: 'ISO 28000',
  iso31000: 'ISO 31000',
  iatf16949: 'IATF 16949',
} as const;
export type Norma = keyof typeof NORMAS;

export const STATUS_AUDITORIA = {
  planejada: 'Planejada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
} as const;
export type StatusAuditoria = keyof typeof STATUS_AUDITORIA;

export const TIPOS_CONSTATACAO = {
  conformidade: 'Conformidade',
  nc_maior: 'NC maior',
  nc_menor: 'NC menor',
  observacao: 'Observação',
  oportunidade: 'Oportunidade de melhoria',
} as const;
export type TipoConstatacao = keyof typeof TIPOS_CONSTATACAO;
export const ehConstatacaoDeNc = (t: TipoConstatacao) =>
  t === 'nc_maior' || t === 'nc_menor';

/** Prazo padrão da NC formalizada a partir de uma constatação. */
export const DIAS_DE_PRAZO_DA_NC_DE_AUDITORIA = 30;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

const camposDaAuditoria = {
  tipo: z.enum(chaves(TIPOS_AUDITORIA), { error: 'Escolha o tipo.' }),
  escopo: texto('o escopo', 1000, 10),
  normas: z
    .array(z.enum(chaves(NORMAS), { error: 'Norma desconhecida.' }))
    .min(1, 'Escolha ao menos uma norma.')
    .max(7)
    .transform((n) => [...new Set(n)]),
  areas: textoOpcional(300),
  auditorLider: texto('o auditor líder', 120, 3),
  equipe: textoOpcional(300),
  representante: textoOpcional(120),
  dataInicio: data('a data de início'),
  dataFim: data('a data de fim'),
};
const fimDepoisDoInicio = (d: { dataInicio: string; dataFim: string }) =>
  d.dataFim >= d.dataInicio;
const ERRO_DATAS = {
  path: ['dataFim'],
  message: 'A data de fim não pode ser anterior à de início.',
};

export const novaAuditoriaSchema = z
  .object(camposDaAuditoria)
  .refine(fimDepoisDoInicio, ERRO_DATAS);
export type NovaAuditoria = z.input<typeof novaAuditoriaSchema>;
export const atualizarAuditoriaSchema = z
  .object({ ...camposDaAuditoria, versao })
  .refine(fimDepoisDoInicio, ERRO_DATAS);
export const iniciarAuditoriaSchema = z.object({ versao });
export const concluirAuditoriaSchema = z.object({
  versao,
  conclusao: texto('a conclusão da auditoria', 4000, 20),
});
export const cancelarAuditoriaSchema = z.object({
  versao,
  motivo: texto('o motivo do cancelamento', 500, 10),
});

export const constatacaoSchema = z.object({
  tipo: z.enum(chaves(TIPOS_CONSTATACAO), {
    error: 'Escolha o tipo da constatação.',
  }),
  norma: z.enum(chaves(NORMAS), { error: 'Escolha a norma.' }),
  clausula: opcional(
    z
      .string()
      .trim()
      .max(20, 'Use no máximo 20 caracteres.')
      .regex(
        /^[0-9A-Za-z.]+$/,
        'Informe a cláusula como na norma (ex.: 8.5.1).',
      ),
  ),
  area: textoOpcional(120),
  descricao: texto('a constatação', 2000, 10),
  evidencia: textoOpcional(2000),
});
export type NovaConstatacao = z.input<typeof constatacaoSchema>;

export const registrarConstatacaoSchema = z.object({
  versao,
  constatacao: constatacaoSchema,
});
export const alterarConstatacaoSchema = z.object({
  versao,
  constatacaoId: z.uuid('Constatação inválida.'),
  constatacao: constatacaoSchema,
});

/** Constatação de NC → NC no serviço qualidade. Responsável e prazo podem ser ajustados; prazo padrão de 30 dias. */
export const formalizarNcSchema = z.object({
  versao,
  constatacaoId: z.uuid('Constatação inválida.'),
  responsavel: texto('o responsável pela NC', 120, 3),
  prazo: opcional(data('o prazo')),
});

export const filtroAuditoriasSchema = z.object({
  busca: opcional(z.string().trim().max(100, 'Use no máximo 100 caracteres.')),
  status: enumOpcional(STATUS_AUDITORIA, 'Status desconhecido.'),
  tipo: enumOpcional(TIPOS_AUDITORIA, 'Tipo desconhecido.'),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce
    .number()
    .int()
    .refine(
      (v) => v === 25 || v === 50 || v === 100,
      'Use 25, 50 ou 100 por página.',
    )
    .default(25),
});

export interface Constatacao {
  id: string;
  ordem: number;
  tipo: TipoConstatacao;
  norma: Norma;
  clausula: string | null;
  area: string | null;
  descricao: string;
  evidencia: string | null;
  /** Preenchidos quando a constatação vira NC no serviço qualidade. */
  ncId: string | null;
  ncNumero: string | null;
}

export interface Auditoria {
  id: string;
  numero: string;
  tipo: TipoAuditoria;
  escopo: string;
  normas: Norma[];
  areas: string | null;
  auditorLider: string;
  equipe: string | null;
  representante: string | null;
  dataInicio: string;
  dataFim: string;
  status: StatusAuditoria;
  conclusao: string | null;
  motivoCancelamento: string | null;
  constatacoes: Constatacao[];
  /** Quantas constatações de cada tipo. */
  contagem: Record<TipoConstatacao, number>;
  /** NCs (maior e menor) ainda sem NC formalizada: impedem concluir. */
  ncsPendentes: number;
  concluidaEm: string | null;
  versao: string;
}

export type AuditoriaResumo = Pick<
  Auditoria,
  | 'id'
  | 'numero'
  | 'tipo'
  | 'escopo'
  | 'normas'
  | 'auditorLider'
  | 'dataInicio'
  | 'dataFim'
  | 'status'
  | 'ncsPendentes'
> & {
  constatacoesDeNc: number;
};

export interface ResumoAuditorias {
  planejadas: number;
  emAndamento: number;
  /** Constatações de NC em auditorias concluídas nos últimos 12 meses. */
  ncsUltimos12Meses: number;
}
