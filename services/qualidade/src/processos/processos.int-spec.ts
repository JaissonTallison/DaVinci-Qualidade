import { ErroDeNegocio, hojeEmBrasilia, somarMeses } from '@davinci/shared';
import { uuidv7, type Contexto, type ErroPadrao } from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { ProcessosService } from './processos.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let processos: ProcessosService;
const empresaId = uuidv7();
const ana: Contexto = { empresaId, usuarioId: uuidv7(), rastreioId: uuidv7() };
const diretor: Contexto = {
  empresaId,
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
  usuarioNome: 'Diretor',
};
const hoje = hojeEmBrasilia();

async function recusa(p: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  processos = new ProcessosService(banco.db);
});
afterAll(() => banco.encerrar());

describe('Modelagem de processos', () => {
  it('elaboração → revisão → aprovação (segregação) → publicação → nova revisão → obsoleto', async () => {
    const proc = await processos.criar(ana, {
      codigo: 'PR-REC-001',
      nome: 'Recebimento de matéria-prima',
      elaboradoPor: 'Ana',
      departamento: 'Logística',
    });
    expect(proc).toMatchObject({ status: 'em_elaboracao', revisaoAtual: 0 });

    const emRevisao = await processos.enviarRevisao(ana, {
      id: proc.id,
      alteracoes: { versao: proc.versao },
    });
    expect(emRevisao.status).toBe('em_revisao');

    // quem elaborou não aprova a própria revisão
    expect(
      (
        await recusa(
          processos.aprovar(ana, {
            id: proc.id,
            alteracoes: { versao: emRevisao.versao },
          }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');

    const aprovado = await processos.aprovar(diretor, {
      id: proc.id,
      alteracoes: {
        versao: emRevisao.versao,
        dataProximaRevisao: somarMeses(hoje, 12),
      },
    });
    expect(aprovado).toMatchObject({ status: 'aprovado', revisaoAtual: 1 });
    expect(aprovado.revisoes[0]).toMatchObject({
      revisao: 1,
      oQueMudou: 'Emissão inicial',
      aprovadoPorNome: 'Diretor',
    });

    const publicado = await processos.publicar(diretor, {
      id: proc.id,
      alteracoes: { versao: aprovado.versao },
    });
    expect(publicado.status).toBe('publicado');
    expect(publicado.publicadoEm).not.toBeNull();

    const rev2 = await processos.novaRevisao(ana, {
      id: proc.id,
      alteracoes: {
        versao: publicado.versao,
        oQueMudou: 'Inclui etapa de segregação de material reprovado',
      },
    });
    expect(rev2).toMatchObject({ status: 'em_elaboracao', revisaoAtual: 1 });

    const emRevisao2 = await processos.enviarRevisao(ana, {
      id: proc.id,
      alteracoes: { versao: rev2.versao },
    });
    const aprovado2 = await processos.aprovar(diretor, {
      id: proc.id,
      alteracoes: { versao: emRevisao2.versao },
    });
    expect(aprovado2).toMatchObject({ status: 'aprovado', revisaoAtual: 2 });
    expect(aprovado2.revisoes.map((r) => r.revisao)).toEqual([2, 1]);

    const obsoleto = await processos.encerrar(diretor, {
      id: proc.id,
      alteracoes: { versao: aprovado2.versao, motivo: 'Processo substituído' },
    });
    expect(obsoleto.status).toBe('obsoleto');

    expect(await processos.listar(ana, { status: 'publicado' })).toEqual([]);
    expect(await processos.listar(ana, {})).toHaveLength(1);
  });

  it('cancelar encerra um processo ainda em elaboração', async () => {
    const proc = await processos.criar(ana, {
      codigo: 'PR-TMP-002',
      nome: 'Rascunho descartável',
      elaboradoPor: 'Ana',
    });
    const cancelado = await processos.cancelar(diretor, {
      id: proc.id,
      alteracoes: { versao: proc.versao, motivo: 'Duplicado' },
    });
    expect(cancelado.status).toBe('cancelado');
  });

  it('salva o diagrama só com o processo editável', async () => {
    const proc = await processos.criar(ana, {
      codigo: 'PR-DIAG-003',
      nome: 'Processo com diagrama',
      elaboradoPor: 'Ana',
    });
    const diagrama = {
      nodes: [
        {
          id: 'n1',
          type: 'no',
          position: { x: 0, y: 0 },
          data: {
            forma: 'processo',
            categoria: 'processo',
            rotulo: 'Processo',
            nome: 'Receber material',
          },
        },
      ],
      edges: [],
    };
    const comDiagrama = await processos.salvarDiagrama(ana, {
      id: proc.id,
      alteracoes: { versao: proc.versao, conteudo: diagrama },
    });
    expect(comDiagrama.conteudo?.nodes).toHaveLength(1);

    const emRev = await processos.enviarRevisao(ana, {
      id: proc.id,
      alteracoes: { versao: comDiagrama.versao },
    });
    const aprov = await processos.aprovar(diretor, {
      id: proc.id,
      alteracoes: { versao: emRev.versao },
    });
    const publicado = await processos.publicar(diretor, {
      id: proc.id,
      alteracoes: { versao: aprov.versao },
    });
    // publicado não deixa editar o diagrama
    expect(
      (
        await recusa(
          processos.salvarDiagrama(ana, {
            id: proc.id,
            alteracoes: { versao: publicado.versao, conteudo: diagrama },
          }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
  });

  it('vincula e desvincula um registro de outro módulo', async () => {
    const proc = await processos.criar(ana, {
      codigo: 'PR-VINC-004',
      nome: 'Processo com vínculo',
      elaboradoPor: 'Ana',
    });
    const registroId = uuidv7();
    const comVinculo = await processos.adicionarVinculo(ana, {
      id: proc.id,
      alteracoes: {
        tipo: 'nao_conformidade',
        registroId,
        rotulo: 'NC-2026-010 · Teste',
      },
    });
    expect(comVinculo.vinculos).toHaveLength(1);
    expect(comVinculo.vinculos[0]).toMatchObject({
      tipo: 'nao_conformidade',
      registroId,
    });

    // o mesmo registro não duplica
    const denovo = await processos.adicionarVinculo(ana, {
      id: proc.id,
      alteracoes: {
        tipo: 'nao_conformidade',
        registroId,
        rotulo: 'NC-2026-010 · Teste',
      },
    });
    expect(denovo.vinculos).toHaveLength(1);

    const sem = await processos.removerVinculo(ana, {
      id: proc.id,
      alteracoes: { vinculoId: comVinculo.vinculos[0]!.id },
    });
    expect(sem.vinculos).toHaveLength(0);
  });

  it('registra a trilha de ações da governança', async () => {
    const proc = await processos.criar(ana, {
      codigo: 'PR-LOG-005',
      nome: 'Processo com trilha',
      elaboradoPor: 'Ana',
    });
    const emRev = await processos.enviarRevisao(ana, {
      id: proc.id,
      alteracoes: { versao: proc.versao },
    });
    await processos.aprovar(diretor, {
      id: proc.id,
      alteracoes: { versao: emRev.versao, parecer: 'Revisado e aprovado.' },
    });
    const completo = await processos.obter(ana, { id: proc.id });
    const acoes = completo.eventos.map((e) => e.acao);
    expect(acoes).toContain('criado');
    expect(acoes).toContain('enviado_revisao');
    expect(acoes).toContain('aprovado');
    const aprovado = completo.eventos.find((e) => e.acao === 'aprovado');
    expect(aprovado?.comentario).toBe('Revisado e aprovado.');
    expect(aprovado?.usuarioNome).toBe('Diretor');
  });
});
