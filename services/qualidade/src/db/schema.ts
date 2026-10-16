// Tabelas do serviço qualidade. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import { sql } from 'drizzle-orm';
import {
  boolean,
  jsonb,
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

/** Modelos de inspeção: listas de itens reaproveitáveis. Nunca apagados; inativar tira da escolha. */
export const modelosInspecao = pgTable(
  'modelos_inspecao',
  {
    ...colunasPadrao(),
    nome: varchar({ length: 120 }).notNull(),
    tipo: varchar({ length: 20 }).notNull(),
    /** [{ verificar, criterio }]: copiados para cada inspeção criada a partir do modelo. */
    itens: jsonb()
      .$type<{ verificar: string; criterio: string | null }[]>()
      .notNull(),
    ativo: boolean().notNull().default(true),
  },
  (t) => [unique('modelos_inspecao_nome_por_empresa').on(t.empresaId, t.nome)],
);

/** Inspeções (docs/05-modulos/inspecoes.md). Concluída, não muda mais: é registro de qualidade. */
export const inspecoes = pgTable(
  'inspecoes',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    tipo: varchar({ length: 20 }).notNull(),
    objeto: varchar({ length: 200 }).notNull(),
    lote: varchar({ length: 60 }),
    local: varchar({ length: 120 }),
    quantidade: integer(),
    inspetor: varchar({ length: 120 }).notNull(),
    data: date({ mode: 'string' }).notNull(),
    modeloId: uuid().references(() => modelosInspecao.id),
    /** Nome do modelo no dia da inspeção (o modelo pode ser renomeado depois). */
    modeloNome: varchar({ length: 120 }),
    observacoes: text(),
    /** Amostragem NBR 5426: NQA e nível; o plano é calculado com a quantidade (tamanho do lote). */
    nqa: varchar({ length: 6 }),
    nivelInspecao: varchar({ length: 3 }),
    defeituosos: integer(),
    /** Fornecedor no serviço codex (outro banco: sem chave estrangeira); nome do dia. */
    fornecedorId: uuid(),
    fornecedorNome: varchar({ length: 150 }),
    status: varchar({ length: 15 }).notNull().default('em_andamento'),
    concluidaEm: timestamp({ withTimezone: true, precision: 3 }),
    concluidaPor: uuid(),
    motivoCancelamento: varchar({ length: 500 }),
    canceladaEm: timestamp({ withTimezone: true, precision: 3 }),
    canceladaPor: uuid(),
  },
  (t) => [
    unique('inspecoes_numero_por_empresa').on(t.empresaId, t.numero),
    index('inspecoes_empresa_status_data_idx').on(
      t.empresaId,
      t.status,
      t.data,
    ),
    check(
      'inspecoes_status',
      sql`${t.status} IN ('em_andamento', 'aprovada', 'reprovada', 'cancelada')`,
    ),
  ],
);

/** Itens da inspeção: cópia do modelo (ou digitados), com a resposta. */
export const inspecoesItens = pgTable(
  'inspecoes_itens',
  {
    ...colunasPadrao(),
    inspecaoId: uuid()
      .notNull()
      .references(() => inspecoes.id),
    ordem: smallint().notNull(),
    verificar: varchar({ length: 300 }).notNull(),
    criterio: varchar({ length: 300 }),
    resposta: varchar({ length: 3 }),
    observacao: text(),
  },
  (t) => [
    index('inspecoes_itens_inspecao_idx').on(t.inspecaoId, t.ordem),
    check(
      'inspecoes_itens_resposta',
      sql`${t.resposta} IS NULL OR ${t.resposta} IN ('ok', 'nok', 'na')`,
    ),
  ],
);

