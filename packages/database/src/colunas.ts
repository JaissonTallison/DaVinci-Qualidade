import { numeric, timestamp, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '@davinci/types';

/** Datas e autoria: comuns a todas as tabelas. */
function colunasDeRegistro() {
  return {
    // precision 3 (milissegundos): o mesmo que o JavaScript representa, para que
    // `atualizadoEm` sirva de versão do registro (edição simultânea) sem divergir.
    criadoEm: timestamp({ withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    /** Usuário que criou/alterou (nulo em operações do sistema, ex.: instalação). */
    criadoPor: uuid(),
    atualizadoPor: uuid(),
  };
}

/** UUID v7: ordenado pelo tempo, sem colisão entre serviços/empresas. */
const id = () =>
  uuid()
    .primaryKey()
    .$defaultFn(() => uuidv7());

/**
 * Colunas que TODA tabela de negócio tem (docs/02-arquitetura/banco-de-dados.md §8).
 * Uso: pgTable('parceiros', { ...colunasPadrao(), nome: text().notNull() })
 *
 * No banco os nomes ficam em snake_case (empresa_id, criado_em) graças ao
 * `casing: 'snake_case'` da conexão e do drizzle.config.ts.
 */
export function colunasPadrao() {
  return {
    id: id(),
    /** Multiempresa: todo registro pertence a uma empresa; toda consulta filtra por ela. */
    empresaId: uuid().notNull(),
    ...colunasDeRegistro(),
  };
}

/**
 * Para cadastros GLOBAIS, que não pertencem a uma empresa (ex.: empresas e usuários
 * no serviço Identidade: um usuário pode acessar várias empresas). Use só nesses casos.
 */
export function colunasBase() {
  return { id: id(), ...colunasDeRegistro() };
}

/**
 * Valor monetário: numeric(18,2), exato. Lido/gravado como texto ("1234.56"),
 * que vira `Dinheiro` no código: Dinheiro.de(linha.valor).
 * Até 9.999.999.999.999.999,99 (16 dígitos inteiros).
 */
export function colunaDinheiro() {
  return numeric({ precision: 18, scale: 2, mode: 'string' });
}

/** Quantidades e preços unitários: numeric(18,4) (ex.: 2,5000 kg a R$ 3,1250). */
export function colunaQuantidade() {
  return numeric({ precision: 18, scale: 4, mode: 'string' });
}
