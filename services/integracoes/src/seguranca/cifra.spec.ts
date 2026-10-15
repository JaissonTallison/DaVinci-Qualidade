import { describe, expect, it } from 'vitest';
import { cifrar, decifrar } from './cifra.js';

describe('cofre das credenciais', () => {
  it('cifra e decifra; texto adulterado falha', () => {
    const c = cifrar({ clientSecret: 'segredo' });
    expect(c).not.toContain('segredo');
    expect(decifrar<{ clientSecret: string }>(c)).toEqual({
      clientSecret: 'segredo',
    });
    const [iv, tag, corpo] = c.split('.');
    expect(() =>
      decifrar(
        `${iv}.${tag}.${Buffer.from('outro').toString('base64')}${corpo!.slice(8)}`,
      ),
    ).toThrow();
    expect(decifrar(null)).toBeNull();
  });
});
