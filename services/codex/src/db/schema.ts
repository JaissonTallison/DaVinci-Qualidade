// Tabelas do serviço codex. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { colunasPadrao } from '@davinci/database';
import { uuidv7 } from '@davinci/types';

/** Parceiros de negócio: clientes, fornecedores, transportadoras… (docs/05-modulos/parceiros.md). */
export const parceiros = pgTable(
  'parceiros',
  {
    ...colunasPadrao(),
    /** Número amigável, sequencial por empresa (tabela `sequencias`). */
    codigo: integer().notNull(),
    tipoPessoa: varchar({ length: 2, enum: ['PJ', 'PF', 'EX'] }).notNull(),
    /** CNPJ (numérico ou alfanumérico), CPF ou documento estrangeiro, normalizado: sem pontuação, maiúsculas. */
    documento: varchar({ length: 30 }).notNull(),
    nome: varchar({ length: 150 }).notNull(),
    nomeFantasia: varchar({ length: 150 }),
    email: varchar({ length: 150 }),
    telefone: varchar({ length: 11 }),
    /** cliente, fornecedor, transportadora, representante, colaborador (pelo menos um). */
    papeis: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    // Pessoa física / estrangeiro
    rg: varchar({ length: 20 }),
    rgOrgao: varchar({ length: 20 }),
    nascimento: date({ mode: 'string' }),
    pais: varchar({ length: 60 }),
    // Ramo e dados da Receita
    cnaePrincipal: char({ length: 7 }),
    cnaesSecundarios: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    situacaoCadastral: varchar({ length: 10 }),
    dataAbertura: date({ mode: 'string' }),
    naturezaJuridica: varchar({ length: 120 }),
    porte: varchar({ length: 10 }),
    // Fiscal
    indicadorIE: varchar({ length: 20 }).notNull().default('nao_contribuinte'),
    inscricaoEstadual: varchar({ length: 20 }),
    inscricaoMunicipal: varchar({ length: 20 }),
    suframa: varchar({ length: 9 }),
    regimeTributario: varchar({ length: 10 }),
    consumidorFinal: boolean().notNull().default(false),
    retemIss: boolean().notNull().default(false),
    retemIr: boolean().notNull().default(false),
    retemPis: boolean().notNull().default(false),
    retemCofins: boolean().notNull().default(false),
    retemCsll: boolean().notNull().default(false),
    retemInss: boolean().notNull().default(false),
    // Contato geral
    site: varchar({ length: 150 }),
    emailCobranca: varchar({ length: 150 }),
    emailNfe: varchar({ length: 150 }),
    // Financeiro
    limiteCredito: numeric({ precision: 15, scale: 2 }),
    bloqueado: boolean().notNull().default(false),
    motivoBloqueio: varchar({ length: 300 }),
    // Padrões para os títulos (Bloco 4)
    formaPagamento: varchar({ length: 20 }),
    condicaoPagamentoId: uuid(),
    contaReceitaId: uuid(),
    contaDespesaId: uuid(),
    // Classificação
    etiquetas: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    origem: varchar({ length: 60 }),
    observacoes: text(),
    // Nunca apagar: inativar, com motivo, autor e momento
    ativo: boolean().notNull().default(true),
    inativadoEm: timestamp({ withTimezone: true, precision: 3 }),
    inativadoPor: uuid(),
    motivoInativacao: varchar({ length: 500 }),
  },
  (t) => [
    unique('parceiros_documento_por_empresa').on(t.empresaId, t.documento),
    unique('parceiros_codigo_por_empresa').on(t.empresaId, t.codigo),
    index('parceiros_empresa_nome_idx').on(t.empresaId, t.nome),
    index('parceiros_empresa_cnae_idx').on(t.empresaId, t.cnaePrincipal),
    check('parceiros_ao_menos_um_papel', sql`cardinality(${t.papeis}) > 0`),
    check('parceiros_tipo_pessoa', sql`${t.tipoPessoa} IN ('PJ', 'PF', 'EX')`),
  ],
);

/** Numeração amigável por empresa: próximo valor obtido de forma atômica (INSERT … ON CONFLICT … RETURNING). */
export const sequencias = pgTable(
  'sequencias',
  {
    empresaId: uuid().notNull(),
    nome: varchar({ length: 50 }).notNull(),
    ultimo: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.empresaId, t.nome] })],
);

