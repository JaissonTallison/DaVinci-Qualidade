import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { DATABASE, type Database, ordemAlfabetica } from '@davinci/database';
import { ErroDeNegocio, hojeEmBrasilia, validar } from '@davinci/shared';
import {
  atualizarTemaSchema,
  CATALOGO_ESG,
  filtroTemasSchema,
  isUuid,
  nivelDeMaterialidade,
  NOTA_MATERIAL,
  notaDeMaterialidade,
  novoTemaSchema,
  registrarAndamentoSchema,
  situacaoDoTemaSchema,
  type Andamento,
  type Contexto,
  type Pilar,
  type ResultadoDaImportacao,
  type ResumoEsg,
  type TemaEsg,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { andamentos, temas } from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const CONFLITO =
  'Este registro foi alterado por outra pessoa ou não existe. Recarregue a página.';
const ORDEM_PILAR: Record<Pilar, number> = {
  ambiental: 0,
  social: 1,
  governanca: 2,
};

/** Temas ESG: catálogo, dupla materialidade, ODS e meta com andamento. */
@Injectable()
export class TemasService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  /** Mais materiais primeiro; sem avaliação no fim. */
  async listar(ctx: Contexto, dados?: unknown): Promise<TemaEsg[]> {
    const f = validar(filtroTemasSchema, dados ?? {});
    const c: SQL[] = [eq(temas.empresaId, ctx.empresaId)];
    if (f.situacao !== 'todos')
      c.push(eq(temas.ativo, f.situacao === 'ativos'));
    if (f.pilar) c.push(eq(temas.pilar, f.pilar));
    const ts = await this.db
      .select()
      .from(temas)
      .where(and(...c))
      .orderBy(ordemAlfabetica(temas.nome));
    const as = ts.length
      ? await this.db
          .select()
          .from(andamentos)
          .where(
            inArray(
              andamentos.temaId,
              ts.map((t) => t.id),
            ),
          )
          .orderBy(desc(andamentos.data), desc(andamentos.criadoEm))
      : [];
    const hoje = hojeEmBrasilia();
    return ts
      .map((t) =>
        montar(
          t,
          as.filter((a) => a.temaId === t.id),
          hoje,
          false,
        ),
      )
      .sort(
        (a, b) =>
          (b.nota ?? -1) - (a.nota ?? -1) ||
          ORDEM_PILAR[a.pilar] - ORDEM_PILAR[b.pilar],
      );
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<TemaEsg> {
    const t = await this.tema(ctx, dados?.id);
    const as = await this.db
      .select()
      .from(andamentos)
      .where(eq(andamentos.temaId, t.id))
      .orderBy(desc(andamentos.data), desc(andamentos.criadoEm));
    return montar(t, as, hojeEmBrasilia(), true);
  }

  async criar(ctx: Contexto, dados: unknown): Promise<TemaEsg> {
    const n = validar(novoTemaSchema, dados);
    const [l] = await this.db
      .insert(temas)
      .values({ ...n, ...autoria(ctx) })
      .returning();
    return montar(l!, [], hojeEmBrasilia(), true);
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<TemaEsg> {
    const { versao, ...campos } = validar(
      atualizarTemaSchema,
      dados?.alteracoes,
    );
    const t = await this.tema(ctx, dados?.id);
    return this.gravar(ctx, t.id, versao, campos);
  }

  async situacao(ctx: Contexto, dados: ComId): Promise<TemaEsg> {
    const { versao, ativo } = validar(situacaoDoTemaSchema, dados?.alteracoes);
    const t = await this.tema(ctx, dados?.id);
    return this.gravar(ctx, t.id, versao, { ativo });
  }

  /** Cria os temas do catálogo que a empresa ainda não tem; rodar de novo não duplica nem mexe no que foi ajustado. */
  async importarCatalogo(ctx: Contexto): Promise<ResultadoDaImportacao> {
    const existentes = await this.db
      .select({ codigo: temas.codigoCatalogo })
      .from(temas)
      .where(eq(temas.empresaId, ctx.empresaId));
    const tem = new Set(existentes.map((e) => e.codigo));
    const novos = CATALOGO_ESG.filter((c) => !tem.has(c.codigo));
    if (novos.length)
      await this.db
        .insert(temas)
        .values(
          novos.map((c) => ({
            codigoCatalogo: c.codigo,
            nome: c.nome,
            pilar: c.pilar,
            descricao: c.descricao,
            ods: c.ods,
            ...autoria(ctx),
          })),
        )
        .onConflictDoNothing();
    return {
      criados: novos.length,
      jaExistiam: CATALOGO_ESG.length - novos.length,
    };
  }

  async registrarAndamento(ctx: Contexto, dados: ComId): Promise<TemaEsg> {
    const n = validar(registrarAndamentoSchema, dados?.alteracoes);
    if (n.data > hojeEmBrasilia())
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [{ campo: 'data', mensagem: 'A data não pode estar no futuro.' }],
      );
    const t = await this.tema(ctx, dados?.id);
    if (!t.meta)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Defina a meta do tema antes de registrar o andamento.',
      );
    await this.db
      .insert(andamentos)
      .values({ ...n, temaId: t.id, ...autoria(ctx) });
    return this.obter(ctx, { id: t.id });
  }

  async resumo(ctx: Contexto): Promise<ResumoEsg> {
    const ts = await this.listar(ctx);
    return {
      temas: ts.length,
      semAvaliacao: ts.filter((t) => t.nota === null).length,
      materiais: ts.filter((t) => t.material).length,
      metasAtrasadas: ts.filter((t) => t.metaAtrasada).length,
      odsComTemaMaterial: new Set(
        ts.filter((t) => t.material).flatMap((t) => t.ods),
      ).size,
    };
  }

  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof temas.$inferInsert>,
  ) {
    const [l] = await this.db
      .update(temas)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(and(eq(temas.id, id), eq(temas.atualizadoEm, new Date(versao))))
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return this.obter(ctx, { id: l.id });
  }

  private async tema(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(temas)
          .where(and(eq(temas.id, id), eq(temas.empresaId, ctx.empresaId)))
      : [];
    if (!l) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Tema não encontrado.');
    return l;
  }
}

