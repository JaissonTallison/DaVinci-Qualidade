/**
 * Exames ocupacionais (ASO, NR-7) e treinamentos (NRs) dos funcionários (serviço codex). docs/05-modulos/exames-e-treinamentos.md
 */
import { z } from 'zod';
import { exameDoAsoSchema, type ExameDoAso } from './esocial.js';
import { chaves, data, opcional, texto, textoOpcional } from './validadores.js';

export const TIPOS_ASO = {
  admissional: 'Admissional',
  periodico: 'Periódico',
  retorno_ao_trabalho: 'Retorno ao trabalho',
  mudanca_de_risco: 'Mudança de risco',
  demissional: 'Demissional',
} as const;
export type TipoAso = keyof typeof TIPOS_ASO;

export const RESULTADOS_ASO = {
  apto: 'Apto',
  apto_com_restricao: 'Apto com restrição',
  inapto: 'Inapto',
} as const;
export type ResultadoAso = keyof typeof RESULTADOS_ASO;

export const SITUACOES_VENCIMENTO = {
  vencido: 'Vencido',
  vence_em_breve: 'Vence em até 30 dias',
  em_dia: 'Em dia',
} as const;
export type SituacaoVencimento = keyof typeof SITUACOES_VENCIMENTO;
export const DIAS_DE_AVISO_DE_VENCIMENTO = 30;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
export const anularRegistroSchema = z.object({
  motivo: texto('o motivo da anulação', 300, 10),
});

// ---------------------------------------------------------------- ASO

export const registrarAsoSchema = z
  .object({
    funcionarioId: z.uuid('Escolha o funcionário.'),
    tipo: z.enum(chaves(TIPOS_ASO), { error: 'Escolha o tipo de exame.' }),
    data: data('a data do exame'),
    resultado: z.enum(chaves(RESULTADOS_ASO), {
      error: 'Escolha o resultado.',
    }),
    proximoExame: opcional(data('a data do próximo exame')),
    medico: textoOpcional(120),
    crm: textoOpcional(20),
    /** UF do CRM (eSocial S-2220). */
    ufCrm: opcional(
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{2}$/, 'UF com 2 letras.'),
    ),
    observacao: textoOpcional(300),
    /** Exames realizados com o procedimento da tabela 27 do eSocial. */
    exames: z.array(exameDoAsoSchema).max(30).default([]),
  })
  .refine((a) => a.tipo === 'demissional' || a.proximoExame, {
    path: ['proximoExame'],
    message: 'Informe quando vence (o próximo periódico).',
  })
  .refine((a) => !a.proximoExame || a.proximoExame > a.data, {
    path: ['proximoExame'],
    message: 'O próximo exame vem depois da data deste.',
  });
export type RegistrarAso = z.input<typeof registrarAsoSchema>;

export interface Aso {
  id: string;
  funcionarioId: string;
  tipo: TipoAso;
  data: string;
  resultado: ResultadoAso;
  proximoExame: string | null;
  medico: string | null;
  crm: string | null;
  ufCrm: string | null;
  observacao: string | null;
  exames: ExameDoAso[];
  motivoAnulacao: string | null;
}

/** ASO com os dados do trabalhador, para o S-2220 (serviço seguranca pede ao codex). */
export interface AsoParaEsocial extends Aso {
  funcionarioNome: string;
  cpf: string;
  matricula: string;
}
export const filtroAsosParaEsocialSchema = z.object({
  desde: data('a data inicial'),
});

/** Turma: participantes de um treinamento numa data (lista de presença e certificados). */
export const filtroTurmaSchema = z.object({
  treinamentoId: z.uuid('Treinamento inválido.'),
  data: data('a data da turma'),
});
export interface ResumoDaTurma {
  treinamentoId: string;
  treinamentoNome: string;
  data: string;
  participantes: number;
}
export interface Turma {
  treinamento: Treinamento;
  data: string;
  instrutor: string | null;
  participantes: {
    funcionarioId: string;
    nome: string;
    matricula: string;
    cpf: string;
    funcaoNome: string;
    validade: string | null;
  }[];
}

// ---------------------------------------------------------------- treinamentos

const camposDoTreinamento = {
  nome: texto('o nome do treinamento', 120, 3),
  norma: textoOpcional(30),
  cargaHoraria: z.coerce
    .number({ error: 'Informe a carga horária.' })
    .int('Use horas inteiras.')
    .min(1, 'Ao menos 1 hora.')
    .max(400, 'No máximo 400 horas.'),
  validadeMeses: opcional(
    z.coerce
      .number({ error: 'Informe a validade em meses.' })
      .int('Use meses inteiros.')
      .min(1, 'Ao menos 1 mês.')
      .max(120, 'No máximo 120 meses.'),
  ),
};
export const novoTreinamentoSchema = z.object(camposDoTreinamento);
export type NovoTreinamento = z.input<typeof novoTreinamentoSchema>;
export const atualizarTreinamentoSchema = z.object({
  ...camposDoTreinamento,
  versao,
});
export const situacaoDoTreinamentoSchema = z.object({
  versao,
  ativo: z.boolean({ error: 'Informe se fica ativo.' }),
});

/** Uma turma: o mesmo treinamento, na mesma data, para várias pessoas. */
export const registrarTurmaSchema = z.object({
  treinamentoId: z.uuid('Escolha o treinamento.'),
  funcionarioIds: z
    .array(z.uuid('Funcionário inválido.'), {
      error: 'Marque quem participou.',
    })
    .min(1, 'Marque quem participou.')
    .max(200, 'No máximo 200 pessoas por turma.'),
  data: data('a data do treinamento'),
  instrutor: textoOpcional(120),
});
export type RegistrarTurma = z.input<typeof registrarTurmaSchema>;

export interface Treinamento {
  id: string;
  nome: string;
  norma: string | null;
  cargaHoraria: number;
  validadeMeses: number | null;
  ativo: boolean;
  versao: string;
}

export interface TreinamentoRealizado {
  id: string;
  funcionarioId: string;
  treinamentoId: string;
  treinamentoNome: string;
  norma: string | null;
  cargaHoraria: number;
  data: string;
  validade: string | null;
  instrutor: string | null;
  motivoAnulacao: string | null;
}

export const filtroDoFuncionarioSchema = z.object({
  funcionarioId: z.uuid('Funcionário inválido.'),
});

// ---------------------------------------------------------------- vencimentos

export const filtroVencimentosSchema = z.object({
  situacao: opcional(
    z.enum(chaves(SITUACOES_VENCIMENTO), { error: 'Situação desconhecida.' }),
  ),
  tipo: opcional(
    z.enum(['aso', 'treinamento'], { error: 'Tipo desconhecido.' }),
  ),
});

/** O ASO vigente ou o treinamento mais recente de cada pessoa ativa, com a validade. */
export interface Vencimento {
  tipo: 'aso' | 'treinamento';
  funcionarioId: string;
  funcionarioNome: string;
  matricula: string;
  /** "ASO periódico" ou o nome do treinamento. */
  descricao: string;
  data: string;
  validade: string;
  situacao: SituacaoVencimento;
}

export interface ResumoVencimentos {
  /** ASO vigentes e treinamentos com validade de funcionários ativos (base dos percentuais). */
  total: number;
  vencidos: number;
  vencemEmBreve: number;
  /** Funcionários ativos sem nenhum ASO registrado. */
  semAso: number;
}
