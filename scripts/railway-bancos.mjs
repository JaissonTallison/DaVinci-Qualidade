/**
 * Produção (Railway): cria um banco e um usuário por serviço no Postgres, como o infra/postgres/init faz no local,
 * mas com as senhas de produção. Pode rodar de novo: não recria o que existe e atualiza a senha do usuário.
 *
 *   PG_ADMIN_URL=<DATABASE_PUBLIC_URL do Postgres> PG_SENHAS='{"qualidade":"...",...}' node scripts/railway-bancos.mjs
 */
import { createRequire } from 'node:module';

const require = createRequire(new URL('../packages/database/package.json', import.meta.url));
const { Client } = require('pg');

const SERVICOS = ['identidade', 'plataforma', 'codex', 'integracoes', 'paineis', 'qualidade', 'auditorias', 'sgi', 'servicos', 'seguranca', 'ambiental', 'esg'];
const senhas = JSON.parse(process.env.PG_SENHAS ?? '{}');
const admin = new Client({ connectionString: process.env.PG_ADMIN_URL });
await admin.connect();
const literal = (s) => `'${String(s).replaceAll("'", "''")}'`;
for (const s of SERVICOS) {
  const papel = `svc_${s}`;
  const banco = `davinci_${s}`;
  if (!senhas[s]) throw new Error(`Falta a senha de ${s}`);
  const existe = (await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [papel])).rowCount;
  await admin.query(`${existe ? 'ALTER' : 'CREATE'} ROLE ${papel} LOGIN PASSWORD ${literal(senhas[s])}`);
  if (!(await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [banco])).rowCount) {
    await admin.query(`GRANT ${papel} TO CURRENT_USER`);
    await admin.query(`CREATE DATABASE ${banco} OWNER ${papel}`);
  }
  await admin.query(`REVOKE ALL ON DATABASE ${banco} FROM PUBLIC`);
  console.log(`  ✓ ${banco} (${papel})`);
}
await admin.end();
