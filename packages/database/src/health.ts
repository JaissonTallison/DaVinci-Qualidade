import { sql } from 'drizzle-orm';
import type { Database } from './connection.js';

/** Executa `SELECT 1`; `false` se o banco não responder dentro do prazo. */
export async function pingDatabase(
  db: Pick<Database<Record<string, unknown>>, 'execute'>,
  timeoutMs = 2000,
): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  try {
    return await Promise.race([
      db.execute(sql`select 1`).then(() => true),
      timeout,
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
