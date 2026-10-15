import { ErroDeNegocio } from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type NovoParceiro,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { ReferenciasService } from '../referencias/referencias.service.js';
import { ParceirosService } from './parceiros.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: ParceirosService;
let referencias: ReferenciasService;

const empresaA: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const empresaB: Contexto = {
  empresaId: uuidv7(),
  usuarioId: null,
  rastreioId: uuidv7(),
};

const alfa: NovoParceiro = {
  tipoPessoa: 'PJ',
  documento: '11.222.333/0001-81',
  nome: 'Distribuidora Alfa Ltda.',
  papeis: ['fornecedor'],
};
const jose: NovoParceiro = {
  tipoPessoa: 'PF',
  documento: '529.982.247-25',
  nome: 'José Antônio Souza',
  papeis: ['cliente'],
};

/** Ficha completa (com a versão) do primeiro parceiro encontrado pela busca. */
const ficha = async (busca: string) =>
  servico.obter(empresaA, {
    id: (await servico.listar(empresaA, { busca })).itens[0]!.id,
  });

/** Executa e devolve o ErroPadrao da recusa (falha o teste se não houver recusa). */
async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  const erro = await promessa.then(
    () => expect.unreachable('era esperada uma recusa'),
    (e: unknown) => e,
  );
  expect(erro).toBeInstanceOf(ErroDeNegocio);
  return (erro as ErroDeNegocio).getError() as ErroPadrao;
}

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new ParceirosService(banco.db);
  referencias = new ReferenciasService(banco.db);
});

afterAll(async () => {
  await banco?.encerrar();
});

