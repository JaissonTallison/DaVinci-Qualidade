// Tabelas do serviço plataforma. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import {
  customType,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { colunasPadrao } from '@davinci/database';

const bytea = customType<{ data: Buffer }>({ dataType: () => 'bytea' });

/** Arquivo ligado a um registro de outro serviço (NC, inspeção, acidente...). O dono do registro não guarda o arquivo. */
export const anexos = pgTable(
  'anexos',
  {
    ...colunasPadrao(),
    registro: varchar('registro', { length: 30 }).notNull(),
    registroId: uuid('registro_id').notNull(),
    nome: varchar('nome', { length: 200 }).notNull(),
    tipo: varchar('tipo', { length: 100 }).notNull(),
    tamanho: integer('tamanho').notNull(),
    descricao: varchar('descricao', { length: 200 }),
    conteudo: bytea('conteudo').notNull(),
    /** Removido some da lista, mas o arquivo fica: evidência não se apaga de verdade. */
    removidoEm: timestamp('removido_em', { withTimezone: true, precision: 3 }),
    removidoPor: uuid('removido_por'),
  },
  (t) => [
    index('anexos_registro_idx').on(t.empresaId, t.registro, t.registroId),
  ],
);
