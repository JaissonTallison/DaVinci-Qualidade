// Tabelas do serviço paineis. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import {
  date,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/** Um aviso diário por empresa: reiniciar o serviço não manda de novo no mesmo dia. */
export const avisosEnviados = pgTable(
  'avisos_enviados',
  {
    empresaId: uuid().notNull(),
    data: date({ mode: 'string' }).notNull(),
    emails: integer().notNull(),
    enviadoEm: timestamp({ withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.empresaId, t.data] })],
);
