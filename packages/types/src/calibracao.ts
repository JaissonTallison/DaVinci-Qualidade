/**
 * Calibração: instrumentos de medição e o histórico de calibrações (serviço qualidade). docs/05-modulos/calibracao.md
 */
import { z } from 'zod';
import {
  data,
  enumOpcional,
  opcional,
  texto,
  textoOpcional,
} from './validadores.js';

export const SITUACOES_INSTRUMENTO = {
  sem_calibracao: 'Sem calibração',
  em_dia: 'Em dia',
  vence_em_breve: 'Vence em até 30 dias',
  vencido: 'Vencido',
  reprovado: 'Reprovado',
  fora_de_uso: 'Fora de uso',
} as const;
export type SituacaoInstrumento = keyof typeof SITUACOES_INSTRUMENTO;

/** Dias de antecedência do aviso "vence em breve". */
export const DIAS_DE_AVISO_DE_CALIBRACAO = 30;

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
const dinheiro = opcional(
  z
    .string()
    .trim()
    .regex(/^\d{1,13}(\.\d{1,2})?$/, 'Informe o valor em reais (ex.: 250.00).'),
);

const camposDoInstrumento = {
  tag: z
    .string({ error: 'Informe a TAG.' })
    .trim()
    .toUpperCase()
    .min(2, 'Informe a TAG (ex.: PAQ-0042).')
    .max(30, 'Use no máximo 30 caracteres.')
    .regex(
      /^[A-Z0-9][A-Z0-9./_-]*$/,
      'Use letras, números, ponto, barra, hífen ou sublinhado (ex.: PAQ-0042).',
    ),
  descricao: texto('a descrição', 150, 3),
  fabricante: textoOpcional(80),
  modelo: textoOpcional(80),
  numeroSerie: textoOpcional(60),
  local: textoOpcional(120),
  responsavel: textoOpcional(120),
  faixa: textoOpcional(80),
  criterioAceitacao: textoOpcional(200),
  frequenciaMeses: z.coerce
    .number({ error: 'Informe a frequência em meses.' })
    .int('Use um número inteiro de meses.')
    .min(1, 'A frequência mínima é de 1 mês.')
    .max(60, 'A frequência máxima é de 60 meses.'),
};

export const novoInstrumentoSchema = z.object(camposDoInstrumento);
export type NovoInstrumento = z.input<typeof novoInstrumentoSchema>;
export const atualizarInstrumentoSchema = z.object({
  ...camposDoInstrumento,
  versao,
});
export const usoDoInstrumentoSchema = z.object({
  versao,
  emUso: z.boolean({ error: 'Informe se o instrumento está em uso.' }),
});

export const registrarCalibracaoSchema = z.object({
  versao,
  data: data('a data da calibração'),
  laboratorio: texto('o laboratório', 120, 2),
  certificado: textoOpcional(60),
  aprovada: z.boolean({ error: 'Informe se a calibração foi aprovada.' }),
  erroEncontrado: textoOpcional(200),
  observacao: textoOpcional(1000),
  custo: dinheiro,
});
export type RegistrarCalibracao = z.input<typeof registrarCalibracaoSchema>;

export const anularCalibracaoSchema = z.object({
  versao,
  calibracaoId: z.uuid('Calibração inválida.'),
  motivo: texto('o motivo da anulação', 300, 10),
});

export const filtroInstrumentosSchema = z.object({
  busca: opcional(z.string().trim().max(100, 'Use no máximo 100 caracteres.')),
  situacao: enumOpcional(SITUACOES_INSTRUMENTO, 'Situação desconhecida.'),
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

export interface Calibracao {
  id: string;
  data: string;
  laboratorio: string;
  certificado: string | null;
  aprovada: boolean;
  erroEncontrado: string | null;
  observacao: string | null;
  custo: string | null;
  anulada: boolean;
  motivoAnulacao: string | null;
  criadoEm: string;
}

export interface Instrumento {
  id: string;
  tag: string;
  descricao: string;
  fabricante: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  local: string | null;
  responsavel: string | null;
  faixa: string | null;
  criterioAceitacao: string | null;
  frequenciaMeses: number;
  emUso: boolean;
  situacao: SituacaoInstrumento;
  /** Data da calibração válida mais recente (não anulada). */
  ultimaCalibracao: string | null;
  proximaCalibracao: string | null;
  /** Histórico, da mais recente para a mais antiga (inclui as anuladas). */
  calibracoes: Calibracao[];
  versao: string;
}

export type InstrumentoResumo = Pick<
  Instrumento,
  | 'id'
  | 'tag'
  | 'descricao'
  | 'local'
  | 'responsavel'
  | 'frequenciaMeses'
  | 'situacao'
  | 'ultimaCalibracao'
  | 'proximaCalibracao'
>;

export interface ResumoCalibracao {
  vencidos: number;
  vencemEmBreve: number;
  reprovados: number;
  semCalibracao: number;
}
