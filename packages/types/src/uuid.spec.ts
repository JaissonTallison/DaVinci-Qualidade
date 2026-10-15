import { isUuid, uuidv7 } from './uuid.js';

describe('uuidv7', () => {
  it('gera UUID válido na versão 7 e variante RFC', () => {
    const id = uuidv7();
    expect(isUuid(id)).toBe(true);
    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });

  it('é ordenado pelo tempo de criação', () => {
    const antes = uuidv7(1_700_000_000_000);
    const depois = uuidv7(1_700_000_000_001);
    expect(antes < depois).toBe(true);
  });

  it('não repete em 10 mil gerações', () => {
    expect(new Set(Array.from({ length: 10_000 }, () => uuidv7())).size).toBe(
      10_000,
    );
  });

  it('codifica o momento de criação nos primeiros 48 bits', () => {
    const ms = 1_791_657_796_133;
    expect(parseInt(uuidv7(ms).replace(/-/g, '').slice(0, 12), 16)).toBe(ms);
  });
});
