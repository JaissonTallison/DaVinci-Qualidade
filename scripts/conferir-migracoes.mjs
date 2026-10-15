#!/usr/bin/env node
// Recusa migração com esquema fixo ("public"."tabela"). O drizzle-kit gera chaves estrangeiras assim, mas os
// testes de integração rodam cada serviço num esquema temporário: com "public" fixo, a chave estrangeira
// aponta para a tabela de desenvolvimento e o teste quebra (ou, pior, grava contra dados reais).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname;
const problemas = [];
for (const servico of readdirSync(join(raiz, 'services'))) {
  const pasta = join(raiz, 'services', servico, 'drizzle');
  let arquivos = [];
  try {
    arquivos = readdirSync(pasta).filter((a) => a.endsWith('.sql'));
  } catch {
    continue;
  }
  for (const arquivo of arquivos) {
    readFileSync(join(pasta, arquivo), 'utf8')
      .split('\n')
      .forEach((linha, i) => {
        if (linha.includes('"public".'))
          problemas.push(`services/${servico}/drizzle/${arquivo}:${i + 1}`);
      });
  }
}
if (problemas.length) {
  console.error(
    '✗ Migração com esquema "public" fixo. Tire o prefixo "public". destas linhas:',
  );
  for (const p of problemas) console.error(`  ${p}`);
  process.exit(1);
}
console.log('✓ Migrações sem esquema fixo');