// ---------------------------------------------------------------- listas do parceiro
// Gravadas junto com o parceiro (mesma transação): a "versão" do parceiro protege o conjunto.

const doParceiro = () => ({
  id: uuid()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  empresaId: uuid().notNull(),
  parceiroId: uuid()
    .notNull()
    .references(() => parceiros.id),
  /** Ordem na tela. */
  ordem: smallint().notNull(),
});

export const parceiroEnderecos = pgTable(
  'parceiro_enderecos',
  {
    ...doParceiro(),
    tipo: varchar({ length: 10 }).notNull(),
    cep: char({ length: 8 }).notNull(),
    logradouro: varchar({ length: 150 }).notNull(),
    numero: varchar({ length: 20 }).notNull(),
    complemento: varchar({ length: 60 }),
    bairro: varchar({ length: 80 }).notNull(),
    cidade: varchar({ length: 80 }).notNull(),
    uf: char({ length: 2 }).notNull(),
    codigoMunicipio: char({ length: 7 }),
  },
  (t) => [
    index('parceiro_enderecos_parceiro_idx').on(t.parceiroId),
    index('parceiro_enderecos_cidade_idx').on(t.empresaId, t.uf, t.cidade),
  ],
);

export const parceiroContatos = pgTable(
  'parceiro_contatos',
  {
    ...doParceiro(),
    nome: varchar({ length: 100 }).notNull(),
    cargo: varchar({ length: 60 }),
    email: varchar({ length: 150 }),
    telefone: varchar({ length: 11 }),
    whatsapp: boolean().notNull().default(false),
  },
  (t) => [index('parceiro_contatos_parceiro_idx').on(t.parceiroId)],
);

export const parceiroContasBancarias = pgTable(
  'parceiro_contas_bancarias',
  {
    ...doParceiro(),
    banco: char({ length: 3 }).notNull(),
    agencia: varchar({ length: 7 }).notNull(),
    conta: varchar({ length: 22 }).notNull(),
    tipo: varchar({ length: 10 }).notNull(),
    titular: varchar({ length: 150 }),
    documentoTitular: varchar({ length: 14 }),
  },
  (t) => [index('parceiro_contas_parceiro_idx').on(t.parceiroId)],
);

export const parceiroChavesPix = pgTable(
  'parceiro_chaves_pix',
  {
    ...doParceiro(),
    tipo: varchar({ length: 10 }).notNull(),
    chave: varchar({ length: 77 }).notNull(),
  },
  (t) => [index('parceiro_chaves_pix_parceiro_idx').on(t.parceiroId)],
);

// ---------------------------------------------------------------- tabelas oficiais de referência (globais)

/** Seções da CNAE (IBGE): os "setores" (A a U). */
export const setores = pgTable('setores', {
  id: char({ length: 1 }).primaryKey(),
  nome: varchar({ length: 120 }).notNull(),
});

/** CNAE 2.3, subclasses (IBGE): ramo de atividade. `palavras` = atividades típicas, para a busca. */
export const cnaes = pgTable(
  'cnaes',
  {
    codigo: char({ length: 7 }).primaryKey(),
    descricao: varchar({ length: 300 }).notNull(),
    setor: char({ length: 1 })
      .notNull()
      .references(() => setores.id),
    palavras: text().notNull().default(''),
  },
  (t) => [index('cnaes_setor_idx').on(t.setor)],
);

/** Instituições financeiras com código COMPE (Banco Central). */
export const bancos = pgTable('bancos', {
  codigo: char({ length: 3 }).primaryKey(),
  ispb: char({ length: 8 }),
  nome: varchar({ length: 150 }).notNull(),
  nomeCurto: varchar({ length: 80 }).notNull(),
});

// ---------------------------------------------------------------- funcionários (docs/05-modulos/funcionarios.md)

/** Setores da empresa (Produção, Expedição…). Não confundir com `setores`, as seções da CNAE. */
export const setoresEmpresa = pgTable(
  'setores_empresa',
  {
    ...colunasPadrao(),
    nome: varchar({ length: 100 }).notNull(),
    ativo: boolean().notNull().default(true),
  },
  (t) => [unique('setores_empresa_nome_por_empresa').on(t.empresaId, t.nome)],
);

