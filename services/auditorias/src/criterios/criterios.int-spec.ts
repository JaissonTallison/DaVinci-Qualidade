import { uuidv7, type Contexto, type ErroPadrao } from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import { ErroDeNegocio } from '@davinci/shared';
import * as schema from '../db/schema.js';
import { CriteriosService } from './criterios.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: CriteriosService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const outra: Contexto = { ...ctx, empresaId: uuidv7() };

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  s = new CriteriosService(banco.db);
});
afterAll(() => banco.encerrar());

/** Código do erro de negócio da recusa. */
async function recusa(
  promessa: Promise<unknown>,
): Promise<ErroPadrao['codigo']> {
  try {
    await promessa;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return (e.getError() as ErroPadrao).codigo;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

describe('Critérios próprios', () => {
  it('cria, lista só para a empresa e exclui', async () => {
    const c = await s.criar(ctx, {
      tipo: 'legislacao',
      nome: 'NR-12 Segurança em máquinas',
      referencia: 'Portaria MTb 3.214/1978',
      requisitos:
        'Proteções fixas; dispositivos de parada de emergência; capacitação dos operadores.',
    });
    expect(c).toMatchObject({
      tipo: 'legislacao',
      referencia: 'Portaria MTb 3.214/1978',
    });
    expect(await s.listar(ctx)).toHaveLength(1);
    expect(await s.listar(outra)).toHaveLength(0);
    expect(await recusa(s.excluir(outra, { id: c.id }))).toBe('NAO_ENCONTRADO');
    await s.excluir(ctx, { id: c.id });
    expect(await s.listar(ctx)).toHaveLength(0);
  });

  it('recusa critério sem requisitos', async () => {
    expect(
      await recusa(
        s.criar(ctx, { tipo: 'norma_interna', nome: 'PR-08', requisitos: '' }),
      ),
    ).toBe('DADOS_INVALIDOS');
  });
});
