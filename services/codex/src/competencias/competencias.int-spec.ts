import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  somarMeses,
} from '@davinci/shared';
import { uuidv7, type Contexto, type ErroPadrao } from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { ExamesETreinamentosService } from '../exames-e-treinamentos/exames-e-treinamentos.service.js';
import { EstruturaService } from '../funcionarios/estrutura.service.js';
import { FuncionariosService } from '../funcionarios/funcionarios.service.js';
import {
  CompetenciasService,
  situacaoDoRegistro,
} from './competencias.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: CompetenciasService;
let exames: ExamesETreinamentosService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();
let funcaoId: string;
let joao: string;
let ana: string;
let nr35: string;
let integracao: string;

async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  s = new CompetenciasService(banco.db);
  exames = new ExamesETreinamentosService(banco.db);
  const estrutura = new EstruturaService(banco.db);
  const pessoas = new FuncionariosService(banco.db);
  const setorId = (await estrutura.criarSetor(ctx, { nome: 'Manutenção' })).id;
  funcaoId = (await estrutura.criarFuncao(ctx, { nome: 'Eletricista' })).id;
  const base = { setorId, funcaoId, admissao: '2024-03-01' };
  joao = (
    await pessoas.criar(ctx, {
      ...base,
      matricula: '10',
      nome: 'João Pereira',
      cpf: '529.982.247-25',
    })
  ).id;
  ana = (
    await pessoas.criar(ctx, {
      ...base,
      matricula: '11',
      nome: 'Ana Prado',
      cpf: '111.444.777-35',
    })
  ).id;
  nr35 = (
    await exames.criarTreinamento(ctx, {
      nome: 'Trabalho em altura',
      norma: 'NR-35',
      cargaHoraria: 8,
      validadeMeses: 24,
    })
  ).id;
  integracao = (
    await exames.criarTreinamento(ctx, { nome: 'Integração', cargaHoraria: 4 })
  ).id;
});
afterAll(() => banco.encerrar());

describe('Situação de um requisito', () => {
  it('sem registro é ausente; sem validade, em dia; com validade, pela data', () => {
    expect(situacaoDoRegistro(undefined, hoje)).toBe('ausente');
    expect(situacaoDoRegistro({ validade: null }, hoje)).toBe('em_dia');
    expect(situacaoDoRegistro({ validade: somarDias(hoje, -1) }, hoje)).toBe(
      'vencido',
    );
    expect(situacaoDoRegistro({ validade: somarDias(hoje, 10) }, hoje)).toBe(
      'vence_em_breve',
    );
  });
});

describe('Competências por função (treinamentos e ASO)', () => {
  it('a função exige o ASO sempre e os treinamentos definidos', async () => {
    let r = await s.treinamentosDaFuncao(ctx, { funcaoId });
    expect(r.map((x) => x.tipo)).toEqual(['aso']);
    r = await s.definirTreinamentos(ctx, {
      funcaoId,
      treinamentoIds: [nr35, integracao, nr35],
    });
    expect(r.map((x) => x.nome)).toEqual([
      'ASO periódico em dia',
      'Integração',
      'Trabalho em altura',
    ]);
    r = await s.definirTreinamentos(ctx, { funcaoId, treinamentoIds: [nr35] });
    expect(r).toHaveLength(2);
  });

  it('recusa treinamento de outra empresa e função inexistente', async () => {
    const outra = { ...ctx, empresaId: uuidv7() };
    expect(
      (
        await recusa(
          s.definirTreinamentos(outra, { funcaoId, treinamentoIds: [] }),
        )
      ).codigo,
    ).toBe('NAO_ENCONTRADO');
    expect(
      (
        await recusa(
          s.definirTreinamentos(ctx, { funcaoId, treinamentoIds: [uuidv7()] }),
        )
      ).codigo,
    ).toBe('DADOS_INVALIDOS');
  });

  it('conformidade da pessoa e matriz da função', async () => {
    await s.definirTreinamentos(ctx, {
      funcaoId,
      treinamentoIds: [nr35, integracao],
    });
    await exames.registrarAso(ctx, {
      funcionarioId: joao,
      tipo: 'periodico',
      data: hoje,
      resultado: 'apto',
      proximoExame: somarMeses(hoje, 12),
    });
    await exames.registrarTurma(ctx, {
      treinamentoId: nr35,
      funcionarioIds: [joao],
      data: somarMeses(hoje, -25),
    });
    await exames.registrarTurma(ctx, {
      treinamentoId: integracao,
      funcionarioIds: [joao, ana],
      data: hoje,
    });

    const c = await s.conformidade(ctx, { funcionarioId: joao });
    const por = Object.fromEntries(
      c.requisitos.map((r) => [r.nome, r.situacao]),
    );
    expect(por).toEqual({
      'ASO periódico em dia': 'em_dia',
      Integração: 'em_dia',
      'Trabalho em altura': 'vencido',
    });
    expect(c.pendentes).toBe(1);

    const m = await s.matriz(ctx, { funcaoId });
    expect(m.linhas.map((l) => [l.nome, l.pendentes])).toEqual([
      ['Ana Prado', 2],
      ['João Pereira', 1],
    ]);
    expect(m.linhas[0]!.situacoes['aso:aso']).toBe('ausente');
    expect(m.linhas[0]!.situacoes[`treinamento:${integracao}`]).toBe('em_dia');
  });
});

describe('ASO para o eSocial e turmas', () => {
  it('ASO guarda exames e UF do CRM e sai com CPF e matrícula; turma lista os participantes', async () => {
    await exames.registrarAso(ctx, {
      funcionarioId: ana,
      tipo: 'admissional',
      data: '2024-02-20',
      resultado: 'apto',
      proximoExame: '2025-02-20',
      medico: 'Dra. Helena',
      crm: '1234',
      ufCrm: 'sp',
      exames: [{ data: '2024-02-19', procedimento: '0295' }],
    });
    const lista = await exames.asosParaEsocial(ctx, { desde: '2024-01-01' });
    const daAna = lista.find((a) => a.funcionarioId === ana)!;
    expect(daAna).toMatchObject({
      cpf: '11144477735',
      matricula: '11',
      ufCrm: 'SP',
      exames: [{ data: '2024-02-19', procedimento: '0295' }],
    });
    const turmas = await exames.turmas(ctx);
    const t = turmas.find((x) => x.treinamentoId === integracao)!;
    expect(t.participantes).toBe(2);
    const turma = await exames.turma(ctx, {
      treinamentoId: integracao,
      data: t.data,
    });
    expect(turma.participantes.map((p) => [p.nome, p.funcaoNome])).toEqual([
      ['Ana Prado', 'Eletricista'],
      ['João Pereira', 'Eletricista'],
    ]);
    expect(
      (
        await recusa(
          exames.turma(ctx, { treinamentoId: integracao, data: '2020-01-01' }),
        )
      ).codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});
