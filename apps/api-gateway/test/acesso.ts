import { generateKeyPairSync } from 'node:crypto';
import { SignJWT } from 'jose';
import {
  TODAS_AS_PERMISSOES,
  TOKEN_EMISSOR,
  TOKEN_PUBLICO,
  type Permissao,
} from '@davinci/types';

/** Par de chaves só dos testes: o gateway confere com a pública; aqui assinamos com a privada. */
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
// e2e sem RabbitMQ de eventos (a revogação é testada direto no serviço)
process.env.REVOGACAO_POR_EVENTO = 'desligada';
process.env.JWT_CHAVE_PUBLICA = Buffer.from(
  publicKey.export({ type: 'spki', format: 'pem' }).toString(),
).toString('base64');

export const USUARIO_ID = '0192f1c4-0000-7000-8000-00000000a001';
export const EMPRESA_ID = '0192f1c4-0000-7000-8000-00000000e001';

/** Cabeçalho Authorization com um token como o que o Identidade emitiria. */
export async function comLogin(
  permissoes: readonly Permissao[] = TODAS_AS_PERMISSOES,
  {
    expiraEm = '15m',
    chave = privateKey,
    publico = TOKEN_PUBLICO,
    dts = false,
    c2f = false,
    sid,
  }: {
    expiraEm?: string | number;
    chave?: typeof privateKey;
    publico?: string;
    dts?: boolean;
    c2f?: boolean;
    sid?: string;
  } = {},
): Promise<{ authorization: string }> {
  const token = await new SignJWT({
    emp: EMPRESA_ID,
    nom: 'Ana Souza',
    per: [...permissoes],
    dts,
    c2f,
    ...(sid ? { sid } : {}),
  })
    .setProtectedHeader({ alg: 'EdDSA' })
    .setSubject(USUARIO_ID)
    .setIssuer(TOKEN_EMISSOR)
    .setAudience(publico)
    .setIssuedAt()
    .setExpirationTime(expiraEm)
    .sign(chave);
  return { authorization: `Bearer ${token}` };
}
