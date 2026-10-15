#!/usr/bin/env node
// Cria um microsserviço no padrão do projeto (docs/02-arquitetura/microsservicos.md).
//
// Uso:
//   pnpm novo:servico <nome> --camada <plataforma|dominio|inteligencia> --descricao "<frase>"
//
// O que faz:
//   1. services/<nome>/ completo (NestJS + RabbitMQ, health check, teste, README)
//   2. registra o serviço em packages/types/src/services.ts (SERVICES)
//   3. acrescenta banco + usuário em infra/postgres/init/01-bancos-por-servico.sql
//   4. imprime o SQL para aplicar num Postgres local que já existe
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';

const ROOT = resolve(import.meta.dirname, '..');
const CAMADAS = {
  plataforma: 'Plataforma (transversal: usado por todos os módulos)',
  dominio: 'Domínio (registros do sistema de gestão: QSSMA e ESG)',
  inteligencia: 'Inteligência (lê de todos, não grava em ninguém)',
};

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { camada: { type: 'string' }, descricao: { type: 'string' } },
});
const nome = positionals[0];
const erro = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};
if (!nome || !/^[a-z][a-z0-9]{2,29}$/.test(nome)) {
  erro(
    'Informe o nome do serviço: minúsculas, sem acento nem hífen (ex.: fiscal).',
  );
}
if (!values.camada || !(values.camada in CAMADAS)) {
  erro(`Informe --camada: ${Object.keys(CAMADAS).join(' | ')}`);
}
if (!values.descricao) erro('Informe --descricao "<o que o serviço faz>"');

const dir = join(ROOT, 'services', nome);
if (existsSync(dir)) erro(`services/${nome} já existe.`);
const CONST = nome.toUpperCase();
const { camada, descricao } = values;

const arquivos = {
  'package.json':
    JSON.stringify(
      {
        name: `@davinci/${nome}`,
        version: '0.0.1',
        private: true,
        license: 'UNLICENSED',
        description: `Microsserviço ${nome} — ${descricao}`,
        type: 'module',
        scripts: {
          build: 'nest build',
          dev: 'nest start --watch',
          start: 'nest start',
          'start:prod': 'node dist/main',
          typecheck: 'tsc -p tsconfig.json --noEmit',
          lint: 'oxlint --type-aware src/',
          test: 'vitest run',
          'test:watch': 'vitest',
          'db:generate':
            'drizzle-kit generate && node ../../scripts/conferir-migracoes.mjs --corrigir',
          'db:migrate': 'drizzle-kit migrate',
        },
        dependencies: {
          '@davinci/database': 'workspace:*',
          '@davinci/shared': 'workspace:*',
          '@davinci/types': 'workspace:*',
          '@nestjs/common': 'catalog:',
          '@nestjs/core': 'catalog:',
          '@nestjs/microservices': 'catalog:',
          'amqp-connection-manager': 'catalog:',
          amqplib: 'catalog:',
          'drizzle-orm': 'catalog:',
          'reflect-metadata': 'catalog:',
          rxjs: 'catalog:',
        },
        devDependencies: {
          '@davinci/config': 'workspace:*',
          '@nestjs/cli': 'catalog:',
          '@nestjs/schematics': 'catalog:',
          '@nestjs/testing': 'catalog:',
          '@types/node': 'catalog:',
          'drizzle-kit': 'catalog:',
          oxlint: 'catalog:',
          'oxlint-tsgolint': 'catalog:',
          typescript: 'catalog:',
          vitest: 'catalog:',
        },
      },
      null,
      2,
    ) + '\n',
  'tsconfig.json': `{
  "extends": "@davinci/config/tsconfig/nest.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist"
  },
  "exclude": ["node_modules", "dist"]
}
`,
  'tsconfig.build.json': `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
`,
  'nest-cli.json': `{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
`,
  'vitest.config.ts': `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
  },
});
`,
  '.env.example': `# Copie para .env (não versionado). Valores de desenvolvimento local (compose.yaml).
RABBITMQ_URL=amqp://davinci:davinci@localhost:5551
DATABASE_URL=postgresql://svc_${nome}:${nome}@localhost:5550/davinci_${nome}
`,
  'src/main.ts': `import '@davinci/shared/load-env';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FiltroDeErrosRpc, rmqServerOptions } from '@davinci/shared';
import { queueName, SERVICES } from '@davinci/types';
import { AppModule } from './app.module.js';

const SERVICE = SERVICES.${CONST};

const app = await NestFactory.createMicroservice(AppModule, rmqServerOptions(SERVICE));
// Todo erro sai no formato padrão; erro inesperado não vaza detalhe técnico.
app.useGlobalFilters(new FiltroDeErrosRpc());
await app.listen();
new Logger('Bootstrap').log(\`Serviço "\${SERVICE}" ouvindo a fila \${queueName(SERVICE)}\`);
`,
  'drizzle.config.ts': `// Configuração do drizzle-kit (gera e aplica as migrações deste serviço).
// Uso: pnpm db:generate (após mudar src/db/schema.ts) · pnpm db:migrate
import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

if (existsSync('.env')) process.loadEnvFile('.env');
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL não definida: crie o .env a partir do .env.example');

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
`,
  'src/db/schema.ts': `// Tabelas do serviço ${nome}. Cada tabela exportada aqui entra nas migrações (pnpm db:generate).
export {};
`,
  'drizzle/0000_base.sql': `-- Migração base: inicia o controle de migrações deste serviço
-- (tabela drizzle.__drizzle_migrations). As tabelas de negócio chegam a partir do Passo 1.
SELECT 1;
`,
  'drizzle/meta/_journal.json': JSON.stringify(
    {
      version: '7',
      dialect: 'postgresql',
      entries: [
        {
          idx: 0,
          version: '7',
          when: Date.now(),
          tag: '0000_base',
          breakpoints: true,
        },
      ],
    },
    null,
    2,
  ),
  'drizzle/meta/0000_snapshot.json': JSON.stringify(
    {
      id: randomUUID(),
      prevId: '00000000-0000-0000-0000-000000000000',
      version: '7',
      dialect: 'postgresql',
      tables: {},
      enums: {},
      schemas: {},
      views: {},
      sequences: {},
      roles: {},
      policies: {},
      _meta: { columns: {}, schemas: {}, tables: {} },
    },
    null,
    2,
  ),
  'src/app.module.ts': `import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema })],
  controllers: [HealthController],
})
export class AppModule {}
`,
  'src/health.controller.ts': `import { Controller, Inject } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DATABASE, pingDatabase, type Database } from '@davinci/database';
import { PATTERNS, SERVICES, type HealthPong } from '@davinci/types';

@Controller()
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @MessagePattern(PATTERNS.health.ping)
  async ping(): Promise<HealthPong> {
    return {
      service: SERVICES.${CONST},
      status: 'ok',
      database: (await pingDatabase(this.db)) ? 'ok' : 'indisponivel',
      timestamp: new Date().toISOString(),
    };
  }
}
`,
  'src/health.controller.spec.ts': `import { Test } from '@nestjs/testing';
import { DATABASE } from '@davinci/database';
import { SERVICES } from '@davinci/types';
import { HealthController } from './health.controller.js';

async function controllerCom(execute: () => Promise<unknown>) {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [{ provide: DATABASE, useValue: { execute } }],
  }).compile();
  return moduleRef.get(HealthController);
}

describe('HealthController', () => {
  it('responde ao ping com o nome do serviço e o banco ok', async () => {
    const pong = await (await controllerCom(async () => ({ rows: [] }))).ping();
    expect(pong).toMatchObject({ service: SERVICES.${CONST}, status: 'ok', database: 'ok' });
  });

  it('informa banco indisponível sem derrubar o serviço', async () => {
    const pong = await (await controllerCom(() => Promise.reject(new Error('recusado')))).ping();
    expect(pong).toMatchObject({ status: 'ok', database: 'indisponivel' });
  });
});
`,
  'README.md': `# @davinci/${nome}

**Camada:** ${CAMADAS[camada]}
**Responsabilidade:** ${descricao}.

| Item | Valor |
| --- | --- |
| Fila RabbitMQ | \`davinci.${nome}\` |
| Banco | \`davinci_${nome}\` (usuário \`svc_${nome}\`) |
| HTTP | nenhum: só mensagens, via gateway |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

\`\`\`bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/${nome}
curl localhost:3171/health/services
\`\`\`
`,
};

