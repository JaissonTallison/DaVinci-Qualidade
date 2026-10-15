import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  ordemAlfabetica,
  violacaoUnica,
} from '@davinci/database';
import { ErroDeNegocio, hojeEmBrasilia, validar } from '@davinci/shared';
import {
  atualizarTerceiroSchema,
  filtroTerceirosSchema,
  isUuid,
  normalizarDocumento,
  novoTerceiroSchema,
  registrarDocTerceiroSchema,
  type Contexto,
  type DocumentoTerceiro,
  type ResumoTerceiros,
  type Terceiro,
  type TerceiroResumo,
  type TipoDocTerceiro,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { documentosTerceiros as docs, terceiros } from '../db/schema.js';
import { situacaoDoTerceiro, vencendoEmBreve, vigentes } from './regras.js';

type Db = Database<typeof schema>;
type LinhaT = typeof terceiros.$inferSelect;
type LinhaD = typeof docs.$inferSelect;
type ComId = { id?: unknown; alteracoes?: unknown };
const REPETIDO = 'Já existe uma terceira com este CNPJ.';

@Injectable()
export class TerceirosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<TerceiroResumo[]> {
    const f = validar(filtroTerceirosSchema, dados ?? {});
    const condicoes: SQL[] = [eq(terceiros.empresaId, ctx.empresaId)];
    if (f.busca) {
      const doc = normalizarDocumento(f.busca);
      condicoes.push(
        or(
          ilike(terceiros.razaoSocial, `%${f.busca}%`),
          ilike(terceiros.servico, `%${f.busca}%`),
          ...(doc.length >= 3 ? [ilike(terceiros.cnpj, `%${doc}%`)] : []),
        )!,
      );
    }
    const linhas = await this.db
      .select()
      .from(terceiros)
      .where(and(...condicoes))
      .orderBy(ordemAlfabetica(terceiros.razaoSocial));
    const todos = await this.documentosDe(
      ctx,
      linhas.map((l) => l.id),
    );
    const hoje = hojeEmBrasilia();
    return linhas
      .map((l) => resumir(l, todos.get(l.id) ?? [], hoje))
      .filter((t) => !f.situacao || t.situacao === f.situacao);
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Terceiro> {
    const l = await this.buscar(ctx, dados?.id);
    const lista = (await this.documentosDe(ctx, [l.id])).get(l.id) ?? [];
    const v = new Set([...vigentes(lista).values()].map((d) => d.id));
    return {
      ...resumir(l, lista, hojeEmBrasilia()),
      contato: l.contato,
      inicioContrato: l.inicioContrato,
      documentos: lista
        .map((d) => ({ ...montarDoc(d), vigente: v.has(d.id) }))
        .sort(
          (a, b) =>
            Number(b.vigente) - Number(a.vigente) ||
            b.validade.localeCompare(a.validade),
        ),
      versao: l.atualizadoEm.toISOString(),
    };
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Terceiro> {
    const novo = validar(novoTerceiroSchema, dados);
    try {
      const [l] = await this.db
        .insert(terceiros)
        .values({
          ...novo,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return this.obter(ctx, { id: l!.id });
    } catch (erro) {
      throw repetido(erro) ?? erro;
    }
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<Terceiro> {
    const { versao, ...campos } = validar(
      atualizarTerceiroSchema,
      dados?.alteracoes,
    );
    const lida = new Date(versao);
    try {
      const [l] =
        isUuid(dados?.id) && !Number.isNaN(lida.getTime())
          ? await this.db
              .update(terceiros)
              .set({ ...campos, atualizadoPor: ctx.usuarioId })
              .where(
                and(
                  eq(terceiros.id, dados.id),
                  eq(terceiros.empresaId, ctx.empresaId),
                  eq(terceiros.atualizadoEm, lida),
                ),
              )
              .returning()
          : [];
      if (!l)
        throw new ErroDeNegocio(
          'CONFLITO',
          'Este cadastro foi alterado por outra pessoa ou não existe. Recarregue a página.',
        );
      return this.obter(ctx, { id: l.id });
    } catch (erro) {
      throw repetido(erro) ?? erro;
    }
  }

  async registrarDocumento(ctx: Contexto, dados: ComId): Promise<Terceiro> {
    const d = validar(registrarDocTerceiroSchema, dados?.alteracoes);
    const t = await this.buscar(ctx, dados?.id);
    await this.db.insert(docs).values({
      ...d,
      terceiroId: t.id,
      empresaId: ctx.empresaId,
      criadoPor: ctx.usuarioId,
      atualizadoPor: ctx.usuarioId,
    });
    return this.obter(ctx, { id: t.id });
  }

  async resumo(ctx: Contexto): Promise<ResumoTerceiros> {
    const lista = await this.listar(ctx, {});
    const ativos = lista
      .filter((t) => t.situacao !== 'contrato_encerrado')
      .map((t) => t.id);
    const hoje = hojeEmBrasilia();
    const todos = await this.documentosDe(ctx, ativos);
    let vencendo = 0;
    for (const ds of todos.values())
      for (const d of vigentes(ds).values())
        if (vencendoEmBreve(d.validade, hoje)) vencendo++;
    return {
      liberadas: lista.filter((t) => t.situacao === 'liberada').length,
      comPendencia: lista.filter((t) => t.situacao === 'pendente').length,
      documentosVencendo: vencendo,
    };
  }

  private async buscar(ctx: Contexto, id: unknown): Promise<LinhaT> {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(terceiros)
          .where(
            and(eq(terceiros.id, id), eq(terceiros.empresaId, ctx.empresaId)),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Terceiro não encontrado.');
    return l;
  }

  private async documentosDe(
    ctx: Contexto,
    ids: string[],
  ): Promise<Map<string, LinhaD[]>> {
    const m = new Map<string, LinhaD[]>();
    if (!ids.length) return m;
    const linhas = await this.db
      .select()
      .from(docs)
      .where(
        and(eq(docs.empresaId, ctx.empresaId), inArray(docs.terceiroId, ids)),
      )
      .orderBy(desc(docs.criadoEm));
    for (const l of linhas)
      m.set(l.terceiroId, [...(m.get(l.terceiroId) ?? []), l]);
    return m;
  }
}

function repetido(erro: unknown): ErroDeNegocio | null {
  return violacaoUnica(erro) === 'terceiros_cnpj_por_empresa'
    ? new ErroDeNegocio('CONFLITO', REPETIDO, [
        { campo: 'cnpj', mensagem: REPETIDO },
      ])
    : null;
}

function resumir(l: LinhaT, ds: LinhaD[], hoje: string): TerceiroResumo {
  return {
    id: l.id,
    razaoSocial: l.razaoSocial,
    cnpj: l.cnpj,
    servico: l.servico,
    fimContrato: l.fimContrato,
    ...situacaoDoTerceiro(l.fimContrato, ds, hoje),
  };
}

function montarDoc(d: LinhaD): DocumentoTerceiro {
  return {
    id: d.id,
    tipo: d.tipo as TipoDocTerceiro,
    descricao: d.descricao,
    validade: d.validade,
    registradoEm: d.criadoEm.toISOString(),
  };
}
