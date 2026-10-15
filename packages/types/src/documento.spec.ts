import {
  cnpjValido,
  cpfValido,
  formatarDocumento,
  normalizarDocumento,
} from './documento.js';

describe('CNPJ', () => {
  it.each([
    ['11.222.333/0001-81', 'numérico com pontuação'],
    ['11222333000181', 'numérico sem pontuação'],
    ['12.ABC.345/01DE-35', 'ALFANUMÉRICO: exemplo oficial da Receita'],
    ['12.abc.345/01de-35', 'alfanumérico em minúsculas'],
  ])('aceita %s (%s)', (cnpj) => {
    expect(cnpjValido(cnpj)).toBe(true);
  });

  it.each([
    ['11.222.333/0001-82', 'dígito verificador errado'],
    ['12.ABC.345/01DE-36', 'alfanumérico com DV errado'],
    ['00.000.000/0000-00', 'todos iguais'],
    ['11.222.333/0001', 'curto demais'],
    ['12.ABC.345/01DE-3A', 'letra no dígito verificador'],
  ])('recusa %s (%s)', (cnpj) => {
    expect(cnpjValido(cnpj)).toBe(false);
  });
});

describe('CPF', () => {
  it('aceita CPF válido, com ou sem pontuação', () => {
    expect(cpfValido('529.982.247-25')).toBe(true);
    expect(cpfValido('52998224725')).toBe(true);
  });

  it.each(['529.982.247-24', '111.111.111-11', '123', 'ABC.982.247-25'])(
    'recusa %s',
    (cpf) => {
      expect(cpfValido(cpf)).toBe(false);
    },
  );
});

describe('formatação', () => {
  it('normaliza para guardar no banco', () => {
    expect(normalizarDocumento('12.abc.345/01de-35')).toBe('12ABC34501DE35');
  });

  it.each([
    ['52998224725', '529.982.247-25'],
    ['11222333000181', '11.222.333/0001-81'],
    ['12ABC34501DE35', '12.ABC.345/01DE-35'],
  ])('formata %s → %s', (entrada, saida) => {
    expect(formatarDocumento(entrada)).toBe(saida);
  });
});

describe('CEP e telefone', () => {
  it('formata CEP e telefones fixo e celular', async () => {
    const { formatarCep, formatarTelefone } = await import('./documento.js');
    expect(formatarCep('01310100')).toBe('01310-100');
    expect(formatarTelefone('1134567890')).toBe('(11) 3456-7890');
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321');
    expect(formatarTelefone('123')).toBe('123');
  });
});