for (const [rel, conteudo] of Object.entries(arquivos)) {
  const path = join(dir, rel);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, conteudo);
}
console.log(`  ✓ services/${nome}/ (${Object.keys(arquivos).length} arquivos)`);

// registra em @davinci/types
const servicesTs = join(ROOT, 'packages/types/src/services.ts');
const ts = readFileSync(servicesTs, 'utf8');
if (!ts.includes(`'${nome}'`)) {
  const atualizado = ts
    .replace(/\n\} as const;/, `\n  ${CONST}: '${nome}',\n} as const;`)
    .replace(
      /\n\} as const satisfies Record<ServiceName, ServiceLayer>;/,
      `\n  ${nome}: '${camada}',\n} as const satisfies Record<ServiceName, ServiceLayer>;`,
    );
  writeFileSync(servicesTs, atualizado);
  console.log(
    `  ✓ packages/types/src/services.ts  (SERVICES.${CONST}, camada ${camada})`,
  );
}

// banco + usuário
const sql = `\nCREATE ROLE svc_${nome} LOGIN PASSWORD '${nome}';
CREATE DATABASE davinci_${nome} OWNER svc_${nome};
REVOKE ALL ON DATABASE davinci_${nome} FROM PUBLIC;\n`;
const initSql = join(ROOT, 'infra/postgres/init/01-bancos-por-servico.sql');
if (!readFileSync(initSql, 'utf8').includes(`davinci_${nome} `)) {
  writeFileSync(initSql, readFileSync(initSql, 'utf8') + sql);
  console.log('  ✓ infra/postgres/init/01-bancos-por-servico.sql');
}

console.log(`
Próximos passos:
  1. pnpm install && pnpm build
  2. Banco local já existente? Aplique o SQL (o init só roda na criação do volume):
     docker compose exec -T postgres psql -U davinci -d davinci <<'SQL'${sql}SQL
  3. cp services/${nome}/.env.example services/${nome}/.env
     pnpm --filter @davinci/${nome} db:migrate   (aplica a migração base)
  4. Descreva o domínio em docs/02-arquitetura/dominios.md e registre no CHANGELOG.md`);
