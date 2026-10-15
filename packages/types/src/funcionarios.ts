/**
 * Funcionários, setores e funções da empresa (serviço codex). docs/05-modulos/funcionarios.md
 */
import { z } from 'zod';
import { cpfValido, normalizarDocumento } from './documento.js';
import {
  data,
  email,
  opcional,
  telefone,
  texto,
  textoOpcional,
} from './validadores.js';

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

// ---------------------------------------------------------------- setores e funções

export const novoSetorSchema = z.object({
  nome: texto('o nome do setor', 100, 2),
});
export const atualizarSetorSchema = z.object({
  nome: texto('o nome do setor', 100, 2),
  versao,
});

const cbo = opcional(
  z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'O CBO tem 6 dígitos (ex.: 7842-05).')),
);
export const novaFuncaoSchema = z.object({
  nome: texto('o nome da função', 100, 2),
  cbo,
});
export const atualizarFuncaoSchema = z.object({
  nome: texto('o nome da função', 100, 2),
  cbo,
  versao,
});

export const situacaoDoCadastroSchema = z.object({
  versao,
  ativo: z.boolean({ error: 'Informe se fica ativo.' }),
});
export const filtroCadastroSimplesSchema = z.object({
  situacao: z.enum(['ativos', 'inativos', 'todos']).default('ativos'),
});

export interface SetorDaEmpresa {
  id: string;
  nome: string;
  ativo: boolean;
  funcionariosAtivos: number;
  versao: string;
}

export interface Funcao {
  id: string;
  nome: string;
  /** 6 dígitos, sem formatação. */
  cbo: string | null;
  ativo: boolean;
  funcionariosAtivos: number;
  versao: string;
}

// ---------------------------------------------------------------- funcionários

const cpf = z
  .string({ error: 'Informe o CPF.' })
  .transform(normalizarDocumento)
  .pipe(
    z
      .string()
      .length(11, 'O CPF tem 11 dígitos.')
      .refine(cpfValido, 'CPF inválido: confira os dígitos.'),
  );

const camposDoFuncionario = {
  matricula: z
    .string({ error: 'Informe a matrícula.' })
    .trim()
    .min(1, 'Informe a matrícula.')
    .max(20, 'Use no máximo 20 caracteres.')
    .regex(/^[A-Za-z0-9.\-/]+$/, 'Use letras, números, ponto, hífen ou barra.'),
  nome: texto('o nome', 120, 3),
  cpf,
  setorId: z.uuid('Escolha o setor.'),
  funcaoId: z.uuid('Escolha a função.'),
  admissao: data('a data de admissão'),
  email: opcional(email('nome@empresa.com.br')),
  telefone: opcional(telefone),
};

export const novoFuncionarioSchema = z.object(camposDoFuncionario);
export type NovoFuncionario = z.input<typeof novoFuncionarioSchema>;
export const atualizarFuncionarioSchema = z.object({
  ...camposDoFuncionario,
  versao,
});

export const desligarFuncionarioSchema = z.object({
  versao,
  data: data('a data do desligamento'),
  motivo: textoOpcional(300),
});
export const readmitirFuncionarioSchema = z.object({ versao });

export const filtroFuncionariosSchema = z.object({
  busca: opcional(z.string().trim().max(100, 'Use no máximo 100 caracteres.')),
  setorId: opcional(z.uuid('Setor inválido.')),
  funcaoId: opcional(z.uuid('Função inválida.')),
  situacao: z.enum(['ativos', 'desligados', 'todos']).default('ativos'),
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

export interface Funcionario {
  id: string;
  matricula: string;
  nome: string;
  /** 11 dígitos, sem formatação. */
  cpf: string;
  setorId: string;
  setorNome: string;
  funcaoId: string;
  funcaoNome: string;
  admissao: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  desligamento: string | null;
  motivoDesligamento: string | null;
  versao: string;
}

export type FuncionarioResumo = Pick<
  Funcionario,
  | 'id'
  | 'matricula'
  | 'nome'
  | 'setorNome'
  | 'funcaoNome'
  | 'admissao'
  | 'ativo'
  | 'desligamento'
>;
