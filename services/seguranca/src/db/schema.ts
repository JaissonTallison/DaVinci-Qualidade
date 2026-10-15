// Tabelas do serviço seguranca. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
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

/** Contadores da numeração por empresa (`ACI-2026` → último número usado em 2026). */
export const sequencias = pgTable(
  'sequencias',
  {
    empresaId: uuid().notNull(),
    nome: varchar({ length: 30 }).notNull(),
    ultimo: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.empresaId, t.nome] })],
);

/** Acidentes, incidentes e quase-acidentes (docs/05-modulos/acidentes.md). Nada é apagado. */
export const acidentes = pgTable(
  'acidentes',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    tipo: varchar({ length: 20 }).notNull(),
    data: date({ mode: 'string' }).notNull(),
    hora: varchar({ length: 5 }),
    local: varchar({ length: 150 }).notNull(),
    setor: varchar({ length: 100 }),
    acidentado: varchar({ length: 120 }),
    funcao: varchar({ length: 100 }),
    descricao: text().notNull(),
    lesao: varchar({ length: 200 }),
    parteDoCorpo: varchar({ length: 100 }),
    agenteCausador: varchar({ length: 200 }),
    diasPerdidos: integer().notNull().default(0),
    diasDebitados: integer().notNull().default(0),
    medidasImediatas: text(),
    testemunhas: varchar({ length: 500 }),
    catNumero: varchar({ length: 30 }),
    catData: date({ mode: 'string' }),
    status: varchar({ length: 20 }).notNull().default('registrado'),
    causas: text(),
    medidas: text(),
    motivoCancelamento: varchar({ length: 500 }),
  },
  (t) => [
    unique('acidentes_numero_por_empresa').on(t.empresaId, t.numero),
    index('acidentes_empresa_data_idx').on(t.empresaId, t.data),
    check(
      'acidentes_status',
      sql`${t.status} IN ('registrado', 'em_investigacao', 'concluido', 'cancelado')`,
    ),
    check(
      'acidentes_tipo',
      sql`${t.tipo} IN ('com_afastamento', 'sem_afastamento', 'incidente', 'quase_acidente')`,
    ),
    check(
      'acidentes_dias',
      sql`${t.diasPerdidos} >= 0 AND ${t.diasDebitados} >= 0`,
    ),
  ],
);

/** Horas-homem trabalhadas por mês: a base da TF e da TG. Uma linha por empresa e competência. */
export const horasTrabalhadas = pgTable(
  'horas_trabalhadas',
  {
    ...colunasPadrao(),
    competencia: varchar({ length: 7 }).notNull(),
    horas: numeric({ precision: 14, scale: 2, mode: 'number' }).notNull(),
  },
  (t) => [
    unique('horas_trabalhadas_competencia_por_empresa').on(
      t.empresaId,
      t.competencia,
    ),
  ],
);

/** Catálogo de EPIs com o Certificado de Aprovação (docs/05-modulos/epis.md). Inativado, nunca apagado. */
export const epis = pgTable(
  'epis',
  {
    ...colunasPadrao(),
    nome: varchar({ length: 120 }).notNull(),
    ca: varchar({ length: 7 }).notNull(),
    validadeCa: date({ mode: 'string' }).notNull(),
    vidaUtilDias: smallint(),
    ativo: boolean().notNull().default(true),
  },
  (t) => [unique('epis_nome_ca_por_empresa').on(t.empresaId, t.nome, t.ca)],
);

/** Entregas de EPI: a ficha da NR-6. Funcionário e EPI ficam copiados como estavam no dia. */
export const entregasEpi = pgTable(
  'entregas_epi',
  {
    ...colunasPadrao(),
    /** Funcionário no serviço codex (outro banco: sem chave estrangeira). */
    funcionarioId: uuid().notNull(),
    funcionarioNome: varchar({ length: 120 }).notNull(),
    funcionarioMatricula: varchar({ length: 20 }).notNull(),
    epiId: uuid()
      .notNull()
      .references(() => epis.id),
    epiNome: varchar({ length: 120 }).notNull(),
    ca: varchar({ length: 7 }).notNull(),
    quantidade: smallint().notNull(),
    data: date({ mode: 'string' }).notNull(),
    motivo: varchar({ length: 20 }).notNull(),
    termoAssinado: boolean().notNull().default(false),
    observacao: varchar({ length: 500 }),
    proximaTroca: date({ mode: 'string' }),
    devolvidoEm: date({ mode: 'string' }),
    motivoAnulacao: varchar({ length: 300 }),
    anuladaPor: uuid(),
  },
  (t) => [
    index('entregas_epi_funcionario_idx').on(
      t.empresaId,
      t.funcionarioId,
      t.data,
    ),
    check('entregas_epi_quantidade', sql`${t.quantidade} > 0`),
    check(
      'entregas_epi_devolucao',
      sql`${t.devolvidoEm} IS NULL OR ${t.devolvidoEm} >= ${t.data}`,
    ),
  ],
);

