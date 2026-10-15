import { describe, expect, it } from 'vitest';
import { aplicarCep } from './cep.js';

const sp = {
  logradouro: 'Praça da Sé',
  bairro: 'Sé',
  cidade: 'São Paulo',
  uf: 'SP',
  codigoMunicipio: '3550308',
};
const bh = {
  logradouro: 'Av. Afonso Pena',
  bairro: 'Centro',
  cidade: 'Belo Horizonte',
  uf: 'MG',
  codigoMunicipio: '3106200',
};

describe('aplicarCep', () => {
  it('endereço vazio: preenche tudo, inclusive o código do município', () => {
    expect(
      aplicarCep(
        { logradouro: '', bairro: '', cidade: '', uf: '', codigoMunicipio: '' },
        sp,
        false,
      ).endereco,
    ).toEqual(sp);
  });
  it('CEP de outra cidade sem substituir: mantém o endereço e o código antigo e avisa', () => {
    const r = aplicarCep(bh, sp, false);
    expect(r.endereco).toEqual(bh);
    expect(r.aviso).toContain('Este CEP é de São Paulo/SP');
  });
  it('substituir: troca tudo, com o código da nova cidade', () => {
    expect(aplicarCep(bh, sp, true)).toEqual({ endereco: sp });
  });
  it('mesma cidade com grafia diferente (acento): aceita o código', () => {
    expect(
      aplicarCep({ ...sp, cidade: 'Sao Paulo', codigoMunicipio: '' }, sp, false)
        .endereco.codigoMunicipio,
    ).toBe('3550308');
  });
});
