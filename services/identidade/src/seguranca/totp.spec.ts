import { randomBytes } from 'node:crypto';
import {
  base32,
  codigoNoPasso,
  conferirCodigo,
  deBase32,
  enderecoOtpauth,
  novoSegredo,
  passoAtual,
} from './totp.js';
import { cifrar, decifrar, esquecerChave } from './cripto.js';

describe('TOTP (RFC 6238)', () => {
  // Vetores oficiais do apêndice B da RFC 6238 (SHA-1, segredo "12345678901234567890", 8 dígitos)
  const segredo = Buffer.from('12345678901234567890');
  it.each([
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
  ])('instante %i → %s', (segundos, esperado) => {
    expect(codigoNoPasso(segredo, Math.floor(segundos / 30), 8)).toBe(esperado);
  });

  it('base32 vai e volta (o formato que o aplicativo lê)', () => {
    const b = randomBytes(20);
    expect(deBase32(base32(b)).equals(b)).toBe(true);
    expect(base32(Buffer.from('12345678901234567890'))).toBe(
      'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
    );
    expect(novoSegredo()).toMatch(/^[A-Z2-7]{32}$/);
  });

  it('aceita o código atual e o vizinho (relógio desajustado), recusa o distante e o reuso', () => {
    const s = novoSegredo();
    const agora = Date.now();
    const atual = codigoNoPasso(deBase32(s), passoAtual(agora));
    const anterior = codigoNoPasso(deBase32(s), passoAtual(agora) - 1);
    const distante = codigoNoPasso(deBase32(s), passoAtual(agora) - 5);
    const passo = conferirCodigo(s, atual, null, agora);
    expect(passo).toBe(passoAtual(agora));
    expect(conferirCodigo(s, anterior, null, agora)).toBe(
      passoAtual(agora) - 1,
    );
    expect(conferirCodigo(s, distante, null, agora)).toBeNull();
    expect(conferirCodigo(s, atual, passo, agora)).toBeNull(); // mesmo código de novo
    expect(conferirCodigo(s, 'abcdef', null, agora)).toBeNull();
  });

  it('endereço otpauth com emissor e conta', () => {
    expect(enderecoOtpauth('ABC', 'ana@alfa.com.br')).toBe(
      'otpauth://totp/DaVinci%20Qualidade%3Aana%40alfa.com.br?secret=ABC&issuer=DaVinci%20Qualidade&algorithm=SHA1&digits=6&period=30',
    );
  });
});

describe('criptografia do segredo', () => {
  beforeAll(() => {
    process.env.CRIPTOGRAFIA_CHAVE = randomBytes(32).toString('base64');
    esquecerChave();
  });

  it('cifra e decifra; o mesmo texto gera cifras diferentes; adulteração é detectada', () => {
    const a = cifrar('SEGREDO');
    expect(a).not.toContain('SEGREDO');
    expect(cifrar('SEGREDO')).not.toBe(a);
    expect(decifrar(a)).toBe('SEGREDO');
    const partes = a.split('.');
    partes[3] = Buffer.from('outro').toString('base64url');
    expect(() => decifrar(partes.join('.'))).toThrow();
  });

  it('outra chave não abre', () => {
    const a = cifrar('SEGREDO');
    process.env.CRIPTOGRAFIA_CHAVE = randomBytes(32).toString('base64');
    esquecerChave();
    expect(() => decifrar(a)).toThrow();
  });
});
