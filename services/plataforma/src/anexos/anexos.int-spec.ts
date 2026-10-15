import { ErroDeNegocio } from '@davinci/shared';
import {
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type NovoAnexo,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { AnexosService } from './anexos.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: AnexosService;

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
const nc = uuidv7();
const PDF = Buffer.from('%PDF-1.7\n%conteudo de teste\n').toString('base64');

async function recusa(promessa: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

const laudo = (extra: Partial<NovoAnexo> = {}): NovoAnexo => ({
  registro: 'nao_conformidade',
  registroId: nc,
  nome: 'laudo-dimensional.pdf',
  tipo: 'application/pdf',
  base64: PDF,
  ...extra,
});

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new AnexosService(banco.db);
});
afterAll(() => banco.encerrar());

describe('anexos', () => {
  it('anexa, lista só do registro e devolve o conteúdo igual', async () => {
    const a = await servico.anexar(
      empresaA,
      laudo({ descricao: 'Medição da peça 4471' }),
    );
    await servico.anexar(empresaA, laudo({ registroId: uuidv7() }));
    expect(a).toMatchObject({
      nome: 'laudo-dimensional.pdf',
      tamanho: Buffer.from(PDF, 'base64').length,
      descricao: 'Medição da peça 4471',
    });
    expect(
      (
        await servico.listar(empresaA, {
          registro: 'nao_conformidade',
          registroId: nc,
        })
      ).map((x) => x.id),
    ).toEqual([a.id]);
    expect((await servico.conteudo(empresaA, { id: a.id })).base64).toBe(PDF);
  });

  it('recusa conteúdo que não bate com o tipo declarado', async () => {
    const exe = Buffer.from('MZ\x90\x00 executavel').toString('base64');
    const r = await recusa(servico.anexar(empresaA, laudo({ base64: exe })));
    expect(r.detalhes?.[0]).toMatchObject({ campo: 'arquivo' });
    expect(r.detalhes?.[0]?.mensagem).toContain('não é de um arquivo PDF');
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2,
    ]).toString('base64');
    await servico.anexar(
      empresaA,
      laudo({ nome: 'foto.png', tipo: 'image/png', base64: png }),
    );
  });

  it('removido sai da lista e do download; outra empresa não enxerga', async () => {
    const a = await servico.anexar(empresaA, laudo({ nome: 'errado.pdf' }));
    expect(
      (await recusa(servico.conteudo(empresaB, { id: a.id }))).codigo,
    ).toBe('NAO_ENCONTRADO');
    expect(
      await servico.listar(empresaB, {
        registro: 'nao_conformidade',
        registroId: nc,
      }),
    ).toEqual([]);
    await servico.remover(empresaA, { id: a.id });
    expect(
      (
        await servico.listar(empresaA, {
          registro: 'nao_conformidade',
          registroId: nc,
        })
      ).map((x) => x.nome),
    ).not.toContain('errado.pdf');
    expect(
      (await recusa(servico.conteudo(empresaA, { id: a.id }))).codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});
