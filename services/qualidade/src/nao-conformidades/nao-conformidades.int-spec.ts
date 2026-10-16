import { eq } from 'drizzle-orm';
import { ErroDeNegocio } from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type NaoConformidade,
  type NovaNc,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { naoConformidades } from '../db/schema.js';
import { hojeEmBrasilia } from './regras.js';
import { NaoConformidadesService } from './nao-conformidades.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: NaoConformidadesService;

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
const ano = Number(hoje.slice(0, 4));
const daquiA = (dias: number) => {
  const d = new Date(`${hoje}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

const paquimetro: NovaNc = {
  titulo: 'Paquímetro fora de calibração na linha 2',
  descricao:
    'Na inspeção de recebimento o paquímetro TAG-0042 mediu 0,08 mm acima do padrão.',
  origem: 'inspecao',
  origemRef: 'INS-2026-031',
  tipo: 'processo',
  gravidade: 'alta',
  setor: 'Produção',
  responsavel: 'Marina Duarte',
  prazo: daquiA(30),
};

async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

const tratamento = (nc: NaoConformidade) => ({
  id: nc.id,
  alteracoes: {
    versao: nc.versao,
    metodoAnalise: 'cinco_porques',
    categoria6m: 'medicao',
    porques: ['O paquímetro mediu errado.', 'A calibração venceu em agosto.'],
    causaRaiz: 'Não havia alerta de vencimento das calibrações.',
    acaoCorretiva:
      'Calibrar o instrumento e cadastrar todos os instrumentos com frequência de calibração.',
  },
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new NaoConformidadesService(banco.db);
});
afterAll(() => banco.encerrar());

describe('abertura', () => {
  it('numera por empresa e por ano, sem repetir', async () => {
    const a1 = await servico.criar(empresaA, paquimetro);
    const a2 = await servico.criar(empresaA, {
      ...paquimetro,
      titulo: 'Segunda ocorrência no mesmo lote',
    });
    const b1 = await servico.criar(empresaB, paquimetro);
    expect([a1.numero, a2.numero, b1.numero]).toEqual([
      `NC-${ano}-001`,
      `NC-${ano}-002`,
      `NC-${ano}-001`,
    ]);
    expect(a1).toMatchObject({
      status: 'aberta',
      ciclos: 0,
      dataAbertura: hoje,
      vencida: false,
      porques: [],
    });
  });

  it('recusa prazo anterior à abertura e campos obrigatórios em branco', async () => {
    const r = await recusa(
      servico.criar(empresaA, { ...paquimetro, prazo: daquiA(-1) }),
    );
    expect(r.detalhes).toEqual([
      {
        campo: 'prazo',
        mensagem: 'O prazo não pode ser anterior à data de abertura.',
      },
    ]);
    const vazio = await recusa(
      servico.criar(empresaA, { ...paquimetro, titulo: '  ', responsavel: '' }),
    );
    expect(vazio.detalhes?.map((d) => d.campo).sort()).toEqual([
      'responsavel',
      'titulo',
    ]);
  });
});

describe('ciclo de vida', () => {
  it('ineficaz volta para tratamento com novo ciclo; eficaz encerra; encerrada não muda mais', async () => {
    let nc = await servico.criar(empresaA, paquimetro);

    // Não pula etapa
    const pulo = await recusa(
      servico.verificarEficacia(empresaA, {
        id: nc.id,
        alteracoes: {
          versao: nc.versao,
          eficaz: true,
          parecer: 'Medições conferidas por 30 dias.',
        },
      }),
    );
    expect(pulo).toMatchObject({ codigo: 'REGRA_DE_NEGOCIO' });

    nc = await servico.registrarTratamento(empresaA, tratamento(nc));
    expect(nc).toMatchObject({
      status: 'em_tratamento',
      ciclos: 1,
      metodoAnalise: 'cinco_porques',
      categoria6m: 'medicao',
    });

    nc = await servico.enviarParaVerificacao(empresaA, {
      id: nc.id,
      alteracoes: { versao: nc.versao, dataImplantacao: hoje },
    });
    expect(nc).toMatchObject({
      status: 'em_verificacao',
      dataImplantacao: hoje,
    });

    nc = await servico.verificarEficacia(empresaA, {
      id: nc.id,
      alteracoes: {
        versao: nc.versao,
        eficaz: false,
        parecer: 'O instrumento voltou a desviar em uma semana.',
      },
    });
    expect(nc).toMatchObject({
      status: 'em_tratamento',
      ciclos: 2,
      eficaz: false,
      dataImplantacao: null,
      verificadoPor: empresaA.usuarioId,
    });

    // Revisar a análise não conta outro ciclo
    const revisado = tratamento(nc);
    revisado.alteracoes.acaoCorretiva =
      'Substituir o paquímetro e incluir verificação diária com bloco-padrão.';
    nc = await servico.registrarTratamento(empresaA, revisado);
    expect(nc).toMatchObject({
      status: 'em_tratamento',
      ciclos: 2,
      acaoCorretiva: revisado.alteracoes.acaoCorretiva,
    });

    nc = await servico.enviarParaVerificacao(empresaA, {
      id: nc.id,
      alteracoes: { versao: nc.versao, dataImplantacao: hoje },
    });
    nc = await servico.verificarEficacia(empresaA, {
      id: nc.id,
      alteracoes: {
        versao: nc.versao,
        eficaz: true,
        parecer: 'Trinta dias sem desvio nas verificações diárias.',
      },
    });
    expect(nc).toMatchObject({ status: 'encerrada', eficaz: true, ciclos: 2 });
    expect(nc.encerradaEm).not.toBeNull();

    const fim = await recusa(
      servico.cancelar(empresaA, {
        id: nc.id,
        alteracoes: {
          versao: nc.versao,
          motivo: 'Tentativa de cancelar uma NC encerrada.',
        },
      }),
    );
    expect(fim.mensagem).toBe('Não é possível cancelar uma NC encerrada.');
  });

  it('implantação no futuro ou antes da abertura é recusada', async () => {
    let nc = await servico.criar(empresaA, paquimetro);
    nc = await servico.registrarTratamento(empresaA, tratamento(nc));
    const futuro = await recusa(
      servico.enviarParaVerificacao(empresaA, {
        id: nc.id,
        alteracoes: { versao: nc.versao, dataImplantacao: daquiA(1) },
      }),
    );
    expect(futuro.detalhes?.[0]?.campo).toBe('dataImplantacao');
    const antes = await recusa(
      servico.enviarParaVerificacao(empresaA, {
        id: nc.id,
        alteracoes: { versao: nc.versao, dataImplantacao: daquiA(-1) },
      }),
    );
    expect(antes.detalhes?.[0]?.mensagem).toBe(
      'A implantação não pode ser anterior à abertura da NC.',
    );
  });

  it('cancelar guarda motivo, autor e momento', async () => {
    const nc = await servico.criar(empresaA, paquimetro);
    const c = await servico.cancelar(empresaA, {
      id: nc.id,
      alteracoes: {
        versao: nc.versao,
        motivo: 'Aberta em duplicidade com a NC anterior.',
      },
    });
    expect(c).toMatchObject({
      status: 'cancelada',
      motivoCancelamento: 'Aberta em duplicidade com a NC anterior.',
    });
    expect(c.canceladaEm).not.toBeNull();
  });
});

describe('edição e acesso', () => {
  it('versão desatualizada é recusada: outra pessoa alterou antes', async () => {
    const nc = await servico.criar(empresaA, paquimetro);
    await servico.atualizar(empresaA, {
      id: nc.id,
      alteracoes: { ...paquimetro, setor: 'Expedição', versao: nc.versao },
    });
    const conflito = await recusa(
      servico.atualizar(empresaA, {
        id: nc.id,
        alteracoes: { ...paquimetro, setor: 'Qualidade', versao: nc.versao },
      }),
    );
    expect(conflito.codigo).toBe('CONFLITO');
  });

  it('uma empresa não enxerga nem altera a NC de outra', async () => {
    const nc = await servico.criar(empresaA, paquimetro);
    expect((await recusa(servico.obter(empresaB, { id: nc.id }))).codigo).toBe(
      'NAO_ENCONTRADO',
    );
    expect(
      (
        await recusa(
          servico.cancelar(empresaB, {
            id: nc.id,
            alteracoes: {
              versao: nc.versao,
              motivo: 'Tentativa de outra empresa.',
            },
          }),
        )
      ).codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});

describe('lista e resumo', () => {
  it('filtra vencidas, busca sem acento e resume o que está em aberto', async () => {
    const ctx: Contexto = {
      empresaId: uuidv7(),
      usuarioId: uuidv7(),
      rastreioId: uuidv7(),
    };
    const atrasada = await servico.criar(ctx, {
      ...paquimetro,
      titulo: 'Calibração atrasada do micrômetro',
      gravidade: 'critica',
    });
    await banco.db
      .update(naoConformidades)
      .set({ prazo: daquiA(-3) })
      .where(eq(naoConformidades.id, atrasada.id));
    const emDia = await servico.criar(ctx, {
      ...paquimetro,
      titulo: 'Etiqueta ilegível no lote 88',
      gravidade: 'baixa',
    });
    const cancelada = await servico.criar(ctx, {
      ...paquimetro,
      gravidade: 'alta',
    });
    await servico.cancelar(ctx, {
      id: cancelada.id,
      alteracoes: {
        versao: cancelada.versao,
        motivo: 'Registrada por engano no setor errado.',
      },
    });

    const vencidas = await servico.listar(ctx, { vencidas: 'true' });
    expect(vencidas.itens.map((n) => n.id)).toEqual([atrasada.id]);
    expect(vencidas.itens[0]!.vencida).toBe(true);

    const busca = await servico.listar(ctx, { busca: 'micrometro' });
    expect(busca.itens.map((n) => n.id)).toEqual([atrasada.id]);

    // Pendentes primeiro (prazo mais próximo), terminadas por último
    const todas = await servico.listar(ctx, {});
    expect(todas.itens.map((n) => n.id)).toEqual([
      atrasada.id,
      emDia.id,
      cancelada.id,
    ]);

    expect(await servico.resumo(ctx)).toEqual({
      abertas: 2,
      vencidas: 1,
      graves: 1,
    });
  });
});

describe('NCs por mês', () => {
  it('conta abertas pelo mês de abertura e encerradas pelo mês do encerramento; meses sem NC aparecem zerados', async () => {
    const ctx: Contexto = {
      empresaId: uuidv7(),
      usuarioId: uuidv7(),
      rastreioId: uuidv7(),
    };
    const meses = await servico.porMes(ctx, { meses: 3 });
    expect(meses).toHaveLength(3);
    expect(meses.every((m) => m.abertas === 0 && m.encerradas === 0)).toBe(
      true,
    );
    expect(meses[2]!.mes).toBe(hojeEmBrasilia().slice(0, 7));
  });
});
