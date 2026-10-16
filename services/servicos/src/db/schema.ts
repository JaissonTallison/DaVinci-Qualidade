// Tabelas do serviço servicos. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import {
  boolean,
  jsonb,
  text,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  unique,
  uuid,
  varchar,
  doublePrecision,
} from 'drizzle-orm/pg-core';
import { colunasPadrao } from '@davinci/database';

export const sequencias = pgTable(
  'sequencias',
  {
    empresaId: uuid().notNull(),
    nome: varchar({ length: 30 }).notNull(),
    ultimo: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.empresaId, t.nome] })],
);

/** Ordens de serviço. O cliente vem do cadastro do codex; o nome fica guardado no dia. */
export const ordensServico = pgTable(
  'ordens_servico',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    clienteId: uuid().notNull(),
    clienteNome: varchar({ length: 150 }).notNull(),
    titulo: varchar({ length: 150 }).notNull(),
    descricao: varchar({ length: 2000 }).notNull(),
    responsavel: varchar({ length: 120 }).notNull(),
    prazo: date({ mode: 'string' }).notNull(),
    status: varchar({ length: 15 }).notNull().default('aberta'),
    iniciadaEm: timestamp({ withTimezone: true, precision: 3 }),
    concluidaEm: timestamp({ withTimezone: true, precision: 3 }),
    relatorio: varchar({ length: 2000 }),
    motivoCancelamento: varchar({ length: 300 }),
    nota: smallint(),
    comentario: varchar({ length: 500 }),
    /** Contrato (SLA) e serviço do catálogo, com o número e o nome do dia. */
    contratoId: uuid(),
    contratoNumero: varchar({ length: 20 }),
    servicoId: uuid(),
    servicoNome: varchar({ length: 120 }),
    checklist: jsonb().notNull().default([]),
    apontamentos: jsonb().notNull().default([]),
    materiais: jsonb().notNull().default([]),
    recebidoPor: varchar({ length: 120 }),
  },
  (t) => [
    unique('os_numero_por_empresa').on(t.empresaId, t.numero),
    index('os_status_idx').on(t.empresaId, t.status),
  ],
);

/** Respostas da pesquisa de satisfação (NPS). */
export const respostasNps = pgTable(
  'respostas_nps',
  {
    ...colunasPadrao(),
    clienteId: uuid().notNull(),
    clienteNome: varchar({ length: 150 }).notNull(),
    data: date({ mode: 'string' }).notNull(),
    nota: smallint().notNull(),
    comentario: varchar({ length: 1000 }),
    osId: uuid(),
  },
  (t) => [index('nps_data_idx').on(t.empresaId, t.data)],
);

/** Avaliações de fornecedores (ISO 9001 8.4). Vale a mais recente de cada fornecedor. */
export const avaliacoesFornecedores = pgTable(
  'avaliacoes_fornecedores',
  {
    ...colunasPadrao(),
    fornecedorId: uuid().notNull(),
    fornecedorNome: varchar({ length: 150 }).notNull(),
    data: date({ mode: 'string' }).notNull(),
    qualidade: smallint().notNull(),
    prazo: smallint().notNull(),
    atendimento: smallint().notNull(),
    documentacao: smallint().notNull(),
    media: doublePrecision().notNull(),
    classificacao: varchar({ length: 25 }).notNull(),
    proximaAvaliacao: date({ mode: 'string' }).notNull(),
    observacao: varchar({ length: 1000 }),
  },
  (t) => [
    index('avaliacoes_fornecedor_idx').on(t.empresaId, t.fornecedorId, t.data),
  ],
);

/** Catálogo de serviços: o padrão de execução (checklist e horas) copiado para a OS. */
export const catalogoServicos = pgTable(
  'catalogo_servicos',
  {
    ...colunasPadrao(),
    nome: varchar({ length: 120 }).notNull(),
    descricao: varchar({ length: 1000 }),
    horasPadrao: doublePrecision(),
    checklist: jsonb().notNull().default([]),
    ativo: boolean().notNull().default(true),
  },
  (t) => [unique('catalogo_nome_por_empresa').on(t.empresaId, t.nome)],
);

/** Contratos com cliente e o SLA (prazo de atendimento e meta de OS no prazo). */
export const contratos = pgTable(
  'contratos',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    clienteId: uuid().notNull(),
    clienteNome: varchar({ length: 150 }).notNull(),
    objeto: varchar({ length: 300 }).notNull(),
    inicio: date({ mode: 'string' }).notNull(),
    fim: date({ mode: 'string' }).notNull(),
    prazoAtendimentoDias: smallint().notNull(),
    metaNoPrazo: smallint().notNull(),
    valorMensal: varchar({ length: 20 }),
    observacoes: varchar({ length: 1000 }),
    motivoEncerramento: varchar({ length: 300 }),
    encerradoEm: timestamp({ withTimezone: true, precision: 3 }),
  },
  (t) => [unique('contratos_numero_por_empresa').on(t.empresaId, t.numero)],
);

/** Reclamações de clientes (ISO 10002): registro, análise, resposta e encerramento. */
export const reclamacoes = pgTable(
  'reclamacoes',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    clienteId: uuid().notNull(),
    clienteNome: varchar({ length: 150 }).notNull(),
    canal: varchar({ length: 20 }).notNull(),
    recebidaEm: date({ mode: 'string' }).notNull(),
    descricao: varchar({ length: 2000 }).notNull(),
    produto: varchar({ length: 150 }),
    osId: uuid(),
    osNumero: varchar({ length: 20 }),
    prazoResposta: date({ mode: 'string' }).notNull(),
    status: varchar({ length: 15 }).notNull().default('aberta'),
    procedente: boolean(),
    analise: varchar({ length: 2000 }),
    analisadaEm: timestamp({ withTimezone: true, precision: 3 }),
    ncId: uuid(),
    ncNumero: varchar({ length: 20 }),
    resposta: varchar({ length: 2000 }),
    respondidaEm: date({ mode: 'string' }),
    clienteSatisfeito: boolean(),
    observacaoEncerramento: varchar({ length: 500 }),
    encerradaEm: timestamp({ withTimezone: true, precision: 3 }),
  },
  (t) => [
    unique('reclamacoes_numero_por_empresa').on(t.empresaId, t.numero),
    index('reclamacoes_status_idx').on(t.empresaId, t.status),
  ],
);

/** Convites de pesquisa: link com token para o cliente responder sem login. */
export const convitesPesquisa = pgTable(
  'convites_pesquisa',
  {
    ...colunasPadrao(),
    token: varchar({ length: 64 }).notNull(),
    clienteId: uuid().notNull(),
    clienteNome: varchar({ length: 150 }).notNull(),
    osId: uuid(),
    osNumero: varchar({ length: 20 }),
    osTitulo: varchar({ length: 150 }),
    expiraEm: date({ mode: 'string' }).notNull(),
    respondidoEm: timestamp({ withTimezone: true, precision: 3 }),
    comentario: text(),
  },
  (t) => [unique('convites_token').on(t.token)],
);
