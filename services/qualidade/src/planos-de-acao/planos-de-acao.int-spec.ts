import { eq } from 'drizzle-orm';
import { ErroDeNegocio } from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type NovoPlano,
  type PlanoDeAcao,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { planosAcaoTarefas } from '../db/schema.js';
import { hojeEmBrasilia } from '../datas.js';
import { NaoConformidadesService } from '../nao-conformidades/nao-conformidades.service.js';
import { PlanosDeAcaoService } from './planos-de-acao.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let planos: PlanosDeAcaoService;
let ncs: NaoConformidadesService;

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

const etiquetas: NovoPlano = {
  titulo: 'Rotina de limpeza das impressoras de etiqueta',
  objetivo: 'Nenhuma etiqueta ilegível na expedição por 60 dias seguidos.',
  tipo: 'corretiva',
  origem: 'nc',
  origemRef: 'NC-2026-002',
  responsavel: 'Carlos Menezes',
  tarefas: [
    {
      oQue: 'Incluir a limpeza do cabeçote no checklist de abertura',
      responsavel: 'Carlos Menezes',
      prazo: daquiA(5),
      onde: 'Expedição',
    },
    {
      oQue: 'Treinar os três operadores de expedição',
      responsavel: 'Ana Prado',
      prazo: daquiA(10),
      como: 'Treinamento prático de 30 minutos no posto',
    },
  ],
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

const acao = (p: PlanoDeAcao, alteracoes: Record<string, unknown>) => ({
  id: p.id,
  alteracoes: { versao: p.versao, ...alteracoes },
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  planos = new PlanosDeAcaoService(banco.db);
  ncs = new NaoConformidadesService(banco.db);
});
afterAll(() => banco.encerrar());

describe('criação', () => {
  it('numera, guarda as tarefas na ordem e calcula prazo e progresso', async () => {
    const p = await planos.criar(empresaA, etiquetas);
    expect(p).toMatchObject({
      numero: `PA-${ano}-001`,
      status: 'em_execucao',
      progresso: 0,
      prazo: daquiA(10),
      atrasado: false,
    });
    expect(p.tarefas.map((t) => [t.ordem, t.oQue, t.situacao])).toEqual([
      [0, 'Incluir a limpeza do cabeçote no checklist de abertura', 'pendente'],
      [1, 'Treinar os três operadores de expedição', 'pendente'],
    ]);
  });

  it('exige ao menos uma tarefa e prazo a partir de hoje', async () => {
    const vazio = await recusa(
      planos.criar(empresaA, { ...etiquetas, tarefas: [] }),
    );
    expect(vazio.detalhes).toEqual([
      { campo: 'tarefas', mensagem: 'Inclua ao menos uma tarefa.' },
    ]);
    const passado = await recusa(
      planos.criar(empresaA, {
        ...etiquetas,
        tarefas: [{ ...etiquetas.tarefas[0]!, prazo: daquiA(-1) }],
      }),
    );
    expect(passado.detalhes?.[0]?.campo).toBe('tarefas.0.prazo');
  });

  it('liga a uma NC da mesma empresa; NC de outra empresa é recusada', async () => {
    const nc = await ncs.criar(empresaA, {
      titulo: 'Etiqueta ilegível no lote 88',
      descricao: 'Três caixas saíram com a etiqueta borrada.',
      origem: 'reclamacao_cliente',
      tipo: 'produto',
      gravidade: 'media',
      responsavel: 'Carlos Menezes',
      prazo: daquiA(20),
    });
    const ligado = await planos.criar(empresaA, { ...etiquetas, ncId: nc.id });
    expect(ligado.ncId).toBe(nc.id);
    expect(
      (await planos.listar(empresaA, { ncId: nc.id })).itens.map((p) => p.id),
    ).toEqual([ligado.id]);
    const deOutra = await recusa(
      planos.criar(empresaB, { ...etiquetas, ncId: nc.id }),
    );
    expect(deOutra.detalhes?.[0]).toEqual({
      campo: 'ncId',
      mensagem: 'NC não encontrada.',
    });
  });
});

describe('ciclo pelas tarefas', () => {
  it('concluir tudo leva a aguardar eficácia; ineficaz volta para execução e pede tarefa nova; eficaz encerra', async () => {
    let p = await planos.criar(empresaA, etiquetas);
    const [t1, t2] = p.tarefas;

    // Eficácia só depois de tudo concluído
    expect(
      (
        await recusa(
          planos.verificarEficacia(
            empresaA,
            acao(p, { eficaz: true, parecer: 'Sem ocorrências no período.' }),
          ),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');

    p = await planos.concluirTarefa(empresaA, acao(p, { tarefaId: t1!.id }));
    expect(p).toMatchObject({ status: 'em_execucao', progresso: 50 });
    p = await planos.concluirTarefa(empresaA, acao(p, { tarefaId: t2!.id }));
    expect(p).toMatchObject({ status: 'aguardando_eficacia', progresso: 100 });

    // Reabrir devolve para execução; concluir de novo volta a aguardar
    p = await planos.reabrirTarefa(empresaA, acao(p, { tarefaId: t2!.id }));
    expect(p).toMatchObject({ status: 'em_execucao', progresso: 50 });
    p = await planos.concluirTarefa(empresaA, acao(p, { tarefaId: t2!.id }));

    p = await planos.verificarEficacia(
      empresaA,
      acao(p, {
        eficaz: false,
        parecer: 'Ainda saíram duas etiquetas borradas no turno da noite.',
      }),
    );
    expect(p).toMatchObject({
      status: 'em_execucao',
      eficaz: false,
      progresso: 100,
    });

    p = await planos.incluirTarefa(
      empresaA,
      acao(p, {
        tarefa: {
          oQue: 'Estender a rotina de limpeza ao turno da noite',
          responsavel: 'Ana Prado',
          prazo: daquiA(3),
        },
      }),
    );
    expect(p).toMatchObject({ status: 'em_execucao', progresso: 67 });
    p = await planos.concluirTarefa(
      empresaA,
      acao(p, { tarefaId: p.tarefas[2]!.id }),
    );
    p = await planos.verificarEficacia(
      empresaA,
      acao(p, {
        eficaz: true,
        parecer: 'Sessenta dias sem etiqueta ilegível nos dois turnos.',
      }),
    );
    expect(p).toMatchObject({ status: 'encerrado', eficaz: true });

    const fim = await recusa(
      planos.incluirTarefa(
        empresaA,
        acao(p, {
          tarefa: {
            oQue: 'Mais uma tarefa qualquer',
            responsavel: 'Ana Prado',
            prazo: daquiA(3),
          },
        }),
      ),
    );
    expect(fim.mensagem).toBe(
      'O plano está encerrado: não aceita mais alterações.',
    );
  });

  it('cancelar tarefa não conta no progresso; a última tarefa válida não se cancela', async () => {
    let p = await planos.criar(empresaA, etiquetas);
    p = await planos.cancelarTarefa(
      empresaA,
      acao(p, {
        tarefaId: p.tarefas[1]!.id,
        motivo: 'Operadores já treinados no mês passado.',
      }),
    );
    expect(p.tarefas[1]).toMatchObject({
      situacao: 'cancelada',
      motivoCancelamento: 'Operadores já treinados no mês passado.',
    });
    expect(p.prazo).toBe(daquiA(5));
    const ultima = await recusa(
      planos.cancelarTarefa(
        empresaA,
        acao(p, { tarefaId: p.tarefas[0]!.id, motivo: 'Sem motivo real.' }),
      ),
    );
    expect(ultima.mensagem).toContain('cancele o plano');
    p = await planos.concluirTarefa(
      empresaA,
      acao(p, { tarefaId: p.tarefas[0]!.id }),
    );
    expect(p).toMatchObject({ status: 'aguardando_eficacia', progresso: 100 });
  });

  it('versão desatualizada é recusada, mesmo mexendo em tarefas diferentes', async () => {
    const p = await planos.criar(empresaA, etiquetas);
    await planos.concluirTarefa(
      empresaA,
      acao(p, { tarefaId: p.tarefas[0]!.id }),
    );
    const conflito = await recusa(
      planos.concluirTarefa(empresaA, acao(p, { tarefaId: p.tarefas[1]!.id })),
    );
    expect(conflito.codigo).toBe('CONFLITO');
  });

  it('outra empresa não enxerga nem altera', async () => {
    const p = await planos.criar(empresaA, etiquetas);
    expect((await recusa(planos.obter(empresaB, { id: p.id }))).codigo).toBe(
      'NAO_ENCONTRADO',
    );
    expect(
      (
        await recusa(
          planos.cancelar(
            empresaB,
            acao(p, { motivo: 'Tentativa de outra empresa.' }),
          ),
        )
      ).codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});

describe('lista e resumo', () => {
  it('atrasado é plano com tarefa pendente vencida', async () => {
    const ctx: Contexto = {
      empresaId: uuidv7(),
      usuarioId: uuidv7(),
      rastreioId: uuidv7(),
    };
    const atrasado = await planos.criar(ctx, etiquetas);
    await banco.db
      .update(planosAcaoTarefas)
      .set({ prazo: daquiA(-2) })
      .where(eq(planosAcaoTarefas.id, atrasado.tarefas[0]!.id));
    const emDia = await planos.criar(ctx, {
      ...etiquetas,
      titulo: 'Revisar o procedimento de expedição',
    });

    const lista = await planos.listar(ctx, { atrasados: 'true' });
    expect(lista.itens.map((p) => p.id)).toEqual([atrasado.id]);
    expect(lista.itens[0]).toMatchObject({
      atrasado: true,
      tarefasPendentes: 2,
    });
    expect(
      (await planos.listar(ctx, { busca: 'procedimento' })).itens.map(
        (p) => p.id,
      ),
    ).toEqual([emDia.id]);
    expect(await planos.resumo(ctx)).toEqual({
      emExecucao: 2,
      aguardandoEficacia: 0,
      atrasados: 1,
    });
  });
});
