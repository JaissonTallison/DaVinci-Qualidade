import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Carrega o `.env` do diretório atual (a pasta do app/serviço, quando rodado
 * via pnpm/turbo). Variáveis já definidas no ambiente têm prioridade.
 */
export function loadEnv(file = '.env'): void {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) process.loadEnvFile(path);
}

/** Lê uma variável obrigatória; falha cedo e com mensagem clara se faltar. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}
