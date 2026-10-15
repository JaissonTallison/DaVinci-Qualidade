// Tabelas do serviço servicos. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import {
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
