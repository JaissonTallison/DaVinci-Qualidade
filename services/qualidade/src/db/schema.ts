// Tabelas do serviço qualidade. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import { sql } from 'drizzle-orm';
import {
  boolean,
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
import { colunaDinheiro, colunasPadrao } from '@davinci/database';

/**
 * Contadores da numeração por empresa (`NC-2026` → último número usado em 2026).
 * Incremento atômico (INSERT … ON CONFLICT DO UPDATE): dois cadastros ao mesmo tempo nunca recebem o mesmo número,
 * e número usado não volta, nem com cancelamento.
 */
export const sequencias = pgTable(
  'sequencias',
  {
    empresaId: uuid().notNull(),
    nome: varchar({ length: 30 }).notNull(),
    ultimo: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.empresaId, t.nome] })],
);

/** Não conformidades (docs/05-modulos/nao-conformidades.md). Nunca são apagadas: cancelar guarda o motivo. */
export const naoConformidades = pgTable(
  'nao_conformidades',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    titulo: varchar({ length: 150 }).notNull(),
    descricao: text().notNull(),
    origem: varchar({ length: 30 }).notNull(),
    origemRef: varchar({ length: 60 }),
    tipo: varchar({ length: 20 }).notNull(),
    gravidade: varchar({ length: 10 }).notNull(),
    setor: varchar({ length: 100 }),
    produto: varchar({ length: 150 }),
    lote: varchar({ length: 60 }),
    responsavel: varchar({ length: 120 }).notNull(),
    prazo: date({ mode: 'string' }).notNull(),
    dataAbertura: date({ mode: 'string' }).notNull(),
    contencao: text(),
    custoEstimado: colunaDinheiro(),
    status: varchar({ length: 20 }).notNull().default('aberta'),
    // Análise e tratamento
    metodoAnalise: varchar({ length: 20 }),
    categoria6m: varchar({ length: 20 }),
    porques: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    causaRaiz: text(),
    acaoCorretiva: text(),
    dataImplantacao: date({ mode: 'string' }),
    ciclos: smallint().notNull().default(0),
    // Verificação de eficácia (a última)
    eficaz: boolean(),
    parecerEficacia: text(),
    verificadoPor: uuid(),
    verificadoEm: timestamp({ withTimezone: true, precision: 3 }),
    encerradaEm: timestamp({ withTimezone: true, precision: 3 }),
    // Cancelamento
    motivoCancelamento: varchar({ length: 500 }),
    canceladaEm: timestamp({ withTimezone: true, precision: 3 }),
    canceladaPor: uuid(),
  },
  (t) => [
    unique('nao_conformidades_numero_por_empresa').on(t.empresaId, t.numero),
    index('nao_conformidades_empresa_status_prazo_idx').on(
      t.empresaId,
      t.status,
      t.prazo,
    ),
    check(
      'nao_conformidades_status',
      sql`${t.status} IN ('aberta', 'em_tratamento', 'em_verificacao', 'encerrada', 'cancelada')`,
    ),
    check(
      'nao_conformidades_gravidade',
      sql`${t.gravidade} IN ('baixa', 'media', 'alta', 'critica')`,
    ),
  ],
);

/** Planos de ação (docs/05-modulos/planos-de-acao.md). O status acompanha as tarefas; nada é apagado. */
export const planosAcao = pgTable(
  'planos_acao',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    titulo: varchar({ length: 150 }).notNull(),
    objetivo: text().notNull(),
    tipo: varchar({ length: 20 }).notNull(),
    origem: varchar({ length: 20 }).notNull(),
    origemRef: varchar({ length: 60 }),
    /** NC deste serviço que o plano trata. */
    ncId: uuid().references(() => naoConformidades.id),
    responsavel: varchar({ length: 120 }).notNull(),
    custoPrevisto: colunaDinheiro(),
    status: varchar({ length: 25 }).notNull().default('em_execucao'),
    eficaz: boolean(),
    parecerEficacia: text(),
    verificadoPor: uuid(),
    verificadoEm: timestamp({ withTimezone: true, precision: 3 }),
    motivoCancelamento: varchar({ length: 500 }),
    canceladoEm: timestamp({ withTimezone: true, precision: 3 }),
    canceladoPor: uuid(),
  },
  (t) => [
    unique('planos_acao_numero_por_empresa').on(t.empresaId, t.numero),
    index('planos_acao_empresa_status_idx').on(t.empresaId, t.status),
    index('planos_acao_nc_idx').on(t.ncId),
    check(
      'planos_acao_status',
      sql`${t.status} IN ('em_execucao', 'aguardando_eficacia', 'encerrado', 'cancelado')`,
    ),
  ],
);

/** Tarefas do plano: uma linha do 5W2H cada. */
export const planosAcaoTarefas = pgTable(
  'planos_acao_tarefas',
  {
    ...colunasPadrao(),
    planoId: uuid()
      .notNull()
      .references(() => planosAcao.id),
    ordem: smallint().notNull(),
    oQue: varchar({ length: 300 }).notNull(),
    responsavel: varchar({ length: 120 }).notNull(),
    prazo: date({ mode: 'string' }).notNull(),
    onde: varchar({ length: 150 }),
    como: text(),
    situacao: varchar({ length: 15 }).notNull().default('pendente'),
    concluidaEm: timestamp({ withTimezone: true, precision: 3 }),
    concluidaPor: uuid(),
    motivoCancelamento: varchar({ length: 300 }),
  },
  (t) => [
    index('planos_acao_tarefas_plano_idx').on(t.planoId, t.ordem),
    check(
      'planos_acao_tarefas_situacao',
      sql`${t.situacao} IN ('pendente', 'concluida', 'cancelada')`,
    ),
  ],
);
