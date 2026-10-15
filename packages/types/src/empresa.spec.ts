import type { z } from 'zod';
import {
  dadosDaEmpresaSchema,
  estabelecimentoSchema,
  logoSchema,
  TAMANHO_MAXIMO_LOGO,
} from './empresa.js';
import { detalhesDaValidacao } from './mensagens.js';

const erros = (schema: z.ZodType, d: unknown) => {
  const r = schema.safeParse(d);
  return r.success ? [] : detalhesDaValidacao(r.error.issues);
};

describe('estabelecimento', () => {
  const filial = {
    cnpj: '11.222.333/0002-62',
    nome: 'Loja Campinas',
    razaoSocial: 'Alfa Ltda.',
    inscricaoEstadual: '244.123.456.110',
  };

  it('aceita filial, normaliza CNPJ e CNAE; contribuinte é o padrão', () => {
    expect(
      estabelecimentoSchema.parse({ ...filial, cnaePrincipal: '4721-1/02' }),
    ).toMatchObject({
      cnpj: '11222333000262',
      indicadorIE: 'contribuinte',
      cnaePrincipal: '4721102',
      endereco: null,
    });
  });

  it('CNPJ inválido, nome curto e contribuinte sem IE são recusados no campo certo', () => {
    expect(
      erros(estabelecimentoSchema, {
        ...filial,
        cnpj: '11.222.333/0002-00',
        nome: 'L',
        inscricaoEstadual: '',
      }),
    ).toEqual(
      expect.arrayContaining([
        {
          campo: 'cnpj',
          mensagem:
            'CNPJ inválido. Confira os dígitos (aceita o formato alfanumérico).',
        },
        {
          campo: 'nome',
          mensagem:
            'Informe um nome curto (ex.: Loja Campinas) (mínimo 2 caracteres).',
        },
        {
          campo: 'inscricaoEstadual',
          mensagem: 'Contribuinte do ICMS precisa da inscrição estadual.',
        },
      ]),
    );
  });
});

describe('dados da empresa e logo', () => {
  it('exige nome e versão; telefone guarda só dígitos', () => {
    expect(
      dadosDaEmpresaSchema.parse({
        nome: 'Grupo Alfa',
        telefone: '(11) 3456-7890',
        versao: 'v',
      }),
    ).toMatchObject({ telefone: '1134567890', regimeTributario: null });
    expect(
      erros(dadosDaEmpresaSchema, { nome: '' }).map((e) => e.campo),
    ).toEqual(expect.arrayContaining(['nome', 'versao']));
  });

  it('logo: só PNG, JPG ou SVG e até 500 KB', () => {
    expect(
      erros(logoSchema, { tipo: 'image/gif', base64: 'AAAA' }),
    ).toContainEqual({
      campo: 'tipo',
      mensagem: 'Use uma imagem PNG, JPG ou SVG.',
    });
    const grande = 'A'.repeat(Math.ceil(((TAMANHO_MAXIMO_LOGO + 10) * 4) / 3));
    expect(
      erros(logoSchema, { tipo: 'image/png', base64: grande }),
    ).toContainEqual({
      campo: 'base64',
      mensagem: 'A imagem passa de 500 KB. Reduza o tamanho e tente de novo.',
    });
  });
});
