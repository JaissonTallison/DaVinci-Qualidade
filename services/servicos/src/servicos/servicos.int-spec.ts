import { of, throwError, type Observable } from 'rxjs';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  somarMeses,
} from '@davinci/shared';
import { uuidv7, type Contexto, type ErroPadrao } from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { ServicosService } from './servicos.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: ServicosService;
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
const fornecedor = {
  id: uuidv7(),
  nome: 'Aços Paraná S.A.',
  nomeFantasia: null,
  papeis: ['fornecedor'],
  ativo: true,
};

/** Codex falso: responde pelo cadastro abaixo e recusa o resto com NAO_ENCONTRADO. */
const codex = {
  send<R>(_padrao: string, mensagem: unknown): Observable<R> {
    const id = (mensagem as { dados: { id: string } }).dados.id;
    const p = [cliente, fornecedor].find((x) => x.id === id);
    return (
      p
        ? of(p)
        : throwError(() => ({
            codigo: 'NAO_ENCONTRADO',
            mensagem: 'Parceiro não encontrado.',
          }))
    ) as Observable<R>;
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
  s = new ServicosService(banco.db, codex);
});
afterAll(() => banco.encerrar());

describe('Serviços', () => {
  it('OS: cliente tem de ter o papel; ciclo aberta → execução → concluída → avaliada uma vez', async () => {
    const base = {
      titulo: 'Calibração de 12 paquímetros',
      descricao: 'Calibrar e emitir certificado de 12 paquímetros.',
      responsavel: 'Laboratório',
      prazo: somarDias(hoje, -1),
    };
    expect(
      (await recusa(s.criarOs(ctx, { ...base, clienteId: fornecedor.id })))
        .detalhes?.[0]?.mensagem,
    ).toBe('Aços Paraná S.A. não está cadastrado como cliente.');
    let o = await s.criarOs(ctx, { ...base, clienteId: cliente.id });
    expect(o).toMatchObject({
      numero: expect.stringMatching(/^OS-\d{4}-001$/),
      clienteNome: 'Metalúrgica Sul',
      atrasada: true,
    });
    expect(
      (
        await recusa(
          s.concluirOs(ctx, {
            id: o.id,
            alteracoes: { versao: o.versao, relatorio: 'Feito sem iniciar.' },
          }),
        )
      ).mensagem,
    ).toContain('inicie antes');
    o = await s.iniciarOs(ctx, { id: o.id, alteracoes: { versao: o.versao } });
    o = await s.concluirOs(ctx, {
      id: o.id,
      alteracoes: {
        versao: o.versao,
        relatorio: 'Calibrados e certificados emitidos.',
      },
    });
    o = await s.avaliarOs(ctx, {
      id: o.id,
      alteracoes: { versao: o.versao, nota: 5 },
    });
    expect(
      (
        await recusa(
          s.avaliarOs(ctx, {
            id: o.id,
            alteracoes: { versao: o.versao, nota: 1 },
          }),
        )
      ).mensagem,
    ).toBe('Esta OS já foi avaliada.');
  });

  it('NPS = % promotores − % detratores', async () => {
    for (const nota of [10, 9, 8, 3])
      await s.registrarNps(ctx, { clienteId: cliente.id, data: hoje, nota });
    const r = await s.listarNps(ctx, {});
    expect(r).toMatchObject({
      promotores: 2,
      neutros: 1,
      detratores: 1,
      nps: 25,
    });
  });

  it('fornecedor: média define a classificação e a próxima avaliação; vale a mais recente', async () => {
    const notas = { qualidade: 2, prazo: 3, atendimento: 3, documentacao: 2 };
    const ruim = await s.avaliarFornecedor(ctx, {
      fornecedorId: fornecedor.id,
      data: somarMeses(hoje, -4),
      ...notas,
    });
    expect(ruim).toMatchObject({
      media: 2.5,
      classificacao: 'reprovado',
      proximaAvaliacao: somarMeses(hoje, -1),
    });
    expect(await s.resumo(ctx)).toMatchObject({
      fornecedoresReprovados: 1,
      avaliacoesVencidas: 1,
      nps12Meses: 25,
    });
    await s.avaliarFornecedor(ctx, {
      fornecedorId: fornecedor.id,
      data: hoje,
      qualidade: 5,
      prazo: 4,
      atendimento: 4,
      documentacao: 4,
    });
    const lista = await s.listarAvaliacoes(ctx);
    expect(lista.map((a) => [a.classificacao, a.vigente])).toEqual([
      ['aprovado', true],
      ['reprovado', false],
    ]);
    expect((await s.resumo(ctx)).fornecedoresReprovados).toBe(0);
  });
});
