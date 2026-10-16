import {
  createRemoteJWKSet,
  errors,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose';
import { ErroDeNegocio } from '@davinci/shared';
import { PROVEDORES_EXTERNOS, type ProvedorExterno } from '@davinci/types';

/** Contas pessoais da Microsoft (outlook.com, hotmail.com) vêm todas deste "tenant". */
export const TENANT_CONTAS_PESSOAIS = '9188040d-6c67-4c5b-b112-36a304b66dad';

/** Chaves públicas de cada provedor (o jose busca e guarda em cache na primeira conferência). */
const CHAVES: Record<ProvedorExterno, JWTVerifyGetKey> = {
  google: createRemoteJWKSet(
    new URL('https://www.googleapis.com/oauth2/v3/certs'),
  ),
  microsoft: createRemoteJWKSet(
    new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys'),
  ),
};

/** ID do aplicativo registrado no provedor: é o destinatário (aud) que o token precisa ter. */
const VARIAVEL_DO_ID: Record<ProvedorExterno, string> = {
  microsoft: 'MICROSOFT_CLIENT_ID',
  google: 'GOOGLE_CLIENT_ID',
};

/**
 * Confere o id_token devolvido pelo provedor (assinatura, destinatário, emissor, validade e nonce)
 * e devolve o e-mail da conta, em minúsculas. Só aceita e-mail que o provedor garante ser do dono:
 * no Google, `email_verified`; na Microsoft, conta pessoal ou `xms_edov` (domínio verificado pela
 * empresa). Sem essa garantia, alguém poderia criar uma conta com o e-mail de outra pessoa.
 */
export async function conferirTokenExterno(
  provedor: ProvedorExterno,
  idToken: string,
  nonce: string,
  chaves: JWTVerifyGetKey = CHAVES[provedor],
): Promise<string> {
  const nome = PROVEDORES_EXTERNOS[provedor];
  const clienteId = process.env[VARIAVEL_DO_ID[provedor]];
  if (!clienteId)
    throw new ErroDeNegocio(
      'NAO_AUTENTICADO',
      `Entrar com ${nome} não está configurado neste ambiente.`,
    );
  const recusado = () =>
    new ErroDeNegocio(
      'NAO_AUTENTICADO',
      `Não foi possível confirmar a sua conta ${nome}. Tente de novo.`,
    );

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(idToken, chaves, {
      audience: clienteId,
      ...(provedor === 'google'
        ? { issuer: ['https://accounts.google.com', 'accounts.google.com'] }
        : {}),
    }));
  } catch (e) {
    if (e instanceof errors.JOSEError) throw recusado();
    throw e;
  }
  if (payload.nonce !== nonce) throw recusado();

  const email =
    typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
  if (provedor === 'google') {
    if (!email || payload.email_verified !== true)
      throw semEmailVerificado(nome);
    return email;
  }
  // Microsoft: o emissor tem o tenant da conta; o endereço "common" aceita qualquer um, então confere aqui
  const tenant = typeof payload.tid === 'string' ? payload.tid : '';
  if (payload.iss !== `https://login.microsoftonline.com/${tenant}/v2.0`)
    throw recusado();
  if (
    !email ||
    (tenant !== TENANT_CONTAS_PESSOAIS && payload.xms_edov !== true)
  )
    throw semEmailVerificado(nome);
  return email;
}

const semEmailVerificado = (nome: string) =>
  new ErroDeNegocio(
    'NAO_AUTENTICADO',
    `A sua conta ${nome} não informou um e-mail verificado. Entre com e-mail e senha.`,
  );
