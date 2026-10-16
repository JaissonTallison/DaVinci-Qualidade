import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose';
import type { ErroDeNegocio } from '@davinci/shared';
import { conferirTokenExterno, TENANT_CONTAS_PESSOAIS } from './provedores.js';

const NONCE = 'nonce-de-teste-0123456789';
const TENANT = '11111111-2222-3333-4444-555555555555';
let chaves: JWTVerifyGetKey;

/** Mensagem do ErroDeNegocio (vai no corpo do RpcException, não em Error.message). */
const mensagem = (p: Promise<unknown>) =>
  p.then(
    () => 'aceito',
    (e: ErroDeNegocio) => (e.getError() as { mensagem: string }).mensagem,
  );
let assinar: (p: JWTPayload) => Promise<string>;

beforeAll(async () => {
  process.env.GOOGLE_CLIENT_ID = 'app-google';
  process.env.MICROSOFT_CLIENT_ID = 'app-microsoft';
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  chaves = createLocalJWKSet({
    keys: [{ ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }],
  });
  assinar = (p) =>
    new SignJWT(p)
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
});

const google = (p: JWTPayload) => ({
  iss: 'https://accounts.google.com',
  aud: 'app-google',
  nonce: NONCE,
  email: 'Ana@Empresa.com.br',
  email_verified: true,
  ...p,
});
const microsoft = (p: JWTPayload) => ({
  iss: `https://login.microsoftonline.com/${TENANT}/v2.0`,
  aud: 'app-microsoft',
  tid: TENANT,
  nonce: NONCE,
  email: 'ana@empresa.com.br',
  xms_edov: true,
  ...p,
});

describe('conferir o id_token do Google', () => {
  it('token certo → e-mail em minúsculas', async () => {
    await expect(
      conferirTokenExterno('google', await assinar(google({})), NONCE, chaves),
    ).resolves.toBe('ana@empresa.com.br');
  });

  it.each([
    ['outro aplicativo', { aud: 'app-de-outro' }],
    ['outro emissor', { iss: 'https://falso.example.com' }],
    ['nonce de outro login', { nonce: 'outro-nonce-0123456789' }],
  ])('%s → recusado', async (_, p) => {
    expect(
      await mensagem(
        conferirTokenExterno('google', await assinar(google(p)), NONCE, chaves),
      ),
    ).toContain('Não foi possível confirmar a sua conta Google');
  });

  it('e-mail não verificado → recusado', async () => {
    expect(
      await mensagem(
        conferirTokenExterno(
          'google',
          await assinar(google({ email_verified: false })),
          NONCE,
          chaves,
        ),
      ),
    ).toContain('não informou um e-mail verificado');
  });

  it('assinatura de outra chave → recusado', async () => {
    const { privateKey } = await generateKeyPair('RS256');
    const falso = await new SignJWT(google({}))
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setExpirationTime('5m')
      .sign(privateKey);
    expect(
      await mensagem(conferirTokenExterno('google', falso, NONCE, chaves)),
    ).toContain('Não foi possível confirmar');
  });
});

describe('conferir o id_token da Microsoft', () => {
  it('conta de empresa com domínio verificado (xms_edov) → e-mail', async () => {
    await expect(
      conferirTokenExterno(
        'microsoft',
        await assinar(microsoft({})),
        NONCE,
        chaves,
      ),
    ).resolves.toBe('ana@empresa.com.br');
  });

  it('conta pessoal (outlook/hotmail) → e-mail, sem xms_edov', async () => {
    const p = microsoft({
      tid: TENANT_CONTAS_PESSOAIS,
      iss: `https://login.microsoftonline.com/${TENANT_CONTAS_PESSOAIS}/v2.0`,
      xms_edov: undefined,
    });
    await expect(
      conferirTokenExterno('microsoft', await assinar(p), NONCE, chaves),
    ).resolves.toBe('ana@empresa.com.br');
  });

  it('domínio não verificado pela empresa → recusado (e-mail pode ser de outra pessoa)', async () => {
    expect(
      await mensagem(
        conferirTokenExterno(
          'microsoft',
          await assinar(microsoft({ xms_edov: false })),
          NONCE,
          chaves,
        ),
      ),
    ).toContain('não informou um e-mail verificado');
  });

  it('emissor de outro tenant que não o do token → recusado', async () => {
    expect(
      await mensagem(
        conferirTokenExterno(
          'microsoft',
          await assinar(
            microsoft({ iss: 'https://login.microsoftonline.com/outro/v2.0' }),
          ),
          NONCE,
          chaves,
        ),
      ),
    ).toContain('Não foi possível confirmar a sua conta Microsoft');
  });
});

it('provedor sem ID configurado → avisa que não está configurado', async () => {
  const antes = process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_ID;
  expect(
    await mensagem(
      conferirTokenExterno('google', await assinar(google({})), NONCE, chaves),
    ),
  ).toContain('não está configurado');
  process.env.GOOGLE_CLIENT_ID = antes;
});
