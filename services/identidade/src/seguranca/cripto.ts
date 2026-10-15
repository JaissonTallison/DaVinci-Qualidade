import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { requireEnv } from '@davinci/shared';

/**
 * Criptografia de dados sensíveis guardados no banco (segredo do 2FA): AES-256-GCM.
 * A chave fica no .env (CRIPTOGRAFIA_CHAVE, 32 bytes em base64, gerada por `pnpm identidade:instalar`):
 * um banco vazado sem a chave não revela os segredos. Formato: v1.<iv>.<tag>.<dados> (base64url).
 */
let chave: Buffer | undefined;
function chaveAtual(): Buffer {
  if (!chave) {
    const bruta = Buffer.from(requireEnv('CRIPTOGRAFIA_CHAVE'), 'base64');
    if (bruta.length !== 32)
      throw new Error(
        'CRIPTOGRAFIA_CHAVE deve ter 32 bytes em base64. Rode: pnpm identidade:instalar',
      );
    chave = bruta;
  }
  return chave;
}

/** Para os testes trocarem a chave. */
export function esquecerChave(): void {
  chave = undefined;
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', chaveAtual(), iv);
  const dados = Buffer.concat([c.update(texto, 'utf8'), c.final()]);
  return [
    'v1',
    iv.toString('base64url'),
    c.getAuthTag().toString('base64url'),
    dados.toString('base64url'),
  ].join('.');
}

export function decifrar(guardado: string): string {
  const [versao, iv, tag, dados] = guardado.split('.');
  if (versao !== 'v1' || !iv || !tag || !dados)
    throw new Error('Dado cifrado em formato desconhecido');
  const d = createDecipheriv(
    'aes-256-gcm',
    chaveAtual(),
    Buffer.from(iv, 'base64url'),
  );
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    d.update(Buffer.from(dados, 'base64url')),
    d.final(),
  ]).toString('utf8');
}
