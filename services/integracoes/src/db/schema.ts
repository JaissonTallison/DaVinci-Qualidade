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

/**
 * Configuração de integrações por empresa (A134). `config` guarda o que não é segredo (URL do webhook,
 * remetente de e-mail, flags…); `segredos` guarda as credenciais cifradas (AES-256-GCM, seguranca/cifra.ts).
 * Uma linha por empresa; cada provedor novo acrescenta campos em `config`/`segredos`, sem tabela nova.
 */
export const integracoesEmpresa = pgTable('integracoes_empresa', {
  empresaId: uuid().primaryKey(),
  config: jsonb().notNull().default({}),
  segredos: text(),
  atualizadoEm: timestamp({ withTimezone: true, precision: 3 })
    .notNull()
    .defaultNow(),
});
