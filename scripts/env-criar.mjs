// Cria o .env de cada pasta a partir do .env.example (raiz, apps/* e services/*).
// Nunca sobrescreve um .env existente.
import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname;
const pastas = [
  raiz,
  ...['apps', 'services'].flatMap((grupo) => {
    const dir = join(raiz, grupo);
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join(dir, d.name));
  }),
];

for (const pasta of pastas) {
  const exemplo = join(pasta, '.env.example');
  const destino = join(pasta, '.env');
  const nome = pasta === raiz ? '.' : pasta.slice(raiz.length);
  if (!existsSync(exemplo)) continue;
  if (existsSync(destino)) {
    console.log(`  já existe  ${nome}/.env`);
    continue;
  }
  copyFileSync(exemplo, destino);
  console.log(`  criado     ${nome}/.env`);
}
