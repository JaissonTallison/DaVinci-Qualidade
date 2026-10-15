import { ErroDeNegocio, hojeEmBrasilia, somarDias } from '@davinci/shared';
import {
  CATALOGO_ESG,
  uuidv7,
  type Contexto,
  type ErroPadrao,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import * as schema from '../db/schema.js';
import { PrazosService } from '../prazos/prazos.service.js';
import { TemasService } from './temas.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: TemasService;
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

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  s = new TemasService(banco.db);
});
afterAll(() => banco.encerrar());

describe('Agenda ESG', () => {
  it('catálogo: importa todos uma vez; importar de novo não duplica', async () => {
    expect(await s.importarCatalogo(ctx)).toEqual({
      criados: CATALOGO_ESG.length,
      jaExistiam: 0,
    });
    expect(await s.importarCatalogo(ctx)).toEqual({
      criados: 0,
      jaExistiam: CATALOGO_ESG.length,
    });
    const ts = await s.listar(ctx);
    expect(ts).toHaveLength(CATALOGO_ESG.length);
    expect(ts.every((t) => t.nota === null)).toBe(true);
    expect((await s.resumo(ctx)).semAvaliacao).toBe(CATALOGO_ESG.length);
  });

  it('materialidade: notas juntas; nota ≥ 15 exige responsável, meta e prazo', async () => {
    const t = (await s.listar(ctx)).find((x) => x.codigoCatalogo === 'S4')!;
    const so = await recusa(
      s.atualizar(ctx, {
        id: t.id,
        alteracoes: {
          nome: t.nome,
          pilar: t.pilar,
          ods: t.ods,
          versao: t.versao,
          impacto: 5,
        },
      }),
    );
    expect(so.detalhes?.[0]?.campo).toBe('relevancia');
    const sem = await recusa(
      s.atualizar(ctx, {
        id: t.id,
        alteracoes: {
          nome: t.nome,
          pilar: t.pilar,
          ods: t.ods,
          versao: t.versao,
          impacto: 5,
          relevancia: 4,
        },
      }),
    );
    expect(sem.detalhes?.map((d) => d.campo).sort()).toEqual([
      'meta',
      'prazoMeta',
      'responsavel',
    ]);
    const media = await s.atualizar(ctx, {
      id: t.id,
      alteracoes: {
        nome: t.nome,
        pilar: t.pilar,
        ods: t.ods,
        versao: t.versao,
        impacto: 3,
        relevancia: 3,
      },
    });
    expect(media).toMatchObject({ nota: 9, nivel: 'media', material: false });
    const m = await s.atualizar(ctx, {
      id: t.id,
      alteracoes: {
        nome: t.nome,
        pilar: t.pilar,
        ods: t.ods,
        versao: media.versao,
        impacto: 5,
        relevancia: 4,
        responsavel: 'SESMT',
        meta: 'Reduzir a TF para menos de 5 em 2027',
        prazoMeta: somarDias(hoje, -1),
      },
    });
    expect(m).toMatchObject({
      nota: 20,
      nivel: 'alta',
      material: true,
      metaAtrasada: true,
      progresso: 0,
    });
    expect((await s.listar(ctx))[0]!.id).toBe(t.id);
    expect(await s.resumo(ctx)).toMatchObject({
      materiais: 1,
      metasAtrasadas: 1,
      odsComTemaMaterial: 3,
    });
  });

  it('andamento: exige meta; 100% tira o atraso e o prazo', async () => {
    const ts = await s.listar(ctx);
    const semMeta = ts.find((x) => x.codigoCatalogo === 'G2')!;
    expect(
      (
        await recusa(
          s.registrarAndamento(ctx, {
            id: semMeta.id,
            alteracoes: {
              data: hoje,
              progresso: 10,
              comentario: 'Código de conduta publicado',
            },
          }),
        )
      ).mensagem,
    ).toContain('meta');
    const t = ts.find((x) => x.material)!;
    expect(
      (await new PrazosService(s).prazos(ctx, { dias: 30 })).map((p) => p.tipo),
    ).toEqual(['Meta ESG']);
    expect(
      (
        await recusa(
          s.registrarAndamento(ctx, {
            id: t.id,
            alteracoes: {
              data: somarDias(hoje, 1),
              progresso: 50,
              comentario: 'Futuro',
            },
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('data');
    await s.registrarAndamento(ctx, {
      id: t.id,
      alteracoes: {
        data: hoje,
        progresso: 60,
        comentario: 'Programa de DDS diário implantado',
      },
    });
    const fim = await s.registrarAndamento(ctx, {
      id: t.id,
      alteracoes: {
        data: hoje,
        progresso: 100,
        comentario: 'TF de 4,2 no fechamento',
      },
    });
    expect(fim).toMatchObject({ progresso: 100, metaAtrasada: false });
    expect(fim.andamentos).toHaveLength(2);
    expect(await new PrazosService(s).prazos(ctx, { dias: 30 })).toEqual([]);
  });

  it('tema próprio da empresa e inativação', async () => {
    const t = await s.criar(ctx, {
      nome: 'Logística reversa de embalagens',
      pilar: 'ambiental',
      ods: [12, '11'],
    });
    expect(t).toMatchObject({
      codigoCatalogo: null,
      ods: [11, 12],
      nota: null,
    });
    const inativo = await s.situacao(ctx, {
      id: t.id,
      alteracoes: { versao: t.versao, ativo: false },
    });
    expect(inativo.ativo).toBe(false);
    expect((await s.listar(ctx)).some((x) => x.id === t.id)).toBe(false);
  });
});
