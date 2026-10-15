// Tabelas do serviço ambiental. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import {
  boolean,
  date,
  doublePrecision,
  index,
  pgTable,
  smallint,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { colunasPadrao } from '@davinci/database';

/** LAIA: levantamento de aspectos e impactos ambientais (ISO 14001, 6.1.2). */
export const aspectos = pgTable(
  'aspectos',
  {
    ...colunasPadrao(),
    atividade: varchar({ length: 150 }).notNull(),
    aspecto: varchar({ length: 200 }).notNull(),
    impacto: varchar({ length: 200 }).notNull(),
    situacao: varchar({ length: 15 }).notNull(),
    incidencia: varchar({ length: 10 }).notNull(),
    severidade: smallint().notNull(),
    frequencia: smallint().notNull(),
    requisitoLegal: boolean().notNull().default(false),
    controles: varchar({ length: 1000 }),
    acoes: varchar({ length: 1000 }),
    responsavel: varchar({ length: 120 }),
    prazo: date({ mode: 'string' }),
    ativo: boolean().notNull().default(true),
  },
  (t) => [index('aspectos_empresa_idx').on(t.empresaId, t.ativo)],
);

/** Requisitos legais e a última avaliação de atendimento (ISO 14001, 6.1.3 e 9.1.2). */
export const requisitos = pgTable('requisitos', {
  ...colunasPadrao(),
  norma: varchar({ length: 200 }).notNull(),
  esfera: varchar({ length: 15 }).notNull(),
  tema: varchar({ length: 100 }).notNull(),
  requisito: varchar({ length: 1000 }).notNull(),
  atendimento: varchar({ length: 15 }).notNull().default('nao_avaliado'),
  ultimaAvaliacao: date({ mode: 'string' }),
  evidencia: varchar({ length: 500 }),
  acao: varchar({ length: 500 }),
});

/** Licenças e autorizações, com a renovação protocolada. */
export const licencas = pgTable('licencas', {
  ...colunasPadrao(),
  tipo: varchar({ length: 15 }).notNull(),
  numero: varchar({ length: 60 }).notNull(),
  orgao: varchar({ length: 120 }).notNull(),
  descricao: varchar({ length: 300 }),
  emissao: date({ mode: 'string' }).notNull(),
  validade: date({ mode: 'string' }).notNull(),
  diasParaRenovar: smallint().notNull(),
  renovacaoProtocolo: varchar({ length: 60 }),
  renovacaoData: date({ mode: 'string' }),
});

/** Condicionantes da licença. Periódica: cumprir gera a próxima. */
export const condicionantes = pgTable(
  'condicionantes',
  {
    ...colunasPadrao(),
    licencaId: uuid()
      .notNull()
      .references(() => licencas.id),
    descricao: varchar({ length: 500 }).notNull(),
    prazo: date({ mode: 'string' }),
    periodicidadeMeses: smallint(),
    cumpridaEm: date({ mode: 'string' }),
    evidencia: varchar({ length: 300 }),
  },
  (t) => [index('condicionantes_licenca_idx').on(t.licencaId)],
);

/** Inventário de resíduos (NBR 10004). */
export const residuos = pgTable('residuos', {
  ...colunasPadrao(),
  nome: varchar({ length: 150 }).notNull(),
  classe: varchar({ length: 4 }).notNull(),
  origem: varchar({ length: 150 }).notNull(),
  acondicionamento: varchar({ length: 150 }).notNull(),
  destinacao: varchar({ length: 150 }).notNull(),
  unidade: varchar({ length: 4 }).notNull(),
});

/** Saídas de resíduo com MTR e o CDF devolvido pelo destinador. */
export const saidas = pgTable(
  'saidas_residuo',
  {
    ...colunasPadrao(),
    residuoId: uuid()
      .notNull()
      .references(() => residuos.id),
    data: date({ mode: 'string' }).notNull(),
    quantidade: doublePrecision().notNull(),
    mtr: varchar({ length: 40 }).notNull(),
    transportador: varchar({ length: 150 }).notNull(),
    destinador: varchar({ length: 150 }).notNull(),
    cdfNumero: varchar({ length: 40 }),
    cdfData: date({ mode: 'string' }),
    cdfRegistradoEm: timestamp({ withTimezone: true, precision: 3 }),
  },
  (t) => [index('saidas_residuo_idx').on(t.empresaId, t.residuoId, t.data)],
);
