import { PACKS_ANTI_NC, uuidv7, type Contexto } from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import { BANCO_DE_MODELOS_NC } from '../conteudo/modelos-nc.js';
import { BANCO_DE_PROMPTS } from '../conteudo/prompts.js';
import * as schema from '../db/schema.js';
import { ModelosNcService } from './modelos-nc.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: ModelosNcService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  s = new ModelosNcService(banco.db);
});
afterAll(() => banco.encerrar());

describe('Banco de NCs e prompts', () => {
  it('modelos: códigos únicos, redação completa, filtros por norma, tipo e pack', async () => {
    expect(BANCO_DE_MODELOS_NC.length).toBeGreaterThanOrEqual(380);
    expect(new Set(BANCO_DE_MODELOS_NC.map((m) => m.codigo)).size).toBe(
      BANCO_DE_MODELOS_NC.length,
    );
    expect(
      BANCO_DE_MODELOS_NC.every(
        (m) =>
          m.descricao &&
          m.causaRaiz &&
          m.acaoCorretiva &&
          m.evidenciaFechamento,
      ),
    ).toBe(true);
    const doc = await s.listar(ctx, {
      norma: 'iso45001',
      tipo: 'documentacao',
    });
    expect(
      doc.every((m) => m.norma === 'iso45001' && m.tipo === 'documentacao'),
    ).toBe(true);
    const pack = await s.listar(ctx, { pack: 'iso9001_anti_nc' });
    expect(pack.length).toBeGreaterThan(0);
    expect(
      pack.every(
        (m) =>
          m.norma.startsWith('iso9001') &&
          PACKS_ANTI_NC.iso9001_anti_nc.clausulas.some(
            (c) => m.clausula === c || m.clausula.startsWith(`${c}.`),
          ),
      ),
    ).toBe(true);
  });

  it('modelo próprio só para a empresa e prompts filtráveis', async () => {
    const m = await s.criarProprio(ctx, {
      norma: 'iso9001',
      clausula: '7.1.5',
      tipo: 'registro',
      titulo: 'Paquímetro sem etiqueta',
      descricao:
        'Evidenciado paquímetro sem identificação de calibração na linha 2.',
      causaRaiz: 'Etiquetas não repostas',
      acaoCorretiva: 'Rotina de inspeção de etiquetas',
      evidenciaFechamento: 'Checklist mensal',
    });
    expect(
      (await s.listar(ctx, { busca: 'sem etiqueta' })).map((x) => x.codigo),
    ).toContain(m.codigo);
    expect(
      await s.listar(
        { ...ctx, empresaId: uuidv7() },
        { busca: 'Paquímetro sem etiqueta' },
      ),
    ).toEqual([]);
    await s.excluirProprio(ctx, { id: m.codigo });
    expect(BANCO_DE_PROMPTS.length).toBeGreaterThanOrEqual(120);
    const cat = BANCO_DE_PROMPTS[0]!.categoria;
    expect(
      s.listarPrompts({ categoria: cat }).every((p) => p.categoria === cat),
    ).toBe(true);
  });
});
