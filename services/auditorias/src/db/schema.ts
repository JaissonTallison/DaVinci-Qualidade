// Tabelas do serviço auditorias. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import { sql } from 'drizzle-orm';
import {
  check,
  date,
  doublePrecision,
  index,
  jsonb,
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
    // Plano e relatório (docs/06-referencias/auditexpert.md §8)
    empresaAuditada: varchar({ length: 150 }),
    unidade: varchar({ length: 120 }),
    objetivo: text(),
    metodologia: text(),
    pontosFortes: text(),
    processos: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    criterios: text(),
    cronograma: jsonb().notNull().default([]),
    auditados: jsonb().notNull().default([]),
    logistica: jsonb().notNull().default({}),
    emissor: varchar({ length: 120 }),
    papel: varchar({ length: 12 }).notNull().default('lider'),
    horas: doublePrecision(),
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
    perguntaCodigo: varchar({ length: 40 }),
    modeloCodigo: varchar({ length: 40 }),
    tipoDesvio: varchar({ length: 15 }),
    causaRaiz: text(),
    acaoCorretiva: text(),
    evidenciaFechamento: text(),
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

/** Status de cada item do kit pré-auditoria por auditoria. Item sem linha = pendente. */
export const itensDoKit = pgTable(
  'itens_do_kit',
  {
    ...colunasPadrao(),
    auditoriaId: uuid()
      .notNull()
      .references(() => auditorias.id),
    codigo: varchar({ length: 10 }).notNull(),
    status: varchar({ length: 15 }).notNull(),
  },
  (t) => [unique('itens_do_kit_por_auditoria').on(t.auditoriaId, t.codigo)],
);

/** Perguntas criadas pela empresa ("Minhas perguntas"): aparecem junto com o banco nas próximas auditorias. */
export const perguntasProprias = pgTable('perguntas_proprias', {
  ...colunasPadrao(),
  processo: varchar({ length: 25 }).notNull(),
  norma: varchar({ length: 15 }).notNull(),
  clausula: varchar({ length: 20 }).notNull(),
  pergunta: varchar({ length: 300 }).notNull(),
  objetivo: varchar({ length: 300 }),
  respostaEsperada: varchar({ length: 500 }).notNull(),
  sinalDeAlerta: varchar({ length: 500 }).notNull(),
});

/**
 * Perguntas do roteiro de cada auditoria, com cópia do texto (mudar o banco depois não altera a auditoria) e a
 * resposta da execução.
 */
export const perguntasDaAuditoria = pgTable(
  'perguntas_da_auditoria',
  {
    ...colunasPadrao(),
    auditoriaId: uuid()
      .notNull()
      .references(() => auditorias.id),
    codigo: varchar({ length: 40 }).notNull(),
    origem: varchar({ length: 10 }).notNull(),
    ordem: smallint().notNull(),
    processo: varchar({ length: 25 }).notNull(),
    norma: varchar({ length: 15 }).notNull(),
    clausula: varchar({ length: 20 }).notNull(),
    pergunta: varchar({ length: 300 }).notNull(),
    objetivo: varchar({ length: 300 }),
    respostaEsperada: varchar({ length: 500 }).notNull(),
    sinalDeAlerta: varchar({ length: 500 }).notNull(),
    resposta: varchar({ length: 15 }).notNull().default('pendente'),
    evidencia: text(),
    respondidaEm: timestamp({ withTimezone: true, precision: 3 }),
  },
  (t) => [unique('perguntas_da_auditoria_unica').on(t.auditoriaId, t.codigo)],
);

/** Evidências criadas pela empresa ("Nova evidência minha"): aparecem junto com a biblioteca. */
export const evidenciasProprias = pgTable('evidencias_proprias', {
  ...colunasPadrao(),
  norma: varchar({ length: 15 }).notNull(),
  clausula: varchar({ length: 20 }).notNull(),
  titulo: varchar({ length: 150 }).notNull(),
  tipo: varchar({ length: 12 }).notNull(),
  risco: varchar({ length: 6 }).notNull(),
  oQuePedir: varchar({ length: 500 }).notNull(),
  exemplo: varchar({ length: 500 }).notNull(),
});

/** Modelos de NC criados pela empresa ("Minha biblioteca"). */
export const modelosNcProprios = pgTable('modelos_nc_proprios', {
  ...colunasPadrao(),
  norma: varchar({ length: 15 }).notNull(),
  clausula: varchar({ length: 20 }).notNull(),
  tipo: varchar({ length: 15 }).notNull(),
  titulo: varchar({ length: 150 }).notNull(),
  descricao: varchar({ length: 1000 }).notNull(),
  causaRaiz: varchar({ length: 500 }).notNull(),
  acaoCorretiva: varchar({ length: 500 }).notNull(),
  evidenciaFechamento: varchar({ length: 500 }).notNull(),
});

/** Critérios próprios de auditoria (legislação, norma interna, contrato), da Minha biblioteca. */
export const criteriosProprios = pgTable('criterios_proprios', {
  ...colunasPadrao(),
  tipo: varchar({ length: 25 }).notNull(),
  nome: varchar({ length: 150 }).notNull(),
  referencia: varchar({ length: 150 }),
  requisitos: varchar({ length: 2000 }).notNull(),
});
