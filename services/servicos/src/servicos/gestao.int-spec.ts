import { of, throwError, type Observable } from 'rxjs';
import { ErroDeNegocio, hojeEmBrasilia, somarDias } from '@davinci/shared';
import {
  PATTERNS,
  uuidv7,
  type Contexto,
  type ErroPadrao,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { CatalogoService } from './catalogo.service.js';
import { ContratosService } from './contratos.service.js';
import { PesquisasService } from './pesquisas.service.js';
import { ReclamacoesService } from './reclamacoes.service.js';
import { ServicosService } from './servicos.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let os: ServicosService;
let catalogo: CatalogoService;
let contratos: ContratosService;
let reclamacoes: ReclamacoesService;
let pesquisas: PesquisasService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();
const cliente = {
  id: uuidv7(),
  nome: 'Metalúrgica Sul Ltda',
  nomeFantasia: 'Metalúrgica Sul',
  papeis: ['cliente'],
  ativo: true,
};
const outro = {
  id: uuidv7(),
  nome: 'Plásticos Norte',
  nomeFantasia: null,
  papeis: ['cliente'],
  ativo: true,
};

const codex = {
  send<R>(_p: string, m: unknown): Observable<R> {
    const id = (m as { dados: { id: string } }).dados.id;
    const p = [cliente, outro].find((x) => x.id === id);
    return (
      p
        ? of(p)
        : throwError(() => ({
            codigo: 'NAO_ENCONTRADO',
            mensagem: 'Não encontrado.',
          }))
    ) as Observable<R>;
  },
};
/** Qualidade falsa: devolve a NC criada e guarda o pedido. */
const qualidade = {
  pedidos: [] as { padrao: string; dados: Record<string, unknown> }[],
  send<R>(padrao: string, m: unknown): Observable<R> {
    const dados = (m as { dados: Record<string, unknown> }).dados;
    this.pedidos.push({ padrao, dados });
    return of({ id: uuidv7(), numero: 'NC-2026-050' }) as Observable<R>;
  },
};

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
  os = new ServicosService(banco.db, codex);
  catalogo = new CatalogoService(banco.db);
  contratos = new ContratosService(banco.db, os);
  reclamacoes = new ReclamacoesService(banco.db, os, qualidade);
  pesquisas = new PesquisasService(banco.db, os);
});
afterAll(() => banco.encerrar());

