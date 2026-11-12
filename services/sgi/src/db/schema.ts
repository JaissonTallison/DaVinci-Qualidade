// Tabelas do serviço sgi. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import {
  char,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  unique,
  uuid,
  varchar,
  boolean,
} from 'drizzle-orm/pg-core';
import { colunasPadrao } from '@davinci/database';

/** Numeração por empresa e ano (MUD-AAAA-NNN). */
export const sequencias = pgTable(
  'sequencias',
  {
    empresaId: uuid().notNull(),
    nome: varchar({ length: 30 }).notNull(),
    ultimo: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.empresaId, t.nome] })],
);

/** Riscos e oportunidades dos processos (ISO 9001 6.1). */
export const riscosOportunidades = pgTable(
  'riscos_oportunidades',
  {
    ...colunasPadrao(),
    tipo: varchar({ length: 15 }).notNull(),
    processo: varchar({ length: 120 }).notNull(),
    descricao: varchar({ length: 500 }).notNull(),
    contexto: varchar({ length: 500 }),
    controlesExistentes: varchar({ length: 1000 }),
    probabilidade: smallint().notNull(),
    impacto: smallint().notNull(),
    acao: varchar({ length: 1000 }),
    responsavel: varchar({ length: 120 }),
    prazo: date({ mode: 'string' }),
    resultado: varchar({ length: 500 }),
    encerradoEm: timestamp({ withTimezone: true, precision: 3 }),
  },
  (t) => [index('ros_empresa_idx').on(t.empresaId, t.encerradoEm)],
);

/** Objetivos da qualidade com indicador e meta (ISO 9001 6.2). */
export const objetivos = pgTable('objetivos', {
  ...colunasPadrao(),
  nome: varchar({ length: 200 }).notNull(),
  indicador: varchar({ length: 150 }).notNull(),
  unidade: varchar({ length: 20 }).notNull(),
  meta: doublePrecision().notNull(),
  sentido: varchar({ length: 10 }).notNull(),
  responsavel: varchar({ length: 120 }).notNull(),
  ativo: boolean().notNull().default(true),
});

export const medicoes = pgTable(
  'medicoes',
  {
    ...colunasPadrao(),
    objetivoId: uuid()
      .notNull()
      .references(() => objetivos.id),
    competencia: char({ length: 7 }).notNull(),
    valor: doublePrecision().notNull(),
    analise: varchar({ length: 500 }),
  },
  (t) => [unique('medicoes_por_competencia').on(t.objetivoId, t.competencia)],
);

/** Análise crítica pela direção (ISO 9001 9.3). Registro da reunião: não se edita. */
export const analisesCriticas = pgTable('analises_criticas', {
  ...colunasPadrao(),
  data: date({ mode: 'string' }).notNull(),
  participantes: varchar({ length: 500 }).notNull(),
  entradas: varchar({ length: 6000 }).notNull(),
  decisoes: varchar({ length: 4000 }).notNull(),
  proximaAnalise: date({ mode: 'string' }).notNull(),
});

/** Gestão de mudanças (ISO 9001 6.3). */
export const mudancas = pgTable(
  'mudancas',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    titulo: varchar({ length: 150 }).notNull(),
    tipoInovacao: varchar({ length: 20 }).notNull().default(''),
    descricao: varchar({ length: 1000 }).notNull(),
    motivo: varchar({ length: 500 }).notNull(),
    ganhoEsperado: varchar({ length: 500 }).notNull().default(''),
    impactos: varchar({ length: 1000 }).notNull(),
    responsavel: varchar({ length: 120 }).notNull(),
    dataPrevista: date({ mode: 'string' }).notNull(),
    status: varchar({ length: 15 }).notNull().default('proposta'),
    parecer: varchar({ length: 500 }),
    decididaPor: uuid(),
    decididaEm: timestamp({ withTimezone: true, precision: 3 }),
    verificacao: varchar({ length: 500 }),
    implementadaEm: timestamp({ withTimezone: true, precision: 3 }),
  },
  (t) => [unique('mudancas_numero_por_empresa').on(t.empresaId, t.numero)],
);

/**
 * Controle de documentos: normas e procedimentos (ISO 9001 7.5 — informação documentada).
 * Esta tabela guarda o documento atual; cada revisão aprovada fica em `documentos_revisoes` (imutável).
 */
export const documentos = pgTable(
  'documentos',
  {
    ...colunasPadrao(),
    codigo: varchar({ length: 30 }).notNull(),
    titulo: varchar({ length: 150 }).notNull(),
    tipo: varchar({ length: 20 }).notNull(),
    area: varchar({ length: 120 }),
    elaboradoPor: varchar({ length: 120 }).notNull(),
    status: varchar({ length: 15 }).notNull().default('rascunho'),
    revisaoAtual: integer().notNull().default(0),
    /** O que muda na próxima revisão, informado ao abrir a revisão; vira linha no histórico ao aprovar. */
    oQueMudouPendente: varchar({ length: 500 }),
    aprovadoPor: uuid(),
    /** Nome de quem aprovou, gravado no momento (auditoria). */
    aprovadoPorNome: varchar({ length: 120 }),
    aprovadoEm: timestamp({ withTimezone: true, precision: 3 }),
    dataVigencia: date({ mode: 'string' }),
    proximaRevisao: date({ mode: 'string' }),
    motivoObsolescencia: varchar({ length: 500 }),
  },
  (t) => [
    unique('documentos_codigo_por_empresa').on(t.empresaId, t.codigo),
    index('documentos_empresa_status_idx').on(t.empresaId, t.status),
  ],
);

/** Histórico imutável das revisões aprovadas de um documento. Nunca se edita. */
export const documentosRevisoes = pgTable(
  'documentos_revisoes',
  {
    ...colunasPadrao(),
    documentoId: uuid()
      .notNull()
      .references(() => documentos.id),
    revisao: integer().notNull(),
    oQueMudou: varchar({ length: 500 }).notNull(),
    elaboradoPor: varchar({ length: 120 }).notNull(),
    aprovadoPorNome: varchar({ length: 120 }),
    aprovadoEm: timestamp({ withTimezone: true, precision: 3 }).notNull(),
    dataVigencia: date({ mode: 'string' }),
    proximaRevisao: date({ mode: 'string' }),
  },
  (t) => [
    unique('documentos_revisao_por_documento').on(t.documentoId, t.revisao),
    index('documentos_revisoes_documento_idx').on(t.documentoId),
  ],
);
