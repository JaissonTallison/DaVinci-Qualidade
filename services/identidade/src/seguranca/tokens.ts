import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, importPKCS8, type CryptoKey } from 'jose';
import { requireEnv } from '@davinci/shared';
import {
  TOKEN_EMISSOR,
  TOKEN_PUBLICO,
  type ConteudoDoToken,
} from '@davinci/types';

export const ACESSO_MINUTOS = 15;
export const RENOVACAO_DIAS = 7;
/**
 * Carência após uma renovação: o navegador costuma disparar várias requisições ao mesmo tempo
 * com o mesmo token. Dentro deste prazo, o token antigo ainda renova (sem ser tratado como cópia).
 */
export const CARENCIA_SEGUNDOS = 30;

let chavePrivada: Promise<CryptoKey> | undefined;

/** Chave Ed25519 de ASSINATURA (só o Identidade a tem). .env: JWT_CHAVE_PRIVADA (PEM em base64). */
function chave(): Promise<CryptoKey> {
  chavePrivada ??= importPKCS8(
    Buffer.from(requireEnv('JWT_CHAVE_PRIVADA'), 'base64').toString('utf8'),
    'EdDSA',
  );
  return chavePrivada;
}

export async function emitirTokenDeAcesso(
  conteudo: ConteudoDoToken,
  agora = new Date(),
) {
  const expiraEm = new Date(agora.getTime() + ACESSO_MINUTOS * 60_000);
  const token = await new SignJWT({
    emp: conteudo.emp,
    nom: conteudo.nom,
    per: conteudo.per,
    dts: conteudo.dts,
    c2f: conteudo.c2f,
    sid: conteudo.sid,
    rec: conteudo.rec,
  })
    .setProtectedHeader({ alg: 'EdDSA' })
    .setSubject(conteudo.sub)
    .setIssuer(TOKEN_EMISSOR)
    .setAudience(TOKEN_PUBLICO)
    .setIssuedAt(Math.floor(agora.getTime() / 1000))
    .setExpirationTime(Math.floor(expiraEm.getTime() / 1000))
    .sign(await chave());
  return { token, expiraEm };
}

/** Token de renovação: aleatório e opaco (256 bits). No banco, só o hash. */
export function novoTokenDeRenovacao(agora = new Date()) {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    hash: hashDoToken(token),
    expiraEm: new Date(agora.getTime() + RENOVACAO_DIAS * 86_400_000),
  };
}

export function hashDoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
