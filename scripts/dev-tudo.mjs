#!/usr/bin/env node
/**
 * Sobe o ambiente de desenvolvimento inteiro com um comando só: `pnpm dev:tudo`
 *
 *   1. confere se as portas do web (3170) e do gateway (3171) estão livres;
 *   2. sobe a infraestrutura (Postgres, RabbitMQ, Mailpit) e espera ficar saudável;
 *   3. aplica as migrações de todos os serviços;
 *   4. roda web + gateway + serviços em modo watch, com os logs de todos no mesmo terminal (Ctrl+C encerra tudo).
 *
 *   pnpm dev:tudo --essencial              só o essencial (web, gateway, identidade, qualidade, paineis, plataforma): ~2 GB em vez de ~6 GB
 *   pnpm dev:tudo --essencial auditorias   o essencial + os módulos que você vai mexer (ex.: auditorias seguranca); sobe só o necessário
 *   pnpm dev:tudo --sem-infra              pula os passos 2 e 3 (infraestrutura já no ar)
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { readdirSync } from 'node:fs';

const PORTAS = { 3170: 'web', 3171: 'gateway' };
// Serviços que telas de QUALQUER módulo usam (não só a casca): paineis (sino de vencimentos e Início,
// em toda página) e plataforma (anexos e evidências, presentes em NC, auditorias, etc.). Sem eles,
// as telas que os chamam esperam o timeout do gateway. Ver docs/05-modulos/{paineis,plataforma}.md.
const ESSENCIAL = [
  '@davinci/web',
  '@davinci/api-gateway',
  '@davinci/identidade',
  '@davinci/qualidade',
  '@davinci/paineis',
  '@davinci/plataforma',
];
const semInfra = process.argv.includes('--sem-infra');
const essencial = process.argv.includes('--essencial');

// Módulos extras passados na linha (ex.: `--essencial auditorias seguranca`): sobem junto do essencial.
// Assim você usa as telas desses módulos sem subir os 12 serviços (evita "o módulo X não respondeu a tempo").
const MODULOS = new Set([
  ...readdirSync(new URL('../services', import.meta.url), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name),
  'web',
  'api-gateway',
]);
const extras = [];
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('-')) continue;
  const nome = arg.replace(/^@davinci\//, '');
  if (MODULOS.has(nome)) extras.push(`@davinci/${nome}`);
  else {
    console.error(
      `✖ Módulo desconhecido: "${arg}".\n  Opções: ${[...MODULOS].sort().join(', ')}`,
    );
    process.exit(1);
  }
}
if (extras.length && !essencial)
  console.log(
    'ℹ Módulos extras só valem com --essencial. Sem ele, os 12 serviços já sobem.',
  );

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

const pacotes = [...new Set([...ESSENCIAL, ...extras])];
const filtros = essencial ? pacotes.map((p) => `--filter=${p}`) : [];
console.log(
  `\n▸ ${
    essencial
      ? pacotes.map((p) => p.replace('@davinci/', '')).join(', ')
      : 'Web, gateway e os 12 serviços'
  }`,
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
