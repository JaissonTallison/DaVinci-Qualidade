import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  somarMeses,
} from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type RegistrarAso,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { EstruturaService } from '../funcionarios/estrutura.service.js';
import { FuncionariosService } from '../funcionarios/funcionarios.service.js';
import { ExamesETreinamentosService } from './exames-e-treinamentos.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: ExamesETreinamentosService;
let funcionarios: FuncionariosService;

const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();
let joao: string;
let ana: string;
let carlos: string;

async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

const aso = (extra: Partial<RegistrarAso>): RegistrarAso => ({
  funcionarioId: joao,
  tipo: 'periodico',
  data: hoje,
  resultado: 'apto',
  proximoExame: somarMeses(hoje, 12),
  ...extra,
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new ExamesETreinamentosService(banco.db);
  funcionarios = new FuncionariosService(banco.db);
  const estrutura = new EstruturaService(banco.db);
  const setorId = (await estrutura.criarSetor(ctx, { nome: 'Produção' })).id;
  const funcaoId = (await estrutura.criarFuncao(ctx, { nome: 'Operador' })).id;
  const base = { setorId, funcaoId, admissao: '2024-03-01' };
  joao = (
    await funcionarios.criar(ctx, {
      ...base,
      matricula: '1',
      nome: 'João Pereira',
      cpf: '529.982.247-25',
    })
  ).id;
  ana = (
    await funcionarios.criar(ctx, {
      ...base,
      matricula: '2',
      nome: 'Ana Prado',
      cpf: '111.444.777-35',
    })
  ).id;
  const c = await funcionarios.criar(ctx, {
    ...base,
    matricula: '3',
    nome: 'Carlos Lima',
    cpf: '390.533.447-05',
  });
  carlos = (
    await funcionarios.desligar(ctx, {
      id: c.id,
      alteracoes: { versao: c.versao, data: hoje },
    })
  ).id;
});
afterAll(() => banco.encerrar());

describe('ASO', () => {
  it('exige o próximo exame (menos no demissional); desligado só faz demissional', async () => {
    expect(
      (
        await recusa(
          servico.registrarAso(ctx, aso({ proximoExame: undefined })),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('proximoExame');
    expect(
      (await recusa(servico.registrarAso(ctx, aso({ funcionarioId: carlos }))))
        .detalhes?.[0]?.mensagem,
    ).toBe('Carlos Lima está desligado: registre só o exame demissional.');
    const d = await servico.registrarAso(
      ctx,
      aso({
        funcionarioId: carlos,
        tipo: 'demissional',
        proximoExame: undefined,
      }),
    );
    expect(d.proximoExame).toBeNull();
  });

  it('vale o mais recente: o antigo vencido sai dos vencimentos quando chega o novo', async () => {
    await servico.registrarAso(
      ctx,
      aso({ data: somarMeses(hoje, -13), proximoExame: somarMeses(hoje, -1) }),
    );
    expect(
      (await servico.vencimentos(ctx, { tipo: 'aso' })).map((v) => [
        v.funcionarioNome,
        v.situacao,
      ]),
    ).toEqual([['João Pereira', 'vencido']]);
    expect(await servico.resumo(ctx)).toMatchObject({
      vencidos: 1,
      vencemEmBreve: 0,
      semAso: 1,
    });
    const novo = await servico.registrarAso(
      ctx,
      aso({ proximoExame: somarDias(hoje, 20) }),
    );
    expect(
      (await servico.vencimentos(ctx, { tipo: 'aso' })).map((v) => v.situacao),
    ).toEqual(['vence_em_breve']);
    await servico.anularAso(ctx, {
      id: novo.id,
      alteracoes: { motivo: 'Lançado na pessoa errada.' },
    });
    expect(
      (await servico.vencimentos(ctx, { tipo: 'aso' })).map((v) => v.situacao),
    ).toEqual(['vencido']);
    expect(
      (await servico.listarAsos(ctx, { funcionarioId: joao }))[0]
        ?.motivoAnulacao,
    ).toBe('Lançado na pessoa errada.');
  });
});

describe('treinamentos', () => {
  it('turma grava todos com a validade do catálogo; desligado barra a turma inteira', async () => {
    const nr35 = await servico.criarTreinamento(ctx, {
      nome: 'Trabalho em altura',
      norma: 'NR-35',
      cargaHoraria: 8,
      validadeMeses: 24,
    });
    expect(
      (
        await recusa(
          servico.criarTreinamento(ctx, {
            nome: 'Trabalho em altura',
            cargaHoraria: 8,
          }),
        )
      ).codigo,
    ).toBe('CONFLITO');
    const r = await recusa(
      servico.registrarTurma(ctx, {
        treinamentoId: nr35.id,
        funcionarioIds: [joao, carlos],
        data: hoje,
      }),
    );
    expect(r.detalhes?.[0]?.mensagem).toBe(
      'Desligado não entra em turma: Carlos Lima.',
    );
    expect(await servico.realizados(ctx, { funcionarioId: joao })).toEqual([]);
    const turma = await servico.registrarTurma(ctx, {
      treinamentoId: nr35.id,
      funcionarioIds: [joao, ana],
      data: somarMeses(hoje, -22),
      instrutor: 'Marcos Reis',
    });
    expect(turma.map((t) => t.validade)).toEqual([
      somarMeses(hoje, 2),
      somarMeses(hoje, 2),
    ]);
    const v = await servico.vencimentos(ctx, { tipo: 'treinamento' });
    expect(v.map((x) => [x.funcionarioNome, x.descricao, x.situacao])).toEqual([
      ['Ana Prado', 'Trabalho em altura', 'em_dia'],
      ['João Pereira', 'Trabalho em altura', 'em_dia'],
    ]);
  });
});