/** Funções (cargos), com o CBO quando houver. */
export const funcoes = pgTable(
  'funcoes',
  {
    ...colunasPadrao(),
    nome: varchar({ length: 100 }).notNull(),
    cbo: char({ length: 6 }),
    ativo: boolean().notNull().default(true),
  },
  (t) => [unique('funcoes_nome_por_empresa').on(t.empresaId, t.nome)],
);

/** Funcionários. Não se apagam: são desligados, com data e motivo. */
export const funcionarios = pgTable(
  'funcionarios',
  {
    ...colunasPadrao(),
    matricula: varchar({ length: 20 }).notNull(),
    nome: varchar({ length: 120 }).notNull(),
    cpf: char({ length: 11 }).notNull(),
    setorId: uuid()
      .notNull()
      .references(() => setoresEmpresa.id),
    funcaoId: uuid()
      .notNull()
      .references(() => funcoes.id),
    admissao: date({ mode: 'string' }).notNull(),
    email: varchar({ length: 150 }),
    telefone: varchar({ length: 11 }),
    ativo: boolean().notNull().default(true),
    desligamento: date({ mode: 'string' }),
    motivoDesligamento: varchar({ length: 300 }),
  },
  (t) => [
    unique('funcionarios_matricula_por_empresa').on(t.empresaId, t.matricula),
    unique('funcionarios_cpf_por_empresa').on(t.empresaId, t.cpf),
    index('funcionarios_empresa_nome_idx').on(t.empresaId, t.nome),
    check(
      'funcionarios_desligamento',
      sql`${t.desligamento} IS NULL OR ${t.desligamento} >= ${t.admissao}`,
    ),
  ],
);

/** Exames ocupacionais (ASO, NR-7). Não se editam: registro errado é anulado com motivo. */
export const asos = pgTable(
  'asos',
  {
    ...colunasPadrao(),
    funcionarioId: uuid()
      .notNull()
      .references(() => funcionarios.id),
    tipo: varchar({ length: 25 }).notNull(),
    data: date({ mode: 'string' }).notNull(),
    resultado: varchar({ length: 25 }).notNull(),
    proximoExame: date({ mode: 'string' }),
    medico: varchar({ length: 120 }),
    crm: varchar({ length: 20 }),
    ufCrm: char({ length: 2 }),
    /** Exames realizados com o procedimento da tabela 27 do eSocial. */
    exames: jsonb().notNull().default([]),
    observacao: varchar({ length: 300 }),
    motivoAnulacao: varchar({ length: 300 }),
  },
  (t) => [
    index('asos_funcionario_idx').on(t.empresaId, t.funcionarioId, t.data),
  ],
);

/** Catálogo de treinamentos (NR-35, NR-10, integração...). */
export const treinamentos = pgTable(
  'treinamentos',
  {
    ...colunasPadrao(),
    nome: varchar({ length: 120 }).notNull(),
    norma: varchar({ length: 30 }),
    cargaHoraria: smallint().notNull(),
    validadeMeses: smallint(),
    ativo: boolean().notNull().default(true),
  },
  (t) => [unique('treinamentos_nome_por_empresa').on(t.empresaId, t.nome)],
);

/** Participação de um funcionário num treinamento. A validade é calculada na gravação. */
export const treinamentosRealizados = pgTable(
  'treinamentos_realizados',
  {
    ...colunasPadrao(),
    funcionarioId: uuid()
      .notNull()
      .references(() => funcionarios.id),
    treinamentoId: uuid()
      .notNull()
      .references(() => treinamentos.id),
    data: date({ mode: 'string' }).notNull(),
    validade: date({ mode: 'string' }),
    instrutor: varchar({ length: 120 }),
    motivoAnulacao: varchar({ length: 300 }),
  },
  (t) => [
    index('treinamentos_realizados_funcionario_idx').on(
      t.empresaId,
      t.funcionarioId,
      t.data,
    ),
  ],
);

/** Treinamentos obrigatórios de cada função (competências por função). */
export const funcaoTreinamentos = pgTable(
  'funcao_treinamentos',
  {
    ...colunasPadrao(),
    funcaoId: uuid()
      .notNull()
      .references(() => funcoes.id),
    treinamentoId: uuid()
      .notNull()
      .references(() => treinamentos.id),
  },
  (t) => [
    unique('funcao_treinamentos_unico').on(
      t.empresaId,
      t.funcaoId,
      t.treinamentoId,
    ),
  ],
);
