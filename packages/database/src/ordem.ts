import { asc, sql, type AnyColumn, type SQL } from 'drizzle-orm';

/**
 * Ordem alfabética do português (Ágata antes de Bruno, Óculos antes de Protetor, sem diferenciar maiúsculas).
 * O banco roda com collation de bytes, que manda as letras acentuadas para o fim; por isso a ordem é pedida
 * à ICU, que vem no Postgres oficial.
 */
export function ordemAlfabetica(coluna: AnyColumn | SQL): SQL {
  return asc(sql`${coluna} collate "pt-BR-x-icu"`);
}
