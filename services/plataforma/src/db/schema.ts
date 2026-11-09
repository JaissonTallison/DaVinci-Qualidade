// Tabelas do serviço plataforma. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import {
  boolean,
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
    /** Nome de quem removeu, no momento da remoção (auditoria). */
    removidoPorNome: varchar('removido_por_nome', { length: 120 }),
  },
  (t) => [
    index('anexos_registro_idx').on(t.empresaId, t.registro, t.registroId),
  ],
);

/**
 * Central de notificações (sino da barra superior). Uma notificação é sempre de um usuário — o estado
 * de leitura (`lida`) é dele. Módulos criam notificações pelo evento `notificacoes.criar`.
 */
export const notificacoes = pgTable(
  'notificacoes',
  {
    ...colunasPadrao(),
    usuarioId: uuid('usuario_id').notNull(),
    /** 'alerta' | 'prazo' | 'evento' | 'mencao'. */
    tipo: varchar('tipo', { length: 20 }).notNull(),
    titulo: varchar('titulo', { length: 200 }).notNull(),
    descricao: varchar('descricao', { length: 500 }),
    /** Chave do módulo de origem (ModuloDaBusca), para rótulo e ícone. */
    modulo: varchar('modulo', { length: 20 }),
    href: varchar('href', { length: 300 }),
    lida: boolean('lida').notNull().default(false),
    mencao: boolean('mencao').notNull().default(false),
  },
  (t) => [
    index('notificacoes_usuario_idx').on(t.empresaId, t.usuarioId, t.lida),
  ],
);