describe('Catálogo, contrato e execução da OS', () => {
  it('OS do contrato pega o prazo do SLA e o checklist do catálogo; concluir exige o checklist', async () => {
    const svc = await catalogo.criar(ctx, {
      nome: 'Manutenção preventiva de compressor',
      horasPadrao: 4,
      checklist: ['Trocar filtro de ar', 'Drenar condensado', 'Medir pressão'],
    });
    expect(
      (await recusa(catalogo.criar(ctx, { nome: svc.nome }))).detalhes?.[0]
        ?.campo,
    ).toBe('nome');

    const ct = await contratos.criar(ctx, {
      clienteId: cliente.id,
      objeto: 'Manutenção de compressores da planta 1',
      inicio: somarDias(hoje, -30),
      fim: somarDias(hoje, 40),
      prazoAtendimentoDias: 5,
      metaNoPrazo: 90,
    });
    expect(ct).toMatchObject({
      situacao: 'vence_em_breve',
      sla: { concluidas: 0, percentual: null },
    });
    expect(ct.numero).toMatch(/^CT-\d{4}-001$/);

    expect(
      (
        await recusa(
          os.criarOs(ctx, {
            clienteId: outro.id,
            titulo: 'Preventiva',
            descricao: 'Preventiva mensal compressor',
            responsavel: 'Carlos',
            contratoId: ct.id,
          }),
        )
      ).detalhes?.[0]?.mensagem,
    ).toBe('Contrato não encontrado para este cliente.');

    let o = await os.criarOs(ctx, {
      clienteId: cliente.id,
      titulo: 'Preventiva compressor 2',
      descricao: 'Preventiva mensal do compressor 2',
      responsavel: 'Carlos',
      contratoId: ct.id,
      servicoId: svc.id,
    });
    expect(o).toMatchObject({
      prazo: somarDias(hoje, 5),
      contratoNumero: ct.numero,
      servicoNome: svc.nome,
    });
    expect(o.checklist.map((p) => p.status)).toEqual([
      'pendente',
      'pendente',
      'pendente',
    ]);

    o = await os.iniciarOs(ctx, { id: o.id, alteracoes: { versao: o.versao } });
    expect(
      (
        await recusa(
          os.concluirOs(ctx, {
            id: o.id,
            alteracoes: {
              versao: o.versao,
              relatorio: 'Feito conforme o plano.',
            },
          }),
        )
      ).mensagem,
    ).toContain('Faltam 3 passo(s)');
    expect(
      (
        await recusa(
          os.registrarExecucao(ctx, {
            id: o.id,
            alteracoes: {
              versao: o.versao,
              apontamentos: [
                { data: somarDias(hoje, 1), tecnico: 'Carlos', horas: 2 },
              ],
            },
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('apontamentos.0.data');
    o = await os.registrarExecucao(ctx, {
      id: o.id,
      alteracoes: {
        versao: o.versao,
        checklist: [
          { item: 'Trocar filtro de ar', status: 'feito' },
          { item: 'Drenar condensado', status: 'feito' },
          {
            item: 'Medir pressão',
            status: 'nao_aplicavel',
            observacao: 'Manômetro em calibração',
          },
        ],
        apontamentos: [
          { data: hoje, tecnico: 'Carlos', horas: 2.5 },
          { data: hoje, tecnico: 'Rafa', horas: 1.5 },
        ],
        materiais: [{ descricao: 'Filtro de ar FA-20', quantidade: 1 }],
      },
    });
    expect(o.horasTotais).toBe(4);
    o = await os.concluirOs(ctx, {
      id: o.id,
      alteracoes: {
        versao: o.versao,
        relatorio: 'Preventiva feita, filtro trocado.',
        recebidoPor: 'João (manutenção)',
      },
    });
    expect(o).toMatchObject({
      status: 'concluida',
      noPrazo: true,
      recebidoPor: 'João (manutenção)',
    });

    const depois = await contratos.obter(ctx, { id: ct.id });
    expect(depois.sla).toEqual({
      concluidas: 1,
      noPrazo: 1,
      percentual: 100,
      atendeMeta: true,
    });
    const enc = await contratos.encerrar(ctx, {
      id: ct.id,
      alteracoes: { versao: depois.versao, motivo: 'Fim do escopo' },
    });
    expect(enc.situacao).toBe('encerrado');
    expect(
      (
        await recusa(
          os.criarOs(ctx, {
            clienteId: cliente.id,
            titulo: 'Corretiva urgente',
            descricao: 'Corretiva do compressor 3',
            responsavel: 'Carlos',
            contratoId: ct.id,
          }),
        )
      ).detalhes?.[0]?.mensagem,
    ).toContain('não está vigente');
  });
});

describe('Reclamações de clientes', () => {
  it('aberta → analisada (NC na Qualidade) → respondida → encerrada, com prazo e indicadores', async () => {
    let r = await reclamacoes.criar(ctx, {
      clienteId: cliente.id,
      canal: 'email',
      recebidaEm: somarDias(hoje, -10),
      descricao: 'Peças entregues com rebarba no furo central.',
      produto: 'Flange F-20',
    });
    expect(r).toMatchObject({
      prazoResposta: somarDias(hoje, -3),
      atrasada: true,
      status: 'aberta',
    });
    expect(
      (
        await recusa(
          reclamacoes.responder(ctx, {
            id: r.id,
            alteracoes: {
              versao: r.versao,
              resposta: 'Vamos trocar as peças.',
            },
          }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
    expect(
      (
        await recusa(
          reclamacoes.analisar(ctx, {
            id: r.id,
            alteracoes: {
              versao: r.versao,
              procedente: false,
              analise: 'Rebarba dentro do desenho',
              abrirNc: true,
              responsavelNc: 'Ana',
            },
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('responsavelNc');
    r = await reclamacoes.analisar(ctx, {
      id: r.id,
      alteracoes: {
        versao: r.versao,
        procedente: true,
        analise: 'Rebarba fora da tolerância em 30 peças do lote 220.',
        abrirNc: true,
        responsavelNc: 'Ana Souza',
        gravidadeNc: 'alta',
      },
    });
    expect(r).toMatchObject({
      status: 'analisada',
      procedente: true,
      ncNumero: 'NC-2026-050',
    });
    expect(qualidade.pedidos[0]).toMatchObject({
      padrao: PATTERNS.naoConformidades.criar,
      dados: {
        origem: 'reclamacao_cliente',
        origemRef: r.numero,
        tipo: 'produto',
        gravidade: 'alta',
        responsavel: 'Ana Souza',
      },
    });
    r = await reclamacoes.responder(ctx, {
      id: r.id,
      alteracoes: {
        versao: r.versao,
        resposta: 'Substituímos as 30 peças e revisamos a rebarbação.',
      },
    });
    expect(r).toMatchObject({
      status: 'respondida',
      atrasada: false,
      respondidaEm: hoje,
    });
    r = await reclamacoes.encerrar(ctx, {
      id: r.id,
      alteracoes: { versao: r.versao, clienteSatisfeito: true },
    });
    expect(r.status).toBe('encerrada');
    expect(await reclamacoes.resumo(ctx)).toEqual({
      abertas: 0,
      atrasadas: 0,
      procedentes: 100,
      tempoMedioResposta: 10,
      satisfacao: 100,
    });
  });
});

describe('Pesquisa por link', () => {
  it('responde uma vez, sem login; entra no NPS e avalia a OS concluída', async () => {
    let o = await os.criarOs(ctx, {
      clienteId: cliente.id,
      titulo: 'Calibração anual',
      descricao: 'Calibração anual dos instrumentos',
      responsavel: 'Lab',
      prazo: hoje,
    });
    o = await os.iniciarOs(ctx, { id: o.id, alteracoes: { versao: o.versao } });
    o = await os.concluirOs(ctx, {
      id: o.id,
      alteracoes: {
        versao: o.versao,
        relatorio: 'Calibrados 12 instrumentos.',
      },
    });
    const c = await pesquisas.criar(ctx, { clienteId: cliente.id, osId: o.id });
    expect(c.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await pesquisas.obterPublica({ token: c.token })).toEqual({
      clienteNome: 'Metalúrgica Sul',
      osNumero: o.numero,
      osTitulo: 'Calibração anual',
      situacao: 'aberta',
    });
    await pesquisas.responderPublica({
      token: c.token,
      nota: 9,
      notaOs: 5,
      comentario: 'Rápido e organizado.',
    });
    expect(
      (await recusa(pesquisas.responderPublica({ token: c.token, nota: 3 })))
        .mensagem,
    ).toContain('já foi respondida');
    expect((await os.obterOs(ctx, { id: o.id })).nota).toBe(5);
    const n = await os.listarNps(ctx, {});
    expect(
      n.respostas.find((x) => x.comentario === 'Rápido e organizado.')
        ?.categoria,
    ).toBe('promotor');
    expect(
      (await recusa(pesquisas.obterPublica({ token: 'x'.repeat(43) }))).codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});
