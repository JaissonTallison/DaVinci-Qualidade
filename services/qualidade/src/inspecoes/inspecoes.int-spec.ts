import { of, throwError, type Observable } from 'rxjs';
import { ErroDeNegocio } from '@davinci/shared';
import {
  uuidv7,
  type Parceiro,
  type Contexto,
  type ErroPadrao,
  type Inspecao,
  type NovaInspecao,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { hojeEmBrasilia } from '../datas.js';
import { InspecoesService } from './inspecoes.service.js';
import { ModelosDeInspecaoService } from './modelos.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let inspecoes: InspecoesService;
let modelos: ModelosDeInspecaoService;

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

const recebimento = {
  nome: 'Recebimento de eixos usinados',
  tipo: 'recebimento' as const,
  itens: [
    { verificar: 'Diâmetro externo', criterio: '10,0 ± 0,1 mm' },
    { verificar: 'Acabamento superficial sem riscos' },
    { verificar: 'Certificado de qualidade do lote anexado' },
  ],
};
const nova = (extra: Partial<NovaInspecao> = {}): NovaInspecao => ({
  tipo: 'recebimento',
  objeto: 'Eixo usinado 10 mm',
  lote: 'L-2231',
  inspetor: 'Marina Duarte',
  data: hoje,
  ...extra,
});

/** Codex falso: um fornecedor ativo, um cliente e um inativo. */
const fornecedor = {
  id: uuidv7(),
  nome: 'Usinagem Paulista Ltda.',
  ativo: true,
  papeis: ['fornecedor'],
};
const cliente = {
  id: uuidv7(),
  nome: 'Metalúrgica Beta',
  ativo: true,
  papeis: ['cliente'],
};
const codex = {
  send<R>(_padrao: string, mensagem: unknown): Observable<R> {
    const id = (mensagem as { dados: { id: string } }).dados.id;
    const p = [fornecedor, cliente].find((x) => x.id === id) as
      Partial<Parceiro> | undefined;
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

async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

const responder = (
  i: Inspecao,
  respostas: [number, 'ok' | 'nok' | 'na' | null, string?][],
  extra: Record<string, unknown> = {},
) =>
  inspecoes.responder(empresaA, {
    id: i.id,
    alteracoes: {
      versao: i.versao,
      respostas: respostas.map(([ordem, resposta, observacao]) => ({
        itemId: i.itens[ordem]!.id,
        resposta,
        observacao,
      })),
      ...extra,
    },
  });

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  inspecoes = new InspecoesService(banco.db, codex);
  modelos = new ModelosDeInspecaoService(banco.db);
});
afterAll(() => banco.encerrar());

describe('modelos', () => {
  it('nome único por empresa; inativo não pode ser usado', async () => {
    const m = await modelos.criar(empresaA, recebimento);
    expect(m.itens[1]).toEqual({
      verificar: 'Acabamento superficial sem riscos',
      criterio: null,
    });
    expect(
      (await recusa(modelos.criar(empresaA, recebimento))).detalhes,
    ).toEqual([
      { campo: 'nome', mensagem: 'Já existe um modelo com este nome.' },
    ]);
    await modelos.criar(empresaB, recebimento); // outra empresa pode ter o mesmo nome

    const inativo = await modelos.inativar(empresaA, {
      id: m.id,
      alteracoes: { versao: m.versao },
    });
    expect((await modelos.listar(empresaA, {})).map((x) => x.id)).not.toContain(
      m.id,
    );
    const r = await recusa(inspecoes.criar(empresaA, nova({ modeloId: m.id })));
    expect(r.detalhes).toEqual([
      { campo: 'modeloId', mensagem: 'Modelo não encontrado ou inativo.' },
    ]);
    await modelos.reativar(empresaA, {
      id: m.id,
      alteracoes: { versao: inativo.versao },
    });
  });
});

describe('inspeção', () => {
  it('copia os itens do modelo: mudar o modelo depois não muda a inspeção', async () => {
    const m = await modelos.criar(empresaA, {
      ...recebimento,
      nome: 'Recebimento de buchas',
    });
    const i = await inspecoes.criar(empresaA, nova({ modeloId: m.id }));
    expect(i).toMatchObject({
      numero: expect.stringMatching(new RegExp(`^INS-${ano}-\\d{3}$`)),
      status: 'em_andamento',
      modeloNome: 'Recebimento de buchas',
      respondidos: 0,
    });
    expect(i.itens.map((x) => x.verificar)).toEqual([
      'Diâmetro externo',
      'Acabamento superficial sem riscos',
      'Certificado de qualidade do lote anexado',
    ]);

    await modelos.atualizar(empresaA, {
      id: m.id,
      alteracoes: {
        ...recebimento,
        nome: 'Recebimento de buchas v2',
        itens: [{ verificar: 'Item novo' }],
        versao: m.versao,
      },
    });
    const depois = await inspecoes.obter(empresaA, { id: i.id });
    expect(depois.itens).toHaveLength(3);
    expect(depois.modeloNome).toBe('Recebimento de buchas');
  });

  it('sem modelo exige itens; data no futuro é recusada', async () => {
    expect((await recusa(inspecoes.criar(empresaA, nova()))).detalhes).toEqual([
      {
        campo: 'itens',
        mensagem: 'Escolha um modelo ou inclua os itens a verificar.',
      },
    ]);
    const amanha = new Date(`${hoje}T12:00:00Z`);
    amanha.setUTCDate(amanha.getUTCDate() + 1);
    const r = await recusa(
      inspecoes.criar(
        empresaA,
        nova({
          itens: recebimento.itens,
          data: amanha.toISOString().slice(0, 10),
        }),
      ),
    );
    expect(r.detalhes?.[0]?.campo).toBe('data');
  });

  it('responde aos poucos; concluir exige tudo respondido e NOK descrito; um NOK reprova', async () => {
    let i = await inspecoes.criar(empresaA, nova({ itens: recebimento.itens }));
    i = await responder(
      i,
      [
        [0, 'ok'],
        [1, 'nok'],
      ],
      { observacoes: 'Lote recebido às 9h.' },
    );
    expect(i).toMatchObject({
      respondidos: 2,
      naoConformes: 1,
      observacoes: 'Lote recebido às 9h.',
    });

    // Responder outro item sem mandar as observações não as apaga
    i = await responder(i, [[2, 'na']]);
    expect(i.observacoes).toBe('Lote recebido às 9h.');

    const pendente = await recusa(
      inspecoes.concluir(empresaA, {
        id: i.id,
        alteracoes: { versao: i.versao },
      }),
    );
    expect(pendente.detalhes).toEqual([
      {
        campo: 'itens.1.observacao',
        mensagem: 'Descreva o que foi encontrado no item 2 (NOK).',
      },
    ]);

    i = await responder(i, [
      [1, 'nok', 'Riscos longitudinais em 4 de 20 peças.'],
    ]);
    i = await inspecoes.concluir(empresaA, {
      id: i.id,
      alteracoes: { versao: i.versao },
    });
    expect(i).toMatchObject({ status: 'reprovada', naoConformes: 1 });
    expect(i.concluidaEm).not.toBeNull();

    const fechada = await recusa(responder(i, [[1, 'ok']]));
    expect(fechada.mensagem).toBe(
      'A inspeção está reprovada: não aceita mais alterações.',
    );
  });

  it('sem NOK aprova; versão desatualizada e outra empresa são recusadas', async () => {
    let i = await inspecoes.criar(empresaA, nova({ itens: recebimento.itens }));
    const velha = i;
    i = await responder(i, [
      [0, 'ok'],
      [1, 'ok'],
      [2, 'na'],
    ]);
    expect((await recusa(responder(velha, [[0, 'nok', 'x']]))).codigo).toBe(
      'CONFLITO',
    );
    expect((await recusa(inspecoes.obter(empresaB, { id: i.id }))).codigo).toBe(
      'NAO_ENCONTRADO',
    );
    i = await inspecoes.concluir(empresaA, {
      id: i.id,
      alteracoes: { versao: i.versao },
    });
    expect(i.status).toBe('aprovada');
  });

  it('item de outra inspeção não entra', async () => {
    const a = await inspecoes.criar(
      empresaA,
      nova({ itens: recebimento.itens }),
    );
    const b = await inspecoes.criar(
      empresaA,
      nova({ itens: recebimento.itens }),
    );
    const r = await recusa(
      inspecoes.responder(empresaA, {
        id: a.id,
        alteracoes: {
          versao: a.versao,
          respostas: [{ itemId: b.itens[0]!.id, resposta: 'ok' }],
        },
      }),
    );
    expect(r.mensagem).toBe('Item não pertence a esta inspeção.');
  });

  it('resumo: em andamento, reprovadas e taxa de aprovação dos últimos 30 dias', async () => {
    const ctx: Contexto = {
      empresaId: uuidv7(),
      usuarioId: uuidv7(),
      rastreioId: uuidv7(),
    };
    const conclui = async (resposta: 'ok' | 'nok') => {
      const i = await inspecoes.criar(
        ctx,
        nova({ itens: [{ verificar: 'Dimensão' }] }),
      );
      const r = await inspecoes.responder(ctx, {
        id: i.id,
        alteracoes: {
          versao: i.versao,
          respostas: [
            {
              itemId: i.itens[0]!.id,
              resposta,
              observacao: 'Fora da tolerância.',
            },
          ],
        },
      });
      return inspecoes.concluir(ctx, {
        id: r.id,
        alteracoes: { versao: r.versao },
      });
    };
    await conclui('ok');
    await conclui('ok');
    await conclui('ok');
    await conclui('nok');
    await inspecoes.criar(ctx, nova({ itens: [{ verificar: 'Dimensão' }] }));
    expect(await inspecoes.resumo(ctx)).toEqual({
      emAndamento: 1,
      reprovadas30Dias: 1,
      taxaDeAprovacao30Dias: 75,
    });
  });
});

describe('amostragem (NBR 5426) e fornecedor', () => {
  it('com NQA, o plano sai do tamanho do lote e os defeituosos decidem', async () => {
    expect(
      (
        await recusa(
          inspecoes.criar(
            empresaA,
            nova({ itens: recebimento.itens, nqa: '2.5' }),
          ),
        )
      ).detalhes,
    ).toEqual([
      {
        campo: 'quantidade',
        mensagem: 'Com amostragem, informe o tamanho do lote.',
      },
    ]);

    let i = await inspecoes.criar(
      empresaA,
      nova({
        itens: recebimento.itens,
        nqa: '2.5',
        quantidade: 1000,
        fornecedorId: fornecedor.id,
      }),
    );
    expect(i.plano).toMatchObject({
      nivel: 'II',
      letra: 'J',
      amostra: 80,
      aceita: 5,
      rejeita: 6,
    });
    expect(i.fornecedorNome).toBe('Usinagem Paulista Ltda.');
    i = await responder(i, [
      [0, 'ok'],
      [1, 'nok', 'Riscos em 4 peças da amostra.'],
      [2, 'ok'],
    ]);
    const sem = await recusa(
      inspecoes.concluir(empresaA, {
        id: i.id,
        alteracoes: { versao: i.versao },
      }),
    );
    expect(sem.detalhes?.[0]).toEqual({
      campo: 'defeituosos',
      mensagem: 'Informe quantos defeituosos havia na amostra de 80.',
    });
    expect(
      (
        await recusa(
          inspecoes.concluir(empresaA, {
            id: i.id,
            alteracoes: { versao: i.versao, defeituosos: 81 },
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('defeituosos');
    // 4 defeituosos ≤ Ac 5: lote aceito, mesmo com item NOK
    i = await inspecoes.concluir(empresaA, {
      id: i.id,
      alteracoes: { versao: i.versao, defeituosos: 4 },
    });
    expect(i).toMatchObject({ status: 'aprovada', defeituosos: 4 });

    let r = await inspecoes.criar(
      empresaA,
      nova({
        itens: recebimento.itens,
        nqa: '2.5',
        quantidade: 1000,
        fornecedorId: fornecedor.id,
      }),
    );
    r = await responder(r, [
      [0, 'ok'],
      [1, 'nok', 'Riscos em 6 peças.'],
      [2, 'ok'],
    ]);
    r = await inspecoes.concluir(empresaA, {
      id: r.id,
      alteracoes: { versao: r.versao, defeituosos: 6 },
    });
    expect(r.status).toBe('reprovada');

    const rec = await inspecoes.recebimentoDoFornecedor(empresaA, {
      fornecedorId: fornecedor.id,
    });
    expect(rec).toMatchObject({
      inspecoes: 2,
      aprovadas: 1,
      reprovadas: 1,
      indiceDeAprovacao: 50,
    });
    expect(rec.ultimas).toHaveLength(2);
  });

  it('fornecedor precisa existir e ter o papel de fornecedor', async () => {
    expect(
      (
        await recusa(
          inspecoes.criar(
            empresaA,
            nova({ itens: recebimento.itens, fornecedorId: cliente.id }),
          ),
        )
      ).detalhes?.[0]?.mensagem,
    ).toBe('Metalúrgica Beta não está cadastrado como fornecedor.');
    expect(
      (
        await recusa(
          inspecoes.criar(
            empresaA,
            nova({ itens: recebimento.itens, fornecedorId: uuidv7() }),
          ),
        )
      ).detalhes?.[0]?.mensagem,
    ).toBe('Fornecedor não encontrado.');
  });
});
