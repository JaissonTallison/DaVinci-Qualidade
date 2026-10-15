// Configuração do drizzle-kit (gera e aplica as migrações deste serviço).
// Uso: pnpm db:generate (após mudar src/db/schema.ts) · pnpm db:migrate
import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

if (existsSync('.env')) process.loadEnvFile('.env');
const url = process.env.DATABASE_URL;
if (!url)
  throw new Error(
    'DATABASE_URL não definida: crie o .env a partir do .env.example',
  );

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
  // colunas em snake_case no banco (empresa_id), camelCase no código (empresaId)
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
