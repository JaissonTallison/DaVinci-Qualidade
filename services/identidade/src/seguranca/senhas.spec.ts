import {
  conferirSenha,
  gerarSenhaProvisoria,
  protegerSenha,
} from './senhas.js';

const CUSTO_TESTE = 2 ** 12; // rápido para testes; produção usa 2^17

describe('senhas (scrypt)', () => {
  it('confere a senha certa e recusa a errada', async () => {
    const h = await protegerSenha('correta horse battery', CUSTO_TESTE);
    expect(await conferirSenha('correta horse battery', h)).toBe(true);
    expect(await conferirSenha('errada', h)).toBe(false);
  });

  it('nunca guarda a senha em texto e usa sal aleatório', async () => {
    const a = await protegerSenha('mesma-senha-123', CUSTO_TESTE);
    const b = await protegerSenha('mesma-senha-123', CUSTO_TESTE);
    expect(a).not.toContain('mesma-senha-123');
    expect(a).not.toBe(b);
    expect(a.startsWith(`scrypt$${CUSTO_TESTE}$8$1$`)).toBe(true);
  });

  it('confere hash criado com outro custo (parâmetros ficam no hash)', async () => {
    const h = await protegerSenha('senha-de-teste', 2 ** 10);
    expect(await conferirSenha('senha-de-teste', h)).toBe(true);
  });

  it('recusa formato desconhecido sem lançar erro', async () => {
    expect(await conferirSenha('x', 'md5$abc')).toBe(false);
  });

  it('normaliza acentos (NFKC): "José" digitado de formas diferentes confere', async () => {
    const h = await protegerSenha('Senha-José-2026', CUSTO_TESTE);
    expect(await conferirSenha('Senha-José-2026', h)).toBe(true);
  });
});

describe('gerarSenhaProvisoria', () => {
  it('4 blocos de 4, sem caracteres ambíguos, nunca repete', () => {
    const senhas = Array.from({ length: 200 }, gerarSenhaProvisoria);
    for (const s of senhas) {
      expect(s).toMatch(/^[a-zA-Z2-9]{4}(-[a-zA-Z2-9]{4}){3}$/);
      expect(s).not.toMatch(/[01OIl]/);
    }
    expect(new Set(senhas).size).toBe(200);
  });
});