describe('criar', () => {
  it('cria com código nº 1, documento normalizado, autoria e versão', async () => {
    const p = await servico.criar(empresaA, alfa);
    expect(p).toMatchObject({
      codigo: 1,
      documento: '11222333000181',
      nome: 'Distribuidora Alfa Ltda.',
      ativo: true,
      enderecos: [],
      papeis: ['fornecedor'],
    });
    expect(p.id[14]).toBe('7'); // UUID v7
    expect(p.versao).toBe(p.atualizadoEm);
  });

  it('numera em sequência por empresa (cada empresa começa no 1)', async () => {
    expect((await servico.criar(empresaA, jose)).codigo).toBe(2);
    expect((await servico.criar(empresaB, alfa)).codigo).toBe(1);
  });

  it('recusa CNPJ repetido na mesma empresa, dizendo qual parceiro já o usa', async () => {
    const erro = await recusa(
      servico.criar(empresaA, { ...alfa, nome: 'Outra' }),
    );
    expect(erro).toMatchObject({
      codigo: 'CONFLITO',
      mensagem:
        'Já existe um parceiro com este CNPJ (nº 1 · Distribuidora Alfa Ltda.).',
      detalhes: [
        {
          campo: 'documento',
          mensagem: 'CNPJ 11.222.333/0001-81 já cadastrado.',
        },
      ],
    });
  });

  it('aceita CNPJ alfanumérico', async () => {
    const p = await servico.criar(empresaA, {
      ...alfa,
      documento: '12.abc.345/01de-35',
      nome: 'Beta Comércio S.A.',
    });
    expect(p.documento).toBe('12ABC34501DE35');
  });

  it('recusa dados inválidos com erro por campo', async () => {
    const erro = await recusa(
      servico.criar(empresaA, { ...alfa, documento: '123', papeis: [] }),
    );
    expect(erro.codigo).toBe('DADOS_INVALIDOS');
    expect(erro.detalhes?.map((d) => d.campo)).toEqual(
      expect.arrayContaining(['documento', 'papeis']),
    );
  });

  it('20 cadastros ao mesmo tempo recebem 20 códigos distintos e sem buracos', async () => {
    const ctx: Contexto = {
      empresaId: uuidv7(),
      usuarioId: null,
      rastreioId: uuidv7(),
    };
    const docs = [
      '11444777000161',
      '45997418000153',
      '60701190000104',
      '33000167000101',
      '00000000000191',
      '60746948000112',
      '02558157000162',
      '33592510000154',
      '90400888000142',
      '76535764000143',
      '61198164000160',
      '47960950000121',
      '04252011000110',
      '07526557000100',
      '43776517000180',
      '00360305000104',
      '18236120000158',
      '09346601000125',
      '60872504000123',
      '59291534000167',
    ];
    const criados = await Promise.all(
      docs.map((documento, i) =>
        servico.criar(ctx, { ...alfa, documento, nome: `Empresa ${i}` }),
      ),
    );
    expect(criados.map((p) => p.codigo).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });
});

describe('listar e obter', () => {
  it('busca sem depender de acento ("jose" encontra "José")', async () => {
    const r = await servico.listar(empresaA, { busca: 'jose antonio' });
    expect(r.itens.map((p) => p.nome)).toEqual(['José Antônio Souza']);
  });

  it('busca por documento com ou sem pontuação e pelo código', async () => {
    expect(
      (await servico.listar(empresaA, { busca: '11.222.333' })).itens[0]
        ?.codigo,
    ).toBe(1);
    expect(
      (await servico.listar(empresaA, { busca: '529982' })).itens[0]?.nome,
    ).toBe('José Antônio Souza');
    expect(
      (await servico.listar(empresaA, { busca: '2' })).itens.some(
        (p) => p.codigo === 2,
      ),
    ).toBe(true);
  });

  it('filtra por papel e informa o total', async () => {
    const clientes = await servico.listar(empresaA, { papel: 'cliente' });
    expect(clientes.itens.every((p) => p.papeis.includes('cliente'))).toBe(
      true,
    );
    expect(clientes).toMatchObject({ total: 1, pagina: 1, porPagina: 25 });
  });

  it('uma empresa nunca vê parceiro de outra', async () => {
    const daB = (await servico.listar(empresaB, {})).itens[0]!;
    expect(
      (await servico.listar(empresaA, { busca: daB.nome })).itens.every(
        (p) => p.id !== daB.id,
      ),
    ).toBe(true);
    expect(await recusa(servico.obter(empresaA, { id: daB.id }))).toMatchObject(
      { codigo: 'NAO_ENCONTRADO', mensagem: 'Parceiro não encontrado.' },
    );
  });

  it('id inexistente ou inválido → não encontrado', async () => {
    expect(
      (await recusa(servico.obter(empresaA, { id: uuidv7() }))).codigo,
    ).toBe('NAO_ENCONTRADO');
    expect((await recusa(servico.obter(empresaA, { id: 'abc' }))).codigo).toBe(
      'NAO_ENCONTRADO',
    );
  });
});

describe('atualizar, inativar e reativar', () => {
  it('atualiza com a versão lida e gera nova versão', async () => {
    const p = await ficha('José');
    const atualizado = await servico.atualizar(empresaA, {
      id: p.id,
      alteracoes: {
        ...jose,
        email: 'jose@exemplo.com.br',
        enderecos: [
          {
            cep: '01310-100',
            logradouro: 'Av. Paulista',
            numero: '1000',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            uf: 'SP',
          },
        ],
        versao: p.versao,
      },
    });
    expect(atualizado).toMatchObject({
      email: 'jose@exemplo.com.br',
      enderecos: [
        {
          tipo: 'principal',
          cep: '01310100',
          cidade: 'São Paulo',
          complemento: null,
        },
      ],
    });
    expect(atualizado.versao).not.toBe(p.versao);
  });

  it('edição simultânea: quem salva com versão antiga é avisado, sem sobrescrever', async () => {
    const p = await ficha('Alfa');
    await servico.atualizar(empresaA, {
      id: p.id,
      alteracoes: {
        ...alfa,
        nomeFantasia: 'Alfa (pessoa 1)',
        versao: p.versao,
      },
    });
    const erro = await recusa(
      servico.atualizar(empresaA, {
        id: p.id,
        alteracoes: {
          ...alfa,
          nomeFantasia: 'Alfa (pessoa 2)',
          versao: p.versao,
        },
      }),
    );
    expect(erro).toEqual({
      codigo: 'CONFLITO',
      mensagem:
        'Este cadastro foi alterado por outra pessoa. Recarregue para ver a versão atual.',
    });
    expect((await servico.obter(empresaA, { id: p.id })).nomeFantasia).toBe(
      'Alfa (pessoa 1)',
    );
  });

  it('não permite trocar para um documento que já é de outro parceiro', async () => {
    const p = await ficha('José');
    const erro = await recusa(
      servico.atualizar(empresaA, {
        id: p.id,
        alteracoes: { ...alfa, versao: p.versao },
      }),
    );
    expect(erro.codigo).toBe('CONFLITO');
  });

  it('inativa com motivo; some da lista padrão; não pode ser editado; reativa', async () => {
    const p = await ficha('Beta');
    expect(
      (
        await recusa(
          servico.inativar(empresaA, {
            id: p.id,
            motivo: '',
            versao: p.versao,
          }),
        )
      ).codigo,
    ).toBe('DADOS_INVALIDOS');

    const inativo = await servico.inativar(empresaA, {
      id: p.id,
      motivo: 'Encerrou as atividades',
      versao: p.versao,
    });
    expect(inativo).toMatchObject({
      ativo: false,
      motivoInativacao: 'Encerrou as atividades',
    });
    expect(inativo.inativadoEm).not.toBeNull();

    expect((await servico.listar(empresaA, { busca: 'Beta' })).total).toBe(0);
    expect(
      (await servico.listar(empresaA, { busca: 'Beta', situacao: 'inativos' }))
        .total,
    ).toBe(1);

    expect(
      await recusa(
        servico.atualizar(empresaA, {
          id: p.id,
          alteracoes: {
            ...alfa,
            documento: '12ABC34501DE35',
            versao: inativo.versao,
          },
        }),
      ),
    ).toMatchObject({
      codigo: 'REGRA_DE_NEGOCIO',
      mensagem: 'Reative o parceiro para alterar o cadastro.',
    });
    expect(
      (
        await recusa(
          servico.inativar(empresaA, {
            id: p.id,
            motivo: 'De novo',
            versao: inativo.versao,
          }),
        )
      ).mensagem,
    ).toBe('Este parceiro já está inativo.');

    const reativado = await servico.reativar(empresaA, {
      id: p.id,
      versao: inativo.versao,
    });
    expect(reativado).toMatchObject({
      ativo: true,
      inativadoEm: null,
      motivoInativacao: null,
    });
  });
});

describe('cadastro completo (Passo 2.5)', () => {
  const completo: NovoParceiro = {
    tipoPessoa: 'PJ',
    documento: '45.997.418/0001-53',
    nome: 'Padaria Pão Quente Ltda.',
    nomeFantasia: 'Pão Quente',
    papeis: ['cliente', 'fornecedor'],
    cnaePrincipal: '1091-1/02',
    cnaesSecundarios: ['4721102'],
    indicadorIE: 'contribuinte',
    inscricaoEstadual: '110.042.490.114',
    regimeTributario: 'simples',
    retencoes: { iss: true },
    emailCobranca: 'cobranca@paoquente.com.br',
    contatos: [
      {
        nome: 'Rita Lima',
        cargo: 'Financeiro',
        telefone: '11987654321',
        whatsapp: true,
      },
    ],
    enderecos: [
      {
        cep: '30130-000',
        logradouro: 'Av. Afonso Pena',
        numero: '100',
        bairro: 'Centro',
        cidade: 'Belo Horizonte',
        uf: 'MG',
      },
      {
        tipo: 'entrega',
        cep: '30140-000',
        logradouro: 'Rua da Bahia',
        numero: '200',
        bairro: 'Lourdes',
        cidade: 'Belo Horizonte',
        uf: 'MG',
      },
    ],
    contasBancarias: [{ banco: '341', agencia: '1234', conta: '56789-0' }],
    chavesPix: [{ tipo: 'cnpj', chave: '45.997.418/0001-53' }],
    limiteCredito: '15000.00',
    etiquetas: ['Padarias', 'VIP'],
  };

  it('grava e devolve tudo: atividades com descrição e setor, listas na ordem, banco com nome', async () => {
    const p = await servico.criar(empresaA, completo);
    expect(p.cnaePrincipal).toMatchObject({ codigo: '1091102', setor: 'C' });
    expect(p.cnaePrincipal?.descricao).toMatch(
      /^Fabricação de produtos de padaria/,
    );
    expect(p.setor).toEqual({ id: 'C', nome: 'Indústrias de transformação' });
    expect(p.cnaesSecundarios.map((c) => c.codigo)).toEqual(['4721102']);
    expect(p.enderecos.map((e) => e.tipo)).toEqual(['principal', 'entrega']);
    expect(p.contasBancarias[0]).toMatchObject({
      banco: '341',
      bancoNome: expect.stringMatching(/ITA/i),
    });
    expect(p).toMatchObject({
      retencoes: { iss: true, ir: false },
      limiteCredito: '15000.00',
      etiquetas: ['Padarias', 'VIP'],
      chavesPix: [{ tipo: 'cnpj', chave: '45997418000153' }],
    });
  });

  it('salvar de novo SUBSTITUI as listas (não acumula) e respeita a versão', async () => {
    const p = (await servico.listar(empresaA, { busca: 'Pão Quente' }))
      .itens[0]!;
    const atual = await servico.obter(empresaA, { id: p.id });
    const salvo = await servico.atualizar(empresaA, {
      id: p.id,
      alteracoes: {
        ...completo,
        contatos: [],
        enderecos: [completo.enderecos![0]!],
        versao: atual.versao,
      },
    });
    expect(salvo.contatos).toEqual([]);
    expect(salvo.enderecos).toHaveLength(1);
    expect(
      (
        await recusa(
          servico.atualizar(empresaA, {
            id: p.id,
            alteracoes: { ...completo, versao: atual.versao },
          }),
        )
      ).codigo,
    ).toBe('CONFLITO');
    expect(
      (await servico.obter(empresaA, { id: p.id })).enderecos,
    ).toHaveLength(1);
  });

  it('atividade e banco precisam existir nas tabelas oficiais', async () => {
    const erro = await recusa(
      servico.criar(empresaA, {
        ...completo,
        documento: '60.701.190/0001-04',
        cnaePrincipal: '9999999',
        contasBancarias: [{ banco: '998', agencia: '1', conta: '1-1' }],
      }),
    );
    expect(erro.detalhes).toEqual(
      expect.arrayContaining([
        {
          campo: 'cnaePrincipal',
          mensagem: 'Atividade 9999-9/99 não existe na CNAE.',
        },
        {
          campo: 'contasBancarias.0.banco',
          mensagem: 'Banco 998 não encontrado. Selecione da lista.',
        },
      ]),
    );
  });

  it('filtros por setor, UF (endereço principal), etiqueta e papel; cidade e setor na linha da lista', async () => {
    const porSetor = await servico.listar(empresaA, { setor: 'C' });
    expect(porSetor.itens.map((p) => p.nome)).toEqual([
      'Padaria Pão Quente Ltda.',
    ]);
    expect(porSetor.itens[0]).toMatchObject({
      cidade: 'Belo Horizonte',
      uf: 'MG',
      setor: { id: 'C' },
    });
    expect((await servico.listar(empresaA, { uf: 'MG' })).total).toBe(1);
    expect((await servico.listar(empresaA, { etiqueta: 'VIP' })).total).toBe(1);
    expect(
      (await servico.listar(empresaA, { papel: 'transportadora' })).total,
    ).toBe(0);
    expect(
      (await servico.listar(empresaA, { busca: 'belo horizonte' })).total,
    ).toBe(1);
  });

  it('estrangeiro: documento livre, país obrigatório, sem duplicar', async () => {
    const ex = await servico.criar(empresaA, {
      tipoPessoa: 'EX',
      documento: 'AR-30-71234567-8',
      nome: 'Importadora Andes S.A.',
      papeis: ['fornecedor'],
      pais: 'Argentina',
    });
    expect(ex).toMatchObject({ documento: 'AR30712345678', pais: 'Argentina' });
    const erro = await recusa(
      servico.criar(empresaA, {
        tipoPessoa: 'EX',
        documento: 'AR30712345678',
        nome: 'Outra',
        papeis: ['cliente'],
        pais: 'Argentina',
      }),
    );
    expect(erro.mensagem).toBe(
      'Já existe um parceiro com este documento (nº ' +
        ex.codigo +
        ' · Importadora Andes S.A.).',
    );
  });
});

describe('tabelas oficiais (referências)', () => {
  it('CNAE: busca por palavra típica, sem acento, e por código com pontuação', async () => {
    expect(
      (await referencias.cnaes({ busca: 'padaria' })).map((c) => c.codigo),
    ).toContain('1091102');
    expect(
      (await referencias.cnaes({ busca: 'confeitaria' })).length,
    ).toBeGreaterThan(0);
    expect((await referencias.cnaes({ busca: '4721-1/02' }))[0]).toMatchObject({
      codigo: '4721102',
      setor: 'G',
    });
    expect(
      (
        await referencias.cnaes({ busca: 'comercio varejista', setor: 'G' })
      ).every((c) => c.setor === 'G'),
    ).toBe(true);
  });

  it('21 setores e bancos com os mais usados primeiro', async () => {
    expect(await referencias.setores()).toHaveLength(21);
    const lista = await referencias.bancos();
    expect(lista.length).toBeGreaterThan(400);
    expect(lista[0]).toMatchObject({ codigo: '001' });
  });
});
