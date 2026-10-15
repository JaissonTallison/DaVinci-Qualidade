// Tabelas do serviço auditorias. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { colunasPadrao } from '@davinci/database';

/** Contadores da numeração por empresa (`AUD-2026` → último número usado em 2026). */
export const sequencias = pgTable(
  'sequencias',
  {
    empresaId: uuid().notNull(),
    nome: varchar({ length: 30 }).notNull(),
    ultimo: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.empresaId, t.nome] })],
);

/** Auditorias (docs/05-modulos/auditorias.md). Concluída, não muda mais. */
export const auditorias = pgTable(
  'auditorias',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    tipo: varchar({ length: 20 }).notNull(),
    escopo: text().notNull(),
    normas: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    areas: varchar({ length: 300 }),
    auditorLider: varchar({ length: 120 }).notNull(),
    equipe: varchar({ length: 300 }),
    representante: varchar({ length: 120 }),
    dataInicio: date({ mode: 'string' }).notNull(),
    dataFim: date({ mode: 'string' }).notNull(),
    status: varchar({ length: 15 }).notNull().default('planejada'),
    conclusao: text(),
    concluidaEm: timestamp({ withTimezone: true, precision: 3 }),
    motivoCancelamento: varchar({ length: 500 }),
    canceladaEm: timestamp({ withTimezone: true, precision: 3 }),
  },
  (t) => [
    unique('auditorias_numero_por_empresa').on(t.empresaId, t.numero),
    index('auditorias_empresa_status_idx').on(
      t.empresaId,
      t.status,
      t.dataInicio,
    ),
    check(
      'auditorias_status',
      sql`${t.status} IN ('planejada', 'em_andamento', 'concluida', 'cancelada')`,
    ),
    check('auditorias_datas', sql`${t.dataFim} >= ${t.dataInicio}`),
  ],
);

/** Constatações: o que o auditor encontrou. As de NC guardam o número da NC criada no serviço qualidade. */
export const constatacoes = pgTable(
  'constatacoes',
  {
    ...colunasPadrao(),
    auditoriaId: uuid()
      .notNull()
      .references(() => auditorias.id),
    ordem: smallint().notNull(),
    tipo: varchar({ length: 15 }).notNull(),
    norma: varchar({ length: 15 }).notNull(),
    clausula: varchar({ length: 20 }),
    area: varchar({ length: 120 }),
    descricao: text().notNull(),
    evidencia: text(),
    /** NC no serviço qualidade (outro banco: sem chave estrangeira). */
    ncId: uuid(),
    ncNumero: varchar({ length: 20 }),
  },
  (t) => [
    index('constatacoes_auditoria_idx').on(t.auditoriaId, t.ordem),
    check(
      'constatacoes_tipo',
      sql`${t.tipo} IN ('conformidade', 'nc_maior', 'nc_menor', 'observacao', 'oportunidade')`,
    ),
  ],
);
