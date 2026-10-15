import { importSPKI, jwtVerify, type CryptoKey } from 'jose';
import {
  ehRecurso,
  ehPermissao,
  isUuid,
  TOKEN_EMISSOR,
  TOKEN_PUBLICO,
  type ConteudoDoToken,
} from '@davinci/types';

let chave: Promise<CryptoKey> | undefined;

/** Chave pública (base64 do PEM em JWT_CHAVE_PUBLICA), carregada uma vez. */
function chavePublica(): Promise<CryptoKey> {
  const pem = process.env.JWT_CHAVE_PUBLICA;
  if (!pem)
    throw new Error(
      'JWT_CHAVE_PUBLICA ausente no .env do gateway. Rode: pnpm identidade:instalar',
    );
  chave ??= importSPKI(Buffer.from(pem, 'base64').toString('utf8'), 'EdDSA');
  return chave;
}

/** Para os testes trocarem a chave entre cenários. */
export function esquecerChave(): void {
  chave = undefined;
}

/** Confere assinatura, emissor, público e validade. Devolve null se o token não serve. */
export async function conferirToken(
  token: string,
): Promise<ConteudoDoToken | null> {
  const key = await chavePublica();
  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: TOKEN_EMISSOR,
      audience: TOKEN_PUBLICO,
      algorithms: ['EdDSA'],
      clockTolerance: 5,
    });
    const { sub, emp, nom, per, dts, c2f, sid, rec } =
      payload as Partial<ConteudoDoToken>;
    if (
      !isUuid(sub) ||
      !isUuid(emp) ||
      typeof nom !== 'string' ||
      !Array.isArray(per)
    )
      return null;
    return {
      sub,
      emp,
      nom,
      per: per.filter(ehPermissao),
      dts: dts === true,
      c2f: c2f === true,
      sid: typeof sid === 'string' ? sid : undefined,
      rec: Array.isArray(rec) ? rec.filter(ehRecurso) : undefined,
    };
  } catch {
    return null;
  }
}
