import { ErroDeNegocio, hojeEmBrasilia, somarDias } from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type NovoFuncionario,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { EstruturaService } from './estrutura.service.js';
import { FuncionariosService } from './funcionarios.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let funcionarios: FuncionariosService;
let estrutura: EstruturaService;

const empresaA: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const empresaB: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();
let producao: string;
let operador: string;

async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

const joao = (extra: Partial<NovoFuncionario> = {}): NovoFuncionario => ({
  matricula: '1042',
  nome: 'João Pereira',
  cpf: '529.982.247-25',
  setorId: producao,
  funcaoId: operador,
  admissao: '2024-03-01',
  ...extra,
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  funcionarios = new FuncionariosService(banco.db);
  estrutura = new EstruturaService(banco.db);
  producao = (await estrutura.criarSetor(empresaA, { nome: 'Produção' })).id;
  operador = (
    await estrutura.criarFuncao(empresaA, {
      nome: 'Operador de prensa',
      cbo: '7842-05',
    })
  ).id;
});
afterAll(() => banco.encerrar());

describe('setores e funções', () => {
  it('nome único na empresa; CBO sem formatação', async () => {
    expect(
      (await recusa(estrutura.criarSetor(empresaA, { nome: 'Produção' })))
        .detalhes,
    ).toEqual([
      { campo: 'nome', mensagem: 'Já existe um setor com este nome.' },
    ]);
    await estrutura.criarSetor(empresaB, { nome: 'Produção' });
    expect((await estrutura.listarFuncoes(empresaA, {}))[0]).toMatchObject({
      nome: 'Operador de prensa',
      cbo: '784205',
    });
  });

  it('setor com funcionário ativo não se inativa; inativo sai da escolha', async () => {
    const exp = await estrutura.criarSetor(empresaA, { nome: 'Expedição' });
    const f = await funcionarios.criar(
      empresaA,
      joao({ matricula: '2001', cpf: '111.444.777-35', setorId: exp.id }),
    );
    const setor = (await estrutura.listarSetores(empresaA, {})).find(
      (s) => s.id === exp.id,
    )!;
    expect(setor.funcionariosAtivos).toBe(1);
    expect(
      (
        await recusa(
          estrutura.mudarSituacaoDoSetor(empresaA, {
            id: exp.id,
            alteracoes: { versao: setor.versao, ativo: false },
          }),
        )
      ).mensagem,
    ).toBe(
      '1 funcionário ativo está neste setor. Mude de setor antes de inativá-lo.',
    );
    await funcionarios.desligar(empresaA, {
      id: f.id,
      alteracoes: { versao: f.versao, data: hoje },
    });
    const inativo = await estrutura.mudarSituacaoDoSetor(empresaA, {
      id: exp.id,
      alteracoes: { versao: setor.versao, ativo: false },
    });
    expect(inativo.ativo).toBe(false);
    expect(
      (await estrutura.listarSetores(empresaA, {})).map((s) => s.id),
    ).not.toContain(exp.id);
    const r = await recusa(
      funcionarios.criar(
        empresaA,
        joao({ matricula: '2002', cpf: '390.533.447-05', setorId: exp.id }),
      ),
    );
    expect(r.detalhes).toEqual([
      { campo: 'setorId', mensagem: 'Setor não encontrado ou inativo.' },
    ]);
  });
});

describe('funcionários', () => {
  it('CPF validado e guardado só com dígitos; matrícula e CPF únicos na empresa', async () => {
    expect(
      (
        await recusa(
          funcionarios.criar(empresaA, joao({ cpf: '529.982.247-26' })),
        )
      ).detalhes,
    ).toEqual([
      { campo: 'cpf', mensagem: 'CPF inválido: confira os dígitos.' },
    ]);
    const f = await funcionarios.criar(empresaA, joao());
    expect(f).toMatchObject({
      cpf: '52998224725',
      setorNome: 'Produção',
      funcaoNome: 'Operador de prensa',
      ativo: true,
    });
    expect(
      (
        await recusa(
          funcionarios.criar(empresaA, joao({ cpf: '868.536.150-85' })),
        )
      ).detalhes,
    ).toEqual([
      {
        campo: 'matricula',
        mensagem: 'Já existe um funcionário com esta matrícula.',
      },
    ]);
    expect(
      (await recusa(funcionarios.criar(empresaA, joao({ matricula: '9999' }))))
        .detalhes,
    ).toEqual([
      { campo: 'cpf', mensagem: 'Já existe um funcionário com este CPF.' },
    ]);
  });

  it('desligar com data e motivo; desligado não se altera; readmitir volta com a mesma matrícula', async () => {
    let f = await funcionarios.criar(
      empresaA,
      joao({ matricula: '3001', cpf: '246.813.578-47' }),
    );
    expect(
      (
        await recusa(
          funcionarios.desligar(empresaA, {
            id: f.id,
            alteracoes: { versao: f.versao, data: '2024-01-01' },
          }),
        )
      ).detalhes?.[0]?.mensagem,
    ).toBe('O desligamento não pode ser anterior à admissão.');
    expect(
      (
        await recusa(
          funcionarios.desligar(empresaA, {
            id: f.id,
            alteracoes: { versao: f.versao, data: somarDias(hoje, 1) },
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('data');
    f = await funcionarios.desligar(empresaA, {
      id: f.id,
      alteracoes: {
        versao: f.versao,
        data: hoje,
        motivo: 'Pedido de demissão.',
      },
    });
    expect(f).toMatchObject({
      ativo: false,
      desligamento: hoje,
      motivoDesligamento: 'Pedido de demissão.',
    });
    expect(
      (
        await recusa(
          funcionarios.atualizar(empresaA, {
            id: f.id,
            alteracoes: {
              ...joao({ matricula: '3001', cpf: '246.813.578-47' }),
              versao: f.versao,
            },
          }),
        )
      ).mensagem,
    ).toBe('Funcionário desligado não é alterado. Readmita-o antes.');
    expect(
      (await funcionarios.listar(empresaA, { busca: '3001' })).itens,
    ).toHaveLength(0);
    expect(
      (
        await funcionarios.listar(empresaA, {
          busca: '3001',
          situacao: 'desligados',
        })
      ).itens,
    ).toHaveLength(1);
    f = await funcionarios.readmitir(empresaA, {
      id: f.id,
      alteracoes: { versao: f.versao },
    });
    expect(f).toMatchObject({
      ativo: true,
      matricula: '3001',
      desligamento: null,
    });
  });

  it('busca por nome, matrícula e CPF com ou sem pontuação; outra empresa não enxerga', async () => {
    const f = await funcionarios.criar(
      empresaA,
      joao({ matricula: '4001', nome: 'Ana Prado', cpf: '853.513.468-93' }),
    );
    expect(
      (await funcionarios.listar(empresaA, { busca: 'prado' })).itens.map(
        (x) => x.id,
      ),
    ).toEqual([f.id]);
    expect(
      (await funcionarios.listar(empresaA, { busca: '853.513' })).itens.map(
        (x) => x.id,
      ),
    ).toEqual([f.id]);
    expect(
      (await recusa(funcionarios.obter(empresaB, { id: f.id }))).codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});
