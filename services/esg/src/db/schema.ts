// Tabelas do serviço esg. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import {
  boolean,
  date,
  index,
  pgTable,
  smallint,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { colunasPadrao } from '@davinci/database';

/** Tema ESG da empresa: avaliação de dupla materialidade, ODS e a meta quando é material. */
export const temas = pgTable(
  'temas',
  {
    ...colunasPadrao(),
    codigoCatalogo: varchar({ length: 5 }),
    nome: varchar({ length: 150 }).notNull(),
    pilar: varchar({ length: 12 }).notNull(),
    descricao: varchar({ length: 500 }),
    ods: smallint().array().notNull().default([]),
    impacto: smallint(),
    relevancia: smallint(),
    responsavel: varchar({ length: 120 }),
    meta: varchar({ length: 300 }),
    prazoMeta: date({ mode: 'string' }),
    ativo: boolean().notNull().default(true),
  },
  (t) => [
    uniqueIndex('temas_catalogo_unico').on(t.empresaId, t.codigoCatalogo),
  ],
);

/** Andamento da meta do tema: percentual atingido na data e o que foi feito. */
export const andamentos = pgTable(
  'andamentos',
  {
    ...colunasPadrao(),
    temaId: uuid()
      .notNull()
      .references(() => temas.id),
    data: date({ mode: 'string' }).notNull(),
    progresso: smallint().notNull(),
    comentario: varchar({ length: 500 }).notNull(),
  },
  (t) => [index('andamentos_tema_idx').on(t.temaId, t.data)],
);
