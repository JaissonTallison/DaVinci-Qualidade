import {
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

/**
 * Senhas com scrypt (recomendado pela OWASP; nativo do Node, sem dependência).
 * Formato guardado: scrypt$N$r$p$sal$hash (base64url). Os parâmetros ficam no
 * próprio hash: dá para aumentar o custo no futuro sem invalidar senhas antigas.
 */
export const CUSTO_PADRAO = 2 ** 17; // OWASP: N=2^17, r=8, p=1 (~0,4 s por verificação)
const R = 8;
const P = 1;
const TAMANHO = 64;

function derivar(
  senha: string,
  sal: Buffer,
  opcoes: ScryptOptions,
): Promise<Buffer> {
  return new Promise((ok, falha) =>
    scrypt(
      senha.normalize('NFKC'),
      sal,
      TAMANHO,
      { ...opcoes, maxmem: 256 * 1024 * 1024 },
      (e, h) => (e ? falha(e) : ok(h)),
    ),
  );
}

export async function protegerSenha(
  senha: string,
  custo = CUSTO_PADRAO,
): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derivar(senha, sal, { N: custo, r: R, p: P });
  return [
    'scrypt',
    custo,
    R,
    P,
    sal.toString('base64url'),
    hash.toString('base64url'),
  ].join('$');
}

export async function conferirSenha(
  senha: string,
  guardado: string,
): Promise<boolean> {
  const [alg, n, r, p, sal, hash] = guardado.split('$');
  if (alg !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'base64url');
  const calculado = await derivar(senha, Buffer.from(sal, 'base64url'), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return (
    calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
  );
}

/** Sem caracteres que se confundem ao ditar ou copiar à mão (0/O, 1/l/I). */
const ALFABETO = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Senha provisória legível, em 4 blocos (ex.: `Kp7m-X9qr-hT4w-N2bz`, ~90 bits).
 * Mostrada uma única vez a quem cadastrou; a pessoa é obrigada a trocá-la no 1º acesso.
 */
export function gerarSenhaProvisoria(): string {
  // randomInt: sorteio uniforme (sem o viés de `byte % tamanho`)
  const letras = Array.from(
    { length: 16 },
    () => ALFABETO[randomInt(ALFABETO.length)],
  ).join('');
  return letras.match(/.{4}/g)!.join('-');
}
