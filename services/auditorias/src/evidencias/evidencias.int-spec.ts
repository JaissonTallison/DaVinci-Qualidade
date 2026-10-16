import { uuidv7, type Contexto } from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { EvidenciasService } from './evidencias.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: EvidenciasService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  s = new EvidenciasService(banco.db);
});
afterAll(() => banco.encerrar());

describe('Biblioteca de evidências (banco)', () => {
  it('filtra por norma, capítulo e controle; evidência própria entra só para a empresa', async () => {
    const cap8 = await s.listar(ctx, { norma: 'iso9001', clausula: '8' });
    expect(cap8.length).toBeGreaterThan(10);
    expect(cap8.every((e) => e.clausula.startsWith('8.'))).toBe(true);
    expect(
      (await s.listar(ctx, { norma: 'iso27001', controle: 'A.8.13' })).map(
        (e) => e.titulo,
      ),
    ).toEqual(['Backup das informações']);
    expect(await s.listar(ctx, { tema: 'pessoas' })).toHaveLength(8);
    const p = await s.criarPropria(ctx, {
      norma: 'iso9001',
      clausula: '8.4.1',
      titulo: 'Homologação de fornecedor de tinta',
      tipo: 'registro',
      risco: 'medio',
      oQuePedir: 'Relatório de homologação',
      exemplo: 'Relatório HF-12 aprovado',
    });
    expect(
      (await s.listar(ctx, { busca: 'tinta', norma: 'iso9001' })).map(
        (e) => e.codigo,
      ),
    ).toContain(p.codigo);
    expect(
      await s.listar(
        { ...ctx, empresaId: uuidv7() },
        { busca: 'Homologação de fornecedor de tinta' },
      ),
    ).toEqual([]);
    await s.excluirPropria(ctx, { id: p.codigo });
    expect(
      await s.listar(ctx, { busca: 'Homologação de fornecedor de tinta' }),
    ).toEqual([]);
  });
});
