import { ErroDeNegocio, hojeEmBrasilia, somarDias } from '@davinci/shared';
import { uuidv7, type Contexto, type ErroPadrao } from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { auditorias } from '../db/schema.js';
import { KIT_PRE_AUDITORIA } from './catalogo.js';
import { KitService } from './kit.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: KitService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
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

async function auditoria(dataInicio: string, status = 'planejada') {
  const [a] = await banco.db
    .insert(auditorias)
    .values({
      numero: `AUD-T-${uuidv7().slice(-6)}`,
      tipo: 'certificacao',
      escopo: 'Certificação ISO 9001',
      normas: ['iso9001'],
      auditorLider: 'Organismo',
      dataInicio,
      dataFim: dataInicio,
      status,
      empresaId: ctx.empresaId,
      criadoPor: ctx.usuarioId,
      atualizadoPor: ctx.usuarioId,
    })
    .returning();
  return a!;
}

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  s = new KitService(banco.db);
});
afterAll(() => banco.encerrar());

describe('Kit pré-auditoria', () => {
  it('itens sem repetição; prazo = início − dias do momento; atrasado só se passou e não concluiu', async () => {
    expect(new Set(KIT_PRE_AUDITORIA.map((i) => i.codigo)).size).toBe(
      KIT_PRE_AUDITORIA.length,
    );
    expect(new Set(KIT_PRE_AUDITORIA.map((i) => i.descricao)).size).toBe(
      KIT_PRE_AUDITORIA.length,
    );
    const a = await auditoria(somarDias(hoje, 20));
    const kit = await s.obter(ctx, { id: a.id });
    expect(kit).toMatchObject({
      total: KIT_PRE_AUDITORIA.length,
      concluidos: 0,
      prontidao: 0,
      somenteLeitura: false,
    });
    const i90 = kit.itens.find((i) => i.momento === 'd90')!;
    expect(i90).toMatchObject({
      prazo: somarDias(hoje, -70),
      atrasado: true,
      status: 'pendente',
    });
    expect(kit.itens.find((i) => i.momento === 'd15')).toMatchObject({
      prazo: somarDias(hoje, 5),
      atrasado: false,
    });
  });

  it('marcar: muda o status, recalcula a prontidão e recusa item desconhecido ou auditoria encerrada', async () => {
    const a = await auditoria(somarDias(hoje, 20));
    await s.marcar(ctx, {
      id: a.id,
      alteracoes: { codigo: 'K90-01', status: 'em_andamento' },
    });
    let kit = await s.marcar(ctx, {
      id: a.id,
      alteracoes: { codigo: 'K90-01', status: 'concluido' },
    });
    expect(kit.itens.find((i) => i.codigo === 'K90-01')).toMatchObject({
      status: 'concluido',
      atrasado: false,
    });
    expect(kit.concluidos).toBe(1);
    expect(kit.prontidao).toBe(
      Math.round((1 / KIT_PRE_AUDITORIA.length) * 100),
    );
    expect(
      (
        await recusa(
          s.marcar(ctx, {
            id: a.id,
            alteracoes: { codigo: 'X99', status: 'concluido' },
          }),
        )
      ).mensagem,
    ).toContain('desconhecido');
    const fechada = await auditoria(somarDias(hoje, -5), 'concluida');
    kit = await s.obter(ctx, { id: fechada.id });
    expect(kit.somenteLeitura).toBe(true);
    expect(kit.itens.some((i) => i.atrasado)).toBe(false);
    expect(
      (
        await recusa(
          s.marcar(ctx, {
            id: fechada.id,
            alteracoes: { codigo: 'K90-01', status: 'concluido' },
          }),
        )
      ).mensagem,
    ).toContain('encerrada');
    expect(
      (await recusa(s.obter({ ...ctx, empresaId: uuidv7() }, { id: a.id })))
        .codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});
