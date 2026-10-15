// Tabelas do serviço integracoes. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import {
  boolean,
  date,
  index,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Cache das consultas a fontes públicas (CNPJ, CEP): evita repetir chamadas externas,
 * respeita os limites das fontes e deixa a tela rápida. Global (dado público, igual para todas as empresas).
 * Guarda só o que o DaVinci usa: nada de quadro de sócios (minimização, LGPD).
 */
export const consultasCache = pgTable(
  'consultas_cache',
  {
    /** 'cnpj' | 'cep' */
    tipo: varchar({ length: 10 }).notNull(),
    chave: varchar({ length: 14 }).notNull(),
    /** Resultado já normalizado; null = "não encontrado" (também é guardado, por menos tempo). */
    dados: jsonb(),
    fonte: varchar({ length: 40 }).notNull(),
    consultadoEm: timestamp({ withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.tipo, t.chave] })],
);
