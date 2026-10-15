import { detalhesDaValidacao } from './mensagens.js';
import {
  atualizarParceiroSchema,
  filtroParceirosSchema,
  formatarCnae,
  inativarParceiroSchema,
  novoParceiroSchema,
  type NovoParceiro,
} from './parceiros.js';

const valido: NovoParceiro = {
  tipoPessoa: 'PJ',
  documento: '11.222.333/0001-81',
  nome: '  Distribuidora Alfa Ltda.  ',
  papeis: ['fornecedor'],
};

const erros = (dados: unknown) => {
  const r = novoParceiroSchema.safeParse(dados);
  return r.success ? [] : detalhesDaValidacao(r.error.issues);
};

describe('identificação', () => {
  it('aceita o mínimo e preenche padrões: listas vazias, não contribuinte, retenções desligadas', () => {
    const r = novoParceiroSchema.parse(valido);
    expect(r).toMatchObject({
      documento: '11222333000181',
      nome: 'Distribuidora Alfa Ltda.',
      email: null,
      enderecos: [],
      contatos: [],
      indicadorIE: 'nao_contribuinte',
      bloqueado: false,
      retencoes: {
        iss: false,
        ir: false,
        pis: false,
        cofins: false,
        csll: false,
        inss: false,
      },
    });
  });

  it('aceita CNPJ alfanumérico e pessoa física com CPF', () => {
    expect(erros({ ...valido, documento: '12.ABC.345/01DE-35' })).toEqual([]);
    expect(
      erros({
        ...valido,
        tipoPessoa: 'PF',
        documento: '529.982.247-25',
        nome: 'Ana Souza',
        nascimento: '1990-05-17',
      }),
    ).toEqual([]);
  });

  it('estrangeiro: documento livre (3 a 30) e país obrigatório', () => {
    expect(
      erros({ ...valido, tipoPessoa: 'EX', documento: 'AB123456' }),
    ).toContainEqual({
      campo: 'pais',
      mensagem: 'Informe o país do parceiro estrangeiro.',
    });
    expect(
      erros({
        ...valido,
        tipoPessoa: 'EX',
        documento: 'AB123456',
        pais: 'Argentina',
      }),
    ).toEqual([]);
  });

  it('papéis: pelo menos um, sem repetição; aceita os cinco papéis', () => {
    expect(erros({ ...valido, papeis: [] })).toContainEqual({
      campo: 'papeis',
      mensagem: 'Marque pelo menos um papel (cliente, fornecedor…).',
    });
    const r = novoParceiroSchema.parse({
      ...valido,
      papeis: [
        'cliente',
        'cliente',
        'transportadora',
        'representante',
        'colaborador',
      ],
    });
    expect(r.papeis).toEqual([
      'cliente',
      'transportadora',
      'representante',
      'colaborador',
    ]);
  });

  it.each([
    [
      { documento: '11.222.333/0001-82' },
      'documento',
      'CNPJ inválido. Confira os dígitos (aceita o formato alfanumérico).',
    ],
    [{ tipoPessoa: 'PF' }, 'documento', 'CPF inválido. Confira os dígitos.'],
    [
      { nome: 'A' },
      'nome',
      'Informe o nome ou a razão social (mínimo 2 caracteres).',
    ],
    [
      { email: 'financeiro@' },
      'email',
      'Informe um e-mail válido (ex.: financeiro@empresa.com.br).',
    ],
    [
      { telefone: '1234' },
      'telefone',
      'Informe o telefone com DDD (10 ou 11 dígitos).',
    ],
    [
      {
        nascimento: '2999-01-01',
        tipoPessoa: 'PF',
        documento: '529.982.247-25',
      },
      'nascimento',
      'A data de nascimento não pode ser no futuro.',
    ],
  ])(
    'recusa %o com mensagem clara no campo certo',
    (alteracao, campo, mensagem) => {
      expect(erros({ ...valido, ...alteracao })).toContainEqual({
        campo,
        mensagem,
      });
    },
  );
});

describe('ramo, fiscal e financeiro', () => {
  it('CNAE aceita com ou sem pontuação e remove secundárias repetidas', () => {
    const r = novoParceiroSchema.parse({
      ...valido,
      cnaePrincipal: '4721-1/02',
      cnaesSecundarios: ['4712100', '4712-1/00'],
    });
    expect(r).toMatchObject({
      cnaePrincipal: '4721102',
      cnaesSecundarios: ['4712100'],
    });
    expect(erros({ ...valido, cnaePrincipal: '472' })).toContainEqual({
      campo: 'cnaePrincipal',
      mensagem: 'Informe a atividade (CNAE) com 7 dígitos, ex.: 4721-1/02.',
    });
    expect(formatarCnae('4721102')).toBe('4721-1/02');
  });

  it('contribuinte do ICMS exige inscrição estadual', () => {
    expect(erros({ ...valido, indicadorIE: 'contribuinte' })).toContainEqual({
      campo: 'inscricaoEstadual',
      mensagem: 'Contribuinte do ICMS precisa da inscrição estadual.',
    });
    expect(
      novoParceiroSchema.parse({
        ...valido,
        indicadorIE: 'contribuinte',
        inscricaoEstadual: '110.042.490.114',
      }).inscricaoEstadual,
    ).toBe('110.042.490.114');
  });

  it('retenções parciais completam com "não"; bloqueio exige motivo; limite em texto canônico', () => {
    expect(
      novoParceiroSchema.parse({ ...valido, retencoes: { iss: true } })
        .retencoes,
    ).toMatchObject({ iss: true, inss: false });
    expect(erros({ ...valido, bloqueado: true })).toContainEqual({
      campo: 'motivoBloqueio',
      mensagem: 'Informe o motivo do bloqueio.',
    });
    expect(erros({ ...valido, limiteCredito: '15.000,00' })).toContainEqual({
      campo: 'limiteCredito',
      mensagem: 'Informe um valor válido (ex.: 15000.00).',
    });
    expect(
      novoParceiroSchema.parse({ ...valido, limiteCredito: '15000.5' })
        .limiteCredito,
    ).toBe('15000.5');
  });

  it('etiquetas sem repetição', () => {
    expect(
      novoParceiroSchema.parse({
        ...valido,
        etiquetas: ['VIP', 'VIP', 'Construtoras'],
      }).etiquetas,
    ).toEqual(['VIP', 'Construtoras']);
  });
});

