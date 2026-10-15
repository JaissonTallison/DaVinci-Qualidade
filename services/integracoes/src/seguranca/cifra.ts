import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { Logger } from '@nestjs/common';

/**
 * Cofre das credenciais das integrações (A134): AES-256-GCM com a chave INTEGRACOES_CHAVE (32 bytes em base64).
 * Em desenvolvimento, sem a variável, usa uma chave fixa derivada (com aviso): nunca em produção.
 */
let chave: Buffer | null = null;
function aChave(): Buffer {
  if (chave) return chave;
  const env = process.env.INTEGRACOES_CHAVE;
  if (env) {
    chave = Buffer.from(env, 'base64');
    if (chave.length !== 32)
      throw new Error('INTEGRACOES_CHAVE precisa ter 32 bytes em base64.');
  } else {
    if (process.env.NODE_ENV === 'production')
      throw new Error('Defina INTEGRACOES_CHAVE para guardar credenciais.');
    new Logger('Cofre').warn(
      'INTEGRACOES_CHAVE ausente: usando a chave de desenvolvimento.',
    );
    chave = createHash('sha256').update('davinci-desenvolvimento').digest();
  }
  return chave;
}

export function cifrar(dados: unknown): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', aChave(), iv);
  const corpo = Buffer.concat([
    c.update(JSON.stringify(dados), 'utf8'),
    c.final(),
  ]);
  return [iv, c.getAuthTag(), corpo].map((b) => b.toString('base64')).join('.');
}

export function decifrar<T>(texto: string | null | undefined): T | null {
  if (!texto) return null;
  const [iv, tag, corpo] = texto
    .split('.')
    .map((p) => Buffer.from(p, 'base64'));
  const d = createDecipheriv('aes-256-gcm', aChave(), iv!);
  d.setAuthTag(tag!);
  return JSON.parse(
    Buffer.concat([d.update(corpo!), d.final()]).toString('utf8'),
  ) as T;
}
