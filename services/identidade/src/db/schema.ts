// Tabelas do serviço identidade. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { colunasBase, colunasPadrao } from '@davinci/database';
import { uuidv7 } from '@davinci/types';

const momento = () => timestamp({ withTimezone: true, precision: 3 });
const bytea = customType<{ data: Buffer }>({ dataType: () => 'bytea' });

/** Empresas (inquilinos). Global: é a própria "empresa" do multiempresa. */
export const empresas = pgTable(
  'empresas',
  {
    ...colunasBase(),
    cnpj: varchar({ length: 14 }).notNull(),
    razaoSocial: varchar({ length: 150 }).notNull(),
    nomeFantasia: varchar({ length: 150 }),
    ativa: boolean().notNull().default(true),
    regimeTributario: varchar({ length: 10 }),
    email: varchar({ length: 150 }),
    telefone: varchar({ length: 11 }),
    site: varchar({ length: 150 }),
    /** Logo (até 500 KB): no banco por enquanto; vai para o armazenamento de arquivos quando ele existir. */
    logo: bytea(),
    logoTipo: varchar({ length: 20 }),
    logoAtualizadaEm: timestamp({ withTimezone: true, precision: 3 }),
    /** A122: recursos ligados (null = empresa de antes dos recursos: todos ligados). */
    recursos: text().array(),
  },
  (t) => [unique('empresas_cnpj').on(t.cnpj)],
);

/**
 * Estabelecimentos da empresa: a matriz e as filiais, cada uma com o seu CNPJ.
 * Os cadastros (parceiros…) são da EMPRESA; as operações futuras (títulos, notas) indicam o estabelecimento.
 */
export const estabelecimentos = pgTable(
  'estabelecimentos',
  {
    ...colunasPadrao(),
    tipo: varchar({ length: 6 }).notNull(),
    cnpj: varchar({ length: 14 }).notNull(),
    nome: varchar({ length: 60 }).notNull(),
    razaoSocial: varchar({ length: 150 }).notNull(),
    nomeFantasia: varchar({ length: 150 }),
    indicadorIE: varchar({ length: 20 }).notNull().default('contribuinte'),
    inscricaoEstadual: varchar({ length: 20 }),
    inscricaoMunicipal: varchar({ length: 20 }),
    cnaePrincipal: char({ length: 7 }),
    cnaesSecundarios: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    situacaoCadastral: varchar({ length: 10 }),
    dataAbertura: date({ mode: 'string' }),
    cep: char({ length: 8 }),
    logradouro: varchar({ length: 150 }),
    numero: varchar({ length: 20 }),
    complemento: varchar({ length: 60 }),
    bairro: varchar({ length: 80 }),
    cidade: varchar({ length: 80 }),
    uf: char({ length: 2 }),
    codigoMunicipio: char({ length: 7 }),
    telefone: varchar({ length: 11 }),
    email: varchar({ length: 150 }),
    ativo: boolean().notNull().default(true),
    motivoInativacao: varchar({ length: 300 }),
  },
  (t) => [
    unique('estabelecimentos_cnpj').on(t.cnpj),
    index('estabelecimentos_empresa_idx').on(t.empresaId),
    // Exatamente uma matriz por empresa (o banco garante)
    uniqueIndex('estabelecimentos_uma_matriz')
      .on(t.empresaId)
      .where(sql`${t.tipo} = 'matriz'`),
    check('estabelecimentos_tipo', sql`${t.tipo} IN ('matriz', 'filial')`),
  ],
);