const autoria = (ctx: Contexto) => ({
  empresaId: ctx.empresaId,
  criadoPor: ctx.usuarioId,
  atualizadoPor: ctx.usuarioId,
});

function montar(
  t: typeof temas.$inferSelect,
  as: (typeof andamentos.$inferSelect)[],
  hoje: string,
  comAndamentos: boolean,
): TemaEsg {
  const nota =
    t.impacto !== null && t.relevancia !== null
      ? notaDeMaterialidade(t.impacto, t.relevancia)
      : null;
  const material = nota !== null && nota >= NOTA_MATERIAL;
  const lista = as.map((a): Andamento => ({
    id: a.id,
    data: a.data,
    progresso: a.progresso,
    comentario: a.comentario,
  }));
  const progresso = lista[0]?.progresso ?? 0;
  return {
    id: t.id,
    codigoCatalogo: t.codigoCatalogo,
    nome: t.nome,
    pilar: t.pilar as Pilar,
    descricao: t.descricao,
    ods: [...t.ods].sort((a, b) => a - b),
    impacto: t.impacto,
    relevancia: t.relevancia,
    nota,
    nivel: nota === null ? null : nivelDeMaterialidade(nota),
    material,
    responsavel: t.responsavel,
    meta: t.meta,
    prazoMeta: t.prazoMeta,
    progresso,
    metaAtrasada:
      t.ativo &&
      material &&
      Boolean(t.prazoMeta && t.prazoMeta < hoje) &&
      progresso < 100,
    ativo: t.ativo,
    versao: t.atualizadoEm.toISOString(),
    ...(comAndamentos ? { andamentos: lista } : {}),
  };
}
