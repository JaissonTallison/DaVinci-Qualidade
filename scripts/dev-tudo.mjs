#!/usr/bin/env node
/**
 * Sobe o ambiente de desenvolvimento inteiro com um comando só: `pnpm dev:tudo`
 *
 *   1. confere se as portas do web (3170) e do gateway (3171) estão livres;
 *   2. sobe a infraestrutura (Postgres, RabbitMQ, Mailpit) e espera ficar saudável;
 *   3. aplica as migrações de todos os serviços;
 *   4. roda web + gateway + serviços em modo watch, com os logs de todos no mesmo terminal (Ctrl+C encerra tudo).
 *
 *   pnpm dev:tudo --essencial   só o que as telas usam hoje (web, gateway, identidade, qualidade): ~2 GB em vez de ~6 GB
 *   pnpm dev:tudo --sem-infra   pula os passos 2 e 3 (infraestrutura já no ar)
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';

const PORTAS = { 3170: 'web', 3171: 'gateway' };
const ESSENCIAL = [
  '@davinci/web',
  '@davinci/api-gateway',
  '@davinci/identidade',
  '@davinci/qualidade',
];
const semInfra = process.argv.includes('--sem-infra');
const essencial = process.argv.includes('--essencial');

const livre = (porta) =>
  new Promise((ok) => {
    const s = createServer()
      .once('error', () => ok(false))
      .once('listening', () => s.close(() => ok(true)))
      .listen(porta, '0.0.0.0');
  });

function etapa(titulo, comando, args) {
  console.log(`\n▸ ${titulo}`);
  const r = spawnSync(comando, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(
      `\n✖ Falhou: ${titulo}. Corrija o erro acima e rode de novo.`,
    );
    process.exit(r.status ?? 1);
  }
}

const ocupadas = [];
for (const [porta, nome] of Object.entries(PORTAS))
  if (!(await livre(Number(porta)))) ocupadas.push(`${porta} (${nome})`);
if (ocupadas.length) {
  console.error(`✖ Porta em uso: ${ocupadas.join(', ')}.`);
  console.error(
    '  Algum terminal ainda está rodando o web, o gateway ou um serviço. Encerre esses terminais (Ctrl+C) e rode de novo.',
  );
  console.error('  Para ver quem está usando: ss -ltnp | grep -E ":317[01]"');
  process.exit(1);
}

if (!semInfra) {
  etapa('Infraestrutura (Postgres, RabbitMQ, Mailpit)', 'docker', [
    'compose',
    'up',
    '-d',
    '--wait',
  ]);
  etapa('Migrações dos bancos', 'pnpm', [
    'turbo',
    'run',
    'db:migrate',
    '--output-logs=errors-only',
  ]);
}

const filtros = essencial ? ESSENCIAL.map((p) => `--filter=${p}`) : [];
console.log(
  `\n▸ ${essencial ? 'Web, gateway, identidade e qualidade' : 'Web, gateway e os 12 serviços'}`,
);
console.log(
  '  Web http://localhost:3170 · Gateway http://localhost:3171 · E-mails http://localhost:5554 · Ctrl+C encerra tudo\n',
);
// --ui=stream: os logs de todos no mesmo terminal, cada linha com o nome de quem escreveu
// Grupo de processos próprio: ao encerrar, o sinal vai para TODOS (turbo, web, gateway, serviços). Mandar só para o
// pnpm deixava web e gateway presos nas portas 3170/3171 quando o encerramento não vinha do Ctrl+C do terminal.
const dev = spawn(
  'pnpm',
  ['turbo', 'run', 'dev', '--concurrency=40', '--ui=stream', ...filtros],
  { stdio: 'inherit', detached: true },
);
let encerrando = false;
function encerrar(sinal) {
  if (encerrando) return;
  encerrando = true;
  try {
    process.kill(-dev.pid, sinal);
  } catch {
    // o grupo já terminou
  }
  // Quem não sair em 5 s é forçado: porta presa atrapalha a próxima execução
  setTimeout(() => {
    try {
      process.kill(-dev.pid, 'SIGKILL');
    } catch {
      // já terminou
    }
  }, 5000).unref();
}
for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'])
  process.on(sinal, () => encerrar(sinal));
dev.on('exit', (codigo) => process.exit(codigo ?? 0));