/** Usuários. Global: um usuário pode ter acesso a várias empresas (tabela `vinculos`). */
export const usuarios = pgTable(
  'usuarios',
  {
    ...colunasBase(),
    nome: varchar({ length: 150 }).notNull(),
    /** Sempre em minúsculas. */
    email: varchar({ length: 150 }).notNull(),
    /** scrypt (sal + parâmetros + hash); nunca a senha em texto. */
    senhaHash: text().notNull(),
    ativo: boolean().notNull().default(true),
    /** Senha inicial ou redefinida por administrador: obriga a troca no próximo acesso. */
    deveTrocarSenha: boolean().notNull().default(false),
    falhasLogin: integer().notNull().default(0),
    bloqueadoAte: momento(),
    ultimoAcessoEm: momento(),
    ultimaEmpresaId: uuid(),
    /** Tema da interface escolhido pela pessoa (claro | escuro). */
    tema: varchar({ length: 6 }).notNull().default('claro'),
    /** Preferências da interface (colunas das listas…), por chave de CHAVES_DE_PREFERENCIA. */
    preferencias: jsonb()
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    // Verificação em duas etapas (TOTP). Segredos CIFRADOS (seguranca/cripto.ts), nunca em texto.
    totpSegredo: text(),
    /** Segredo gerado ao iniciar a ativação, até a pessoa confirmar com um código. */
    totpPendente: text(),
    totpAtivadoEm: momento(),
    /** Último passo de 30 s aceito: o mesmo código não vale duas vezes. */
    totpUltimoPasso: integer(),
  },
  (t) => [unique('usuarios_email').on(t.email)],
);

/** Perfis de acesso: conjuntos de permissões, configuráveis por empresa. */
export const perfis = pgTable(
  'perfis',
  {
    ...colunasPadrao(),
    nome: varchar({ length: 60 }).notNull(),
    descricao: varchar({ length: 200 }),
    /** Códigos do catálogo PERMISSOES (@davinci/types). */
    permissoes: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** O perfil Administrador da instalação: não pode perder permissões nem ser removido. */
    protegido: boolean().notNull().default(false),
    ativo: boolean().notNull().default(true),
    /** Quem usa este perfil precisa ter a verificação em duas etapas ativa. */
    exige2fa: boolean().notNull().default(false),
  },
  (t) => [unique('perfis_nome_por_empresa').on(t.empresaId, t.nome)],
);

/** Acesso de um usuário a uma empresa, com um perfil. */
export const vinculos = pgTable(
  'vinculos',
  {
    ...colunasPadrao(),
    usuarioId: uuid().notNull(),
    perfilId: uuid().notNull(),
    ativo: boolean().notNull().default(true),
    /** Histórico de "remover acesso" (nunca apagamos o vínculo). */
    inativadoEm: momento(),
    inativadoPor: uuid(),
    motivoInativacao: varchar({ length: 500 }),
  },
  (t) => [
    unique('vinculos_usuario_por_empresa').on(t.empresaId, t.usuarioId),
    index('vinculos_usuario_idx').on(t.usuarioId),
  ],
);

/**
 * Sessões (tokens de renovação). Guardamos só o HASH do token. Cada renovação
 * revoga a sessão atual e cria outra na mesma `familia`; reutilizar um token já
 * trocado indica cópia, e a família inteira é revogada.
 */
export const sessoes = pgTable(
  'sessoes',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    familia: uuid().notNull(),
    usuarioId: uuid().notNull(),
    empresaId: uuid().notNull(),
    tokenHash: varchar({ length: 64 }).notNull(),
    criadoEm: momento().notNull().defaultNow(),
    expiraEm: momento().notNull(),
    revogadaEm: momento(),
    /** 'renovada' | 'encerrada' | 'reutilizacao' | 'senha-alterada' | 'troca-de-empresa' | 'encerrada-pela-pessoa' … */
    motivoRevogacao: varchar({ length: 30 }),
    ip: varchar({ length: 45 }),
    navegador: varchar({ length: 300 }),
  },
  (t) => [
    unique('sessoes_token').on(t.tokenHash),
    index('sessoes_familia_idx').on(t.familia),
    check('sessoes_expira_depois', sql`${t.expiraEm} > ${t.criadoEm}`),
  ],
);

