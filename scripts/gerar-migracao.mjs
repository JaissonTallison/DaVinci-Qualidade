#!/usr/bin/env node
// `pnpm db:generate --name=<assunto>` dentro de um serviço: gera a migração com o drizzle-kit (repassando os
// argumentos, como o --name) e tira o esquema "public" fixo das chaves estrangeiras (ver conferir-migracoes.mjs).
import { spawnSync } from 'node:child_process';

const passo = (comando, args) => {
  const r = spawnSync(comando, args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
passo('pnpm', ['exec', 'drizzle-kit', 'generate', ...process.argv.slice(2)]);
passo('node', [
  new URL('./conferir-migracoes.mjs', import.meta.url).pathname,
  '--corrigir',
]);