describe('listas: endereços, contatos, contas e Pix', () => {
  const sp = {
    cep: '01310-100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
  };

  it('endereço validado campo a campo, com o índice na lista', () => {
    expect(
      erros({
        ...valido,
        enderecos: [{ ...sp, cep: '0131', numero: '', uf: 'XX' }],
      }),
    ).toEqual(
      expect.arrayContaining([
        { campo: 'enderecos.0.cep', mensagem: 'Informe um CEP com 8 dígitos.' },
        { campo: 'enderecos.0.numero', mensagem: 'Informe o número (ou S/N).' },
        { campo: 'enderecos.0.uf', mensagem: 'Selecione a UF.' },
      ]),
    );
  });

  it('só um endereço principal (e um de cobrança); vários de entrega', () => {
    expect(erros({ ...valido, enderecos: [sp, sp] })).toContainEqual({
      campo: 'enderecos.1.tipo',
      mensagem: 'Só pode haver um endereço principal.',
    });
    expect(
      erros({
        ...valido,
        enderecos: [sp, { ...sp, tipo: 'entrega' }, { ...sp, tipo: 'entrega' }],
      }),
    ).toEqual([]);
    expect(
      novoParceiroSchema.parse({ ...valido, enderecos: [sp] }).enderecos[0],
    ).toMatchObject({ tipo: 'principal', cep: '01310100', complemento: null });
  });

  it('contato precisa de e-mail ou telefone', () => {
    expect(erros({ ...valido, contatos: [{ nome: 'Ana' }] })).toContainEqual({
      campo: 'contatos.0.email',
      mensagem: 'Informe o e-mail ou o telefone do contato.',
    });
    expect(
      erros({
        ...valido,
        contatos: [
          { nome: 'Ana', telefone: '(11) 98765-4321', whatsapp: true },
        ],
      }),
    ).toEqual([]);
  });

  it('conta bancária: banco com 3 dígitos, conta com dígito', () => {
    const r = novoParceiroSchema.parse({
      ...valido,
      contasBancarias: [{ banco: '1', agencia: '1234-5', conta: '12345-6' }],
    });
    expect(r.contasBancarias[0]).toMatchObject({
      banco: '001',
      tipo: 'corrente',
    });
    expect(
      erros({
        ...valido,
        contasBancarias: [{ banco: '341', agencia: '1234', conta: '12345' }],
      }),
    ).toContainEqual({
      campo: 'contasBancarias.0.conta',
      mensagem: 'Informe a conta com o dígito (ex.: 12345-6).',
    });
  });

  it.each([
    ['cpf', '529.982.247-25', '52998224725'],
    ['cnpj', '11.222.333/0001-81', '11222333000181'],
    ['email', 'Financeiro@Alfa.com.br', 'financeiro@alfa.com.br'],
    ['telefone', '(11) 98765-4321', '+5511987654321'],
    [
      'aleatoria',
      '123E4567-E89B-12D3-A456-426614174000',
      '123e4567-e89b-12d3-a456-426614174000',
    ],
  ])('chave Pix %s é validada e normalizada', (tipo, chave, esperada) => {
    expect(
      novoParceiroSchema.parse({ ...valido, chavesPix: [{ tipo, chave }] })
        .chavesPix[0]?.chave,
    ).toBe(esperada);
  });

  it('chave Pix inválida para o tipo é recusada no campo', () => {
    expect(
      erros({ ...valido, chavesPix: [{ tipo: 'cpf', chave: '123' }] }),
    ).toContainEqual({
      campo: 'chavesPix.0.chave',
      mensagem: 'CPF inválido para chave Pix.',
    });
  });
});

describe('atualizar, inativar e filtros', () => {
  it('atualização exige a versão do cadastro (edição simultânea)', () => {
    const r = atualizarParceiroSchema.safeParse(valido);
    expect(r.success).toBe(false);
    expect(detalhesDaValidacao(r.error!.issues)).toContainEqual({
      campo: 'versao',
      mensagem: 'Versão do cadastro ausente: recarregue a página.',
    });
  });

  it('inativação exige motivo', () => {
    const r = inativarParceiroSchema.safeParse({ motivo: ' ', versao: 'v' });
    expect(detalhesDaValidacao(r.error!.issues)).toContainEqual({
      campo: 'motivo',
      mensagem: 'Informe o motivo da inativação (mínimo 3 caracteres).',
    });
  });

  it('filtros têm padrões seguros (ativos, página 1) e aceitam setor, UF, etiqueta e os novos papéis', () => {
    expect(filtroParceirosSchema.parse({})).toMatchObject({
      situacao: 'ativos',
      pagina: 1,
      busca: null,
      papel: null,
      setor: null,
    });
    expect(
      filtroParceirosSchema.parse({
        pagina: '3',
        papel: 'transportadora',
        setor: 'G',
        uf: 'SP',
        etiqueta: 'VIP',
      }),
    ).toMatchObject({
      pagina: 3,
      papel: 'transportadora',
      setor: 'G',
      uf: 'SP',
      etiqueta: 'VIP',
    });
  });
});