/** Instrumentos de medição (docs/05-modulos/calibracao.md). A situação é calculada pelo histórico, nunca gravada. */
export const instrumentos = pgTable(
  'instrumentos',
  {
    ...colunasPadrao(),
    tag: varchar({ length: 30 }).notNull(),
    descricao: varchar({ length: 150 }).notNull(),
    fabricante: varchar({ length: 80 }),
    modelo: varchar({ length: 80 }),
    numeroSerie: varchar({ length: 60 }),
    local: varchar({ length: 120 }),
    responsavel: varchar({ length: 120 }),
    faixa: varchar({ length: 80 }),
    criterioAceitacao: varchar({ length: 200 }),
    frequenciaMeses: smallint().notNull(),
    emUso: boolean().notNull().default(true),
  },
  (t) => [
    unique('instrumentos_tag_por_empresa').on(t.empresaId, t.tag),
    check(
      'instrumentos_frequencia',
      sql`${t.frequenciaMeses} BETWEEN 1 AND 60`,
    ),
  ],
);

/** Histórico de calibrações. Não se edita: registro errado é anulado com motivo. */
export const calibracoes = pgTable(
  'calibracoes',
  {
    ...colunasPadrao(),
    instrumentoId: uuid()
      .notNull()
      .references(() => instrumentos.id),
    data: date({ mode: 'string' }).notNull(),
    laboratorio: varchar({ length: 120 }).notNull(),
    certificado: varchar({ length: 60 }),
    aprovada: boolean().notNull(),
    erroEncontrado: varchar({ length: 200 }),
    observacao: text(),
    custo: colunaDinheiro(),
    anulada: boolean().notNull().default(false),
    motivoAnulacao: varchar({ length: 300 }),
    anuladaPor: uuid(),
  },
  (t) => [
    index('calibracoes_instrumento_data_idx').on(t.instrumentoId, t.data),
  ],
);

/** FMEA de processo (AIAG-VDA). As linhas vão juntas, num documento só, gravado inteiro a cada revisão. */
export const fmeas = pgTable(
  'fmeas',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    titulo: varchar({ length: 150 }).notNull(),
    item: varchar({ length: 150 }).notNull(),
    cliente: varchar({ length: 150 }),
    equipe: varchar({ length: 300 }),
    revisao: varchar({ length: 20 }),
    linhas: jsonb().notNull().default([]),
  },
  (t) => [unique('fmeas_numero_por_empresa').on(t.empresaId, t.numero)],
);

/** Plano de controle (IATF 8.5.1.1), opcionalmente gerado de um FMEA. */
export const planosDeControle = pgTable(
  'planos_de_controle',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    titulo: varchar({ length: 150 }).notNull(),
    item: varchar({ length: 150 }).notNull(),
    fase: varchar({ length: 20 }).notNull(),
    revisao: varchar({ length: 20 }),
    fmeaId: uuid().references(() => fmeas.id),
    linhas: jsonb().notNull().default([]),
  },
  (t) => [
    unique('planos_de_controle_numero_por_empresa').on(t.empresaId, t.numero),
  ],
);

/** PPAP (AIAG 4ª ed.): os 18 elementos com status, submissão e decisão do cliente. */
export const ppaps = pgTable(
  'ppaps',
  {
    ...colunasPadrao(),
    numero: varchar({ length: 20 }).notNull(),
    peca: varchar({ length: 150 }).notNull(),
    numeroDaPeca: varchar({ length: 60 }).notNull(),
    revisaoDoDesenho: varchar({ length: 20 }),
    cliente: varchar({ length: 150 }).notNull(),
    nivel: smallint().notNull(),
    motivo: varchar({ length: 25 }).notNull(),
    fmeaId: uuid().references(() => fmeas.id),
    planoDeControleId: uuid().references(() => planosDeControle.id),
    elementos: jsonb().notNull().default({}),
    status: varchar({ length: 25 }).notNull().default('em_preparacao'),
    submetidoEm: date({ mode: 'string' }),
    parecer: varchar({ length: 1000 }),
    decididoEm: timestamp({ withTimezone: true, precision: 3 }),
  },
  (t) => [
    unique('ppaps_numero_por_empresa').on(t.empresaId, t.numero),
    check('ppaps_nivel', sql`${t.nivel} BETWEEN 1 AND 5`),
  ],
);
