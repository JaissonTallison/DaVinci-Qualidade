import { existsSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { uuidv7 } from '@davinci/types';
import { createDatabase } from './connection.js';

/**
 * Banco para TESTES DE INTEGRAÇÃO: um esquema temporário dentro do banco do serviço
 * (o usuário svc_<serviço> é dono do banco e pode criá-lo). Aplica as migrações reais
 * e apaga tudo no fim. Dados de desenvolvimento nunca são tocados.
 *
 *   const banco = await criarBancoDeTeste(schema);   // no beforeAll (cwd = pasta do serviço)
 *   await banco.encerrar();                           // no afterAll
 */
export async function criarBancoDeTeste<
  TSchema extends Record<string, unknown>,
>(schema: TSchema, migrationsFolder = './drizzle') {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const base = process.env.DATABASE_URL;
  if (!base)
    throw new Error(
      'DATABASE_URL não definida: crie o .env e rode `pnpm infra:up`.',
    );

  const esquema = `teste_${uuidv7().replace(/-/g, '').slice(-12)}`;
  const url = new URL(base);
  url.searchParams.set('options', `-c search_path=${esquema},public`);

  const { db, close } = createDatabase({ url: url.toString(), schema });
  await db.execute(sql.raw(`CREATE SCHEMA ${esquema}`));
  await migrate(db, { migrationsFolder, migrationsSchema: esquema });

  return {
    db,
    async encerrar() {
      await db.execute(sql.raw(`DROP SCHEMA ${esquema} CASCADE`));
      await close();
    },
  };
}