/** Códigos de recuperação do 2FA: 10, de uso único, guardados só como hash. */
export const codigosRecuperacao = pgTable(
  'codigos_recuperacao',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    usuarioId: uuid().notNull(),
    hash: varchar({ length: 64 }).notNull(),
    criadoEm: momento().notNull().defaultNow(),
    usadoEm: momento(),
  },
  (t) => [index('codigos_recuperacao_usuario_idx').on(t.usuarioId)],
);

/** "Confiar neste navegador por 30 dias": pula o código do 2FA (a senha continua sendo pedida). */
export const navegadoresConfiaveis = pgTable(
  'navegadores_confiaveis',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    usuarioId: uuid().notNull(),
    tokenHash: varchar({ length: 64 }).notNull(),
    navegador: varchar({ length: 300 }),
    criadoEm: momento().notNull().defaultNow(),
    expiraEm: momento().notNull(),
    revogadoEm: momento(),
  },
  (t) => [
    unique('navegadores_confiaveis_token').on(t.tokenHash),
    index('navegadores_confiaveis_usuario_idx').on(t.usuarioId),
  ],
);

/** Senha certa, falta o código do 2FA: o "desafio" vale 5 minutos e aceita 5 tentativas. */
export const desafiosLogin = pgTable(
  'desafios_login',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    usuarioId: uuid().notNull(),
    tokenHash: varchar({ length: 64 }).notNull(),
    empresaId: uuid(),
    ip: varchar({ length: 45 }),
    navegador: varchar({ length: 300 }),
    tentativas: integer().notNull().default(0),
    criadoEm: momento().notNull().defaultNow(),
    expiraEm: momento().notNull(),
    usadoEm: momento(),
  },
  (t) => [unique('desafios_login_token').on(t.tokenHash)],
);

/** Histórico de acessos (180 dias; IP é dado pessoal: apagado depois disso). */
export const acessos = pgTable(
  'acessos',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    usuarioId: uuid(),
    email: varchar({ length: 150 }).notNull(),
    empresaId: uuid(),
    momento: momento().notNull().defaultNow(),
    resultado: varchar({ length: 30 }).notNull(),
    ip: varchar({ length: 45 }),
    navegador: varchar({ length: 300 }),
  },
  (t) => [
    index('acessos_usuario_momento_idx').on(t.usuarioId, t.momento),
    index('acessos_momento_idx').on(t.momento),
  ],
);

/** Links de "esqueci minha senha": 30 minutos, uso único, só o hash do token. */
export const recuperacoesSenha = pgTable(
  'recuperacoes_senha',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    usuarioId: uuid().notNull(),
    tokenHash: varchar({ length: 64 }).notNull(),
    ip: varchar({ length: 45 }),
    criadoEm: momento().notNull().defaultNow(),
    expiraEm: momento().notNull(),
    usadoEm: momento(),
  },
  (t) => [
    unique('recuperacoes_senha_token').on(t.tokenHash),
    index('recuperacoes_senha_usuario_idx').on(t.usuarioId, t.criadoEm),
  ],
);

/**
 * I4: chave de API da empresa para outros sistemas lançarem vendas, despesas e recebimentos. Só o hash (SHA-256)
 * fica gravado; a chave aparece uma vez, na criação. O prefixo identifica a chave na lista.
 */
export const chavesApi = pgTable(
  'chaves_api',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    empresaId: uuid().notNull(),
    nome: varchar({ length: 80 }).notNull(),
    prefixo: varchar({ length: 12 }).notNull(),
    hash: varchar({ length: 64 }).notNull(),
    criadaPor: uuid(),
    criadaPorNome: text(),
    criadaEm: timestamp({ withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    ultimoUso: timestamp({ withTimezone: true, precision: 3 }),
    revogada: boolean().notNull().default(false),
  },
  (t) => [
    unique('chaves_api_hash').on(t.hash),
    index('chaves_api_empresa_idx').on(t.empresaId),
  ],
);