/** PGR: inventário de riscos (NR-1). Risco não se apaga: é inativado quando eliminado. */
export const riscos = pgTable(
  'riscos',
  {
    ...colunasPadrao(),
    grupo: varchar({ length: 20 }).notNull(),
    local: varchar({ length: 120 }).notNull(),
    perigo: varchar({ length: 200 }).notNull(),
    danos: varchar({ length: 300 }).notNull(),
    severidade: smallint().notNull(),
    probabilidade: smallint().notNull(),
    controles: varchar({ length: 1000 }),
    acoes: varchar({ length: 1000 }),
    responsavel: varchar({ length: 120 }),
    prazo: date({ mode: 'string' }),
    ativo: boolean().notNull().default(true),
  },
  (t) => [
    index('riscos_empresa_idx').on(t.empresaId, t.ativo),
    check(
      'riscos_escala',
      sql`${t.severidade} BETWEEN 1 AND 4 AND ${t.probabilidade} BETWEEN 1 AND 4`,
    ),
  ],
);

/** Permissões de trabalho. Horários em AAAA-MM-DDTHH:mm, hora de Brasília (é como a PT é preenchida no papel). */
export const permissoesDeTrabalho = pgTable(
  'permissoes_de_trabalho',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    tipo: varchar({ length: 20 }).notNull(),
    local: varchar({ length: 120 }).notNull(),
    servico: varchar({ length: 500 }).notNull(),
    executantes: varchar({ length: 500 }).notNull(),
    inicio: varchar({ length: 16 }).notNull(),
    fim: varchar({ length: 16 }).notNull(),
    riscos: varchar({ length: 1000 }).notNull(),
    epis: varchar({ length: 500 }),
    status: varchar({ length: 15 }).notNull().default('solicitada'),
    liberadaPor: uuid(),
    liberadaEm: timestamp({ withTimezone: true, precision: 3 }),
    encerradaEm: timestamp({ withTimezone: true, precision: 3 }),
    observacaoEncerramento: varchar({ length: 500 }),
    motivoCancelamento: varchar({ length: 300 }),
  },
  (t) => [
    unique('pts_numero_por_empresa').on(t.empresaId, t.numero),
    index('pts_status_idx').on(t.empresaId, t.status),
  ],
);

/** DDS, APR, reunião da CIPA e simulado. Não se editam: registro errado é anulado com motivo. */
export const registrosSst = pgTable(
  'registros_sst',
  {
    ...colunasPadrao(),
    tipo: varchar({ length: 20 }).notNull(),
    data: date({ mode: 'string' }).notNull(),
    tema: varchar({ length: 200 }).notNull(),
    local: varchar({ length: 120 }),
    responsavel: varchar({ length: 120 }).notNull(),
    participantes: integer().notNull(),
    conteudo: varchar({ length: 4000 }).notNull(),
    motivoAnulacao: varchar({ length: 300 }),
  },
  (t) => [index('registros_sst_tipo_idx').on(t.empresaId, t.tipo, t.data)],
);

/** Empresas terceirizadas que trabalham dentro da empresa. */
export const terceiros = pgTable(
  'terceiros',
  {
    ...colunasPadrao(),
    razaoSocial: varchar({ length: 150 }).notNull(),
    cnpj: varchar({ length: 14 }).notNull(),
    servico: varchar({ length: 200 }).notNull(),
    contato: varchar({ length: 120 }),
    inicioContrato: date({ mode: 'string' }).notNull(),
    fimContrato: date({ mode: 'string' }),
  },
  (t) => [unique('terceiros_cnpj_por_empresa').on(t.empresaId, t.cnpj)],
);

/** Documentos de SST da terceira. Não se editam: o novo do mesmo tipo substitui o antigo. */
export const documentosTerceiros = pgTable(
  'documentos_terceiros',
  {
    ...colunasPadrao(),
    terceiroId: uuid()
      .notNull()
      .references(() => terceiros.id),
    tipo: varchar({ length: 20 }).notNull(),
    descricao: varchar({ length: 150 }),
    validade: date({ mode: 'string' }).notNull(),
  },
  (t) => [index('documentos_terceiros_idx').on(t.empresaId, t.terceiroId)],
);
