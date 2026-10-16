import { ErroDeNegocio, hojeEmBrasilia } from '@davinci/shared';
import {
  PROCESSOS_AUDITADOS,
  uuidv7,
  type Contexto,
  type ErroPadrao,
} from '@davinci/types';
import { criarBancoDeTeste } from '@davinci/database/teste';
import { BANCO_DE_PERGUNTAS } from '../conteudo/perguntas.js';
import * as schema from '../db/schema.js';
import { auditorias } from '../db/schema.js';
import { RoteiroService } from './roteiro.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let s: RoteiroService;
const ctx: Contexto = {
  empresaId: uuidv7(),
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
};
const hoje = hojeEmBrasilia();
const de = (processo: string, i = 0) =>
  BANCO_DE_PERGUNTAS.filter((p) => p.processo === processo)[i]!.codigo;
const [C1, C2, Q1] = [de('compras'), de('compras', 1), de('qualidade')];

async function recusa(p: Promise<unknown>): Promise<ErroPadrao> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ErroDeNegocio) return e.getError() as ErroPadrao;
    throw e;
  }
  throw new Error('Era esperada uma recusa.');
}

async function auditoria(status = 'planejada') {
  const [a] = await banco.db
    .insert(auditorias)
    .values({
      numero: `AUD-R-${uuidv7().slice(-6)}`,
      tipo: 'interna',
      escopo: 'Auditoria interna do SGQ',
      normas: ['iso9001'],
      auditorLider: 'Ana',
      dataInicio: hoje,
      dataFim: hoje,
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
  s = new RoteiroService(banco.db);
});
afterAll(() => banco.encerrar());

describe('Roteiros de entrevista', () => {
  it('banco: completo, códigos únicos, os 18 processos e filtros por processo, cláusula, pack e palavra', async () => {
    expect(BANCO_DE_PERGUNTAS.length).toBeGreaterThanOrEqual(560);
    expect(new Set(BANCO_DE_PERGUNTAS.map((p) => p.codigo)).size).toBe(
      BANCO_DE_PERGUNTAS.length,
    );
    for (const proc of Object.keys(PROCESSOS_AUDITADOS))
      expect(BANCO_DE_PERGUNTAS.some((p) => p.processo === proc)).toBe(true);
    expect(BANCO_DE_PERGUNTAS.some((p) => p.pergunta.startsWith('[v'))).toBe(
      false,
    );
    const compras84 = await s.listarPerguntas(ctx, {
      processo: 'compras',
      clausula: '8.4',
    });
    expect(compras84.length).toBeGreaterThanOrEqual(3);
    expect(
      compras84.every(
        (p) => p.processo === 'compras' && p.clausula.startsWith('8.4'),
      ),
    ).toBe(true);
    const pack = await s.listarPerguntas(ctx, { pack: 'iso14001_anti_nc' });
    expect(pack.length).toBeGreaterThan(0);
    expect(pack.every((p) => p.norma.startsWith('iso14001'))).toBe(true);
    const alvo = BANCO_DE_PERGUNTAS[0]!;
    expect(
      (await s.listarPerguntas(ctx, { busca: alvo.pergunta.slice(0, 30) })).map(
        (p) => p.codigo,
      ),
    ).toContain(alvo.codigo);
  });

  it('pergunta própria entra no banco da empresa e pode ser apagada', async () => {
    const p = await s.criarPropria(ctx, {
      processo: 'compras',
      norma: 'iso9001',
      clausula: '8.4.1',
      pergunta: 'Como é avaliado o fornecedor de embalagens?',
      respostaEsperada: 'Avaliação semestral registrada',
      sinalDeAlerta: 'Nunca avaliado',
    });
    expect(p).toMatchObject({ origem: 'propria', objetivo: null });
    expect(
      (await s.listarPerguntas(ctx, { busca: 'embalagens?' })).map(
        (x) => x.codigo,
      ),
    ).toContain(p.codigo);
    expect(
      await s.listarPerguntas(
        { ...ctx, empresaId: uuidv7() },
        { busca: 'fornecedor de embalagens' },
      ),
    ).toEqual([]);
    await s.excluirPropria(ctx, { id: p.codigo });
    expect(
      await s.listarPerguntas(ctx, { busca: 'fornecedor de embalagens' }),
    ).toEqual([]);
  });

  it('roteiro: incluir, não duplicar, responder só em andamento, evidência obrigatória e respondida não sai', async () => {
    const a = await auditoria();
    let r = await s.selecionar(ctx, {
      id: a.id,
      alteracoes: { incluir: [C1, C2, Q1] },
    });
    r = await s.selecionar(ctx, { id: a.id, alteracoes: { incluir: [C2] } });
    expect(r.perguntas.map((p) => p.codigo)).toEqual([C1, C2, Q1]);
    expect(r.perguntas[0]!.objetivo).toBeTruthy();
    expect(
      (
        await recusa(
          s.selecionar(ctx, {
            id: a.id,
            alteracoes: { incluir: ['P-desconhecida'] },
          }),
        )
      ).mensagem,
    ).toContain('desconhecida');
    expect(
      (
        await recusa(
          s.responder(ctx, {
            id: a.id,
            alteracoes: {
              codigo: C1,
              resposta: 'conforme',
              evidencia: 'Avaliação 2026',
            },
          }),
        )
      ).mensagem,
    ).toContain('Inicie');
    await banco.db.update(auditorias).set({ status: 'em_andamento' });
    expect(
      (
        await recusa(
          s.responder(ctx, {
            id: a.id,
            alteracoes: { codigo: C2, resposta: 'nao_conforme' },
          }),
        )
      ).detalhes?.[0]?.campo,
    ).toBe('evidencia');
    r = await s.responder(ctx, {
      id: a.id,
      alteracoes: {
        codigo: C2,
        resposta: 'nao_conforme',
        evidencia: 'Fornecedor Aços Sul sem reavaliação desde 2023',
      },
    });
    expect(r.contagem).toMatchObject({ pendente: 2, nao_conforme: 1 });
    expect(
      r.perguntas.find((p) => p.codigo === C2)?.respondidaEm,
    ).not.toBeNull();
    expect(
      (
        await recusa(
          s.selecionar(ctx, { id: a.id, alteracoes: { retirar: [C2] } }),
        )
      ).mensagem,
    ).toContain('respondida');
    r = await s.selecionar(ctx, { id: a.id, alteracoes: { retirar: [Q1] } });
    expect(r.perguntas).toHaveLength(2);
  });
});
