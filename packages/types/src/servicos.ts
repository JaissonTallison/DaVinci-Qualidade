/**
 * Serviços (serviço servicos): ordens de serviço com avaliação, satisfação do cliente (NPS) e avaliação de
 * fornecedores. ISO 9001 8.5, 9.1.2 e 8.4. docs/05-modulos/servicos.md
 */
import { z } from 'zod';
import {
  data,
  enumOpcional,
  opcional,
  texto,
  textoOpcional,
} from './validadores.js';

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);
const nota = (de: number, ate: number, rotulo: string) =>
  z.coerce
    .number({ error: `Informe ${rotulo}.` })
    .int(`Use um número inteiro.`)
    .min(de, `De ${de} a ${ate}.`)
    .max(ate, `De ${de} a ${ate}.`);

// ---------------------------------------------------------------- ordens de serviço

export const STATUS_OS = {
  aberta: 'Aberta',
  em_execucao: 'Em execução',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
} as const;
export type StatusOs = keyof typeof STATUS_OS;

export const novaOsSchema = z.object({
  clienteId: z.uuid('Escolha o cliente.'),
  titulo: texto('o título', 150, 5),
  descricao: texto('o que será feito', 2000, 10),
  responsavel: texto('o responsável', 120, 3),
  prazo: data('o prazo'),
});
export type NovaOs = z.input<typeof novaOsSchema>;
export const iniciarOsSchema = z.object({ versao });
export const concluirOsSchema = z.object({
  versao,
  relatorio: texto('o relatório do que foi feito', 2000, 10),
});
export const cancelarOsSchema = z.object({
  versao,
  motivo: texto('o motivo', 300, 10),
});
/** Avaliação do serviço pelo cliente, depois de concluída: uma só por OS. */
export const avaliarOsSchema = z.object({
  versao,
  nota: nota(1, 5, 'a nota de 1 a 5'),
  comentario: textoOpcional(500),
});
export const filtroOsSchema = z.object({
  status: enumOpcional(STATUS_OS, 'Status desconhecido.'),
  clienteId: opcional(z.uuid()),
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

export interface OrdemDeServico {
  id: string;
  numero: string;
  clienteId: string;
  clienteNome: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  status: StatusOs;
  atrasada: boolean;
  iniciadaEm: string | null;
  concluidaEm: string | null;
  relatorio: string | null;
  motivoCancelamento: string | null;
  nota: number | null;
  comentario: string | null;
  versao: string;
}

// ---------------------------------------------------------------- NPS

/** 9–10 promotor, 7–8 neutro, 0–6 detrator. NPS = % promotores − % detratores. */
export function categoriaNps(nota: number): 'promotor' | 'neutro' | 'detrator' {
  return nota >= 9 ? 'promotor' : nota >= 7 ? 'neutro' : 'detrator';
}

export const registrarRespostaNpsSchema = z.object({
  clienteId: z.uuid('Escolha o cliente.'),
  data: data('a data da resposta'),
  nota: nota(0, 10, 'a nota de 0 a 10'),
  comentario: textoOpcional(1000),
  osId: opcional(z.uuid()),
});
export type RegistrarRespostaNps = z.input<typeof registrarRespostaNpsSchema>;
export const filtroNpsSchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
});

export interface RespostaNps {
  id: string;
  clienteId: string;
  clienteNome: string;
  data: string;
  nota: number;
  categoria: 'promotor' | 'neutro' | 'detrator';
  comentario: string | null;
}

export interface ResultadoNps {
  respostas: RespostaNps[];
  promotores: number;
  neutros: number;
  detratores: number;
  /** null sem respostas. */
  nps: number | null;
}

// ---------------------------------------------------------------- avaliação de fornecedores

export const CRITERIOS_FORNECEDOR = {
  qualidade: 'Qualidade do produto ou serviço',
  prazo: 'Cumprimento de prazo',
  atendimento: 'Atendimento e comunicação',
  documentacao: 'Documentação (certificados, notas, laudos)',
} as const;
export type CriterioFornecedor = keyof typeof CRITERIOS_FORNECEDOR;

export const CLASSIFICACOES_FORNECEDOR = {
  aprovado: 'Aprovado',
  aprovado_com_restricao: 'Aprovado com restrição',
  reprovado: 'Reprovado',
} as const;
export type ClassificacaoFornecedor = keyof typeof CLASSIFICACOES_FORNECEDOR;

/** Média ≥ 4 aprovado (reavaliar em 12 meses); ≥ 3 com restrição (6 meses); abaixo, reprovado (3 meses). */
export function classificarFornecedor(media: number): {
  classificacao: ClassificacaoFornecedor;
  mesesAteReavaliar: number;
} {
  if (media >= 4) return { classificacao: 'aprovado', mesesAteReavaliar: 12 };
  if (media >= 3)
    return { classificacao: 'aprovado_com_restricao', mesesAteReavaliar: 6 };
  return { classificacao: 'reprovado', mesesAteReavaliar: 3 };
}

export const avaliarFornecedorSchema = z.object({
  fornecedorId: z.uuid('Escolha o fornecedor.'),
  data: data('a data da avaliação'),
  qualidade: nota(1, 5, 'a nota de qualidade'),
  prazo: nota(1, 5, 'a nota de prazo'),
  atendimento: nota(1, 5, 'a nota de atendimento'),
  documentacao: nota(1, 5, 'a nota de documentação'),
  observacao: textoOpcional(1000),
});
export type AvaliarFornecedor = z.input<typeof avaliarFornecedorSchema>;

export interface AvaliacaoDeFornecedor {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  data: string;
  notas: Record<CriterioFornecedor, number>;
  media: number;
  classificacao: ClassificacaoFornecedor;
  proximaAvaliacao: string;
  /** Só na última avaliação de cada fornecedor. */
  vigente: boolean;
  observacao: string | null;
}

export interface ResumoServicos {
  osAbertas: number;
  osAtrasadas: number;
  /** NPS dos últimos 12 meses; null sem respostas. */
  nps12Meses: number | null;
  fornecedoresReprovados: number;
  avaliacoesVencidas: number;
}
