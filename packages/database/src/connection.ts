import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

/** Conexão Drizzle tipada pelo schema do serviço. */
export type Database<
  TSchema extends Record<string, unknown> = Record<string, never>,
> = NodePgDatabase<TSchema>;

export interface DatabaseOptions<TSchema extends Record<string, unknown>> {
  /** postgresql://usuario:senha@host:porta/banco: sempre o banco do PRÓPRIO serviço. */
  url: string;
  /** Tabelas do serviço (src/db/schema.ts). */
  schema: TSchema;
  /** Máximo de conexões abertas por processo. */
  maxConnections?: number;
  /**
   * Chamado quando uma conexão OCIOSA do pool cai (ex.: Postgres reiniciado).
   * Sem este tratador, o driver `pg` emite um erro não tratado e derruba o processo.
   */
  onConnectionError?: (error: Error) => void;
}

export interface DatabaseHandle<TSchema extends Record<string, unknown>> {
  db: Database<TSchema>;
  /** Fecha todas as conexões (usado ao desligar o serviço). */
  close: () => Promise<void>;
}

export function createDatabase<TSchema extends Record<string, unknown>>(
  options: DatabaseOptions<TSchema>,
): DatabaseHandle<TSchema> {
  const pool = new pg.Pool({
    connectionString: options.url,
    max: options.maxConnections ?? 10,
    // Nome visível no Postgres (pg_stat_activity): ajuda a investigar conexões.
    application_name: 'davinci',
  });
  // A conexão perdida é descartada; o pool abre outra quando o banco voltar.
  pool.on(
    'error',
    options.onConnectionError ??
      ((error) => console.error(`[database] ${error.message}`)),
  );
  const db = drizzle({
    client: pool,
    schema: options.schema,
    casing: 'snake_case',
  });
  return { db, close: () => pool.end() };
}
