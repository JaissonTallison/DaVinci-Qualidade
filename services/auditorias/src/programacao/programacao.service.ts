import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  atualizarItemProgramacaoSchema,
  filtroProgramacaoSchema,
  isUuid,
  novoItemProgramacaoSchema,
  type AuditoriaDaProgramacao,
  type Contexto,
  type FrequenciaDeAuditoria,
  type ItemDaProgramacao,
  type Norma,
  type StatusAuditoria,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { auditorias, programacaoAuditorias } from '../db/schema.js';

type Db = Database<typeof schema>;
type Linha = typeof programacaoAuditorias.$inferSelect;

const CONFLITO =
  'Este item foi alterado por outra pessoa. Recarregue a página para ver a versão atual.';

/** Programação anual de auditorias (planejamento por setor + vínculo manual com as auditorias). */
@Injectable()
export class ProgramacaoService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<ItemDaProgramacao[]> {
    const { ano } = validar(filtroProgramacaoSchema, dados ?? {});
    const condicoes = [eq(programacaoAuditorias.empresaId, ctx.empresaId)];
    if (ano !== undefined)
      condicoes.push(eq(programacaoAuditorias.ano, ano));
    const linhas = await this.db
      .select()
      .from(programacaoAuditorias)
      .where(and(...condicoes))
      .orderBy(desc(programacaoAuditorias.ano), asc(programacaoAuditorias.setor));
    const realizadasPorItem = await this.realizadas(
      ctx,
      linhas.map((l) => l.id),
    );
    return linhas.map((l) => montar(l, realizadasPorItem.get(l.id) ?? []));
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<ItemDaProgramacao> {
    const linha = await this.buscar(ctx, dados?.id);
    const realizadasPorItem = await this.realizadas(ctx, [linha.id]);
    return montar(linha, realizadasPorItem.get(linha.id) ?? []);
  }

  async criar(ctx: Contexto, dados: unknown): Promise<ItemDaProgramacao> {
    const novo = validar(novoItemProgramacaoSchema, dados);
    const [linha] = await this.db
      .insert(programacaoAuditorias)
      .values({
        ...novo,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montar(linha!, []);
  }

  async atualizar(
    ctx: Contexto,
    dados: { id?: unknown; alteracoes?: unknown },
  ): Promise<ItemDaProgramacao> {
    const { versao, ...campos } = validar(
      atualizarItemProgramacaoSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.atualizadoEm.toISOString() !== versao)
      throw new ErroDeNegocio('CONFLITO', CONFLITO);
    const [linha] = await this.db
      .update(programacaoAuditorias)
      .set({ ...campos, atualizadoPor: ctx.usuarioId })
      .where(
        and(
          eq(programacaoAuditorias.id, atual.id),
          eq(programacaoAuditorias.empresaId, ctx.empresaId),
        ),
      )
      .returning();
    const realizadasPorItem = await this.realizadas(ctx, [linha!.id]);
    return montar(linha!, realizadasPorItem.get(linha!.id) ?? []);
  }

  async excluir(ctx: Contexto, dados: { id?: unknown }): Promise<{ ok: true }> {
    const atual = await this.buscar(ctx, dados?.id);
    const [vinculada] = await this.db
      .select({ id: auditorias.id })
      .from(auditorias)
      .where(
        and(
          eq(auditorias.empresaId, ctx.empresaId),
          eq(auditorias.programacaoId, atual.id),
        ),
      )
      .limit(1);
    if (vinculada)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Há auditorias vinculadas a este item. Desvincule-as antes de excluir.',
      );
    await this.db
      .delete(programacaoAuditorias)
      .where(
        and(
          eq(programacaoAuditorias.id, atual.id),
          eq(programacaoAuditorias.empresaId, ctx.empresaId),
        ),
      );
    return { ok: true };
  }

  private async buscar(ctx: Contexto, id: unknown): Promise<Linha> {
    const [linha] = isUuid(id)
      ? await this.db
          .select()
          .from(programacaoAuditorias)
          .where(
            and(
              eq(programacaoAuditorias.id, id),
              eq(programacaoAuditorias.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!linha)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Item da programação não encontrado.',
      );
    return linha;
  }

  /** Auditorias vinculadas a cada item (acompanhamento), agrupadas por `programacaoId`. */
  private async realizadas(
    ctx: Contexto,
    ids: string[],
  ): Promise<Map<string, AuditoriaDaProgramacao[]>> {
    const mapa = new Map<string, AuditoriaDaProgramacao[]>();
    if (ids.length === 0) return mapa;
    const linhas = await this.db
      .select({
        id: auditorias.id,
        numero: auditorias.numero,
        status: auditorias.status,
        dataInicio: auditorias.dataInicio,
        programacaoId: auditorias.programacaoId,
      })
      .from(auditorias)
      .where(
        and(
          eq(auditorias.empresaId, ctx.empresaId),
          inArray(auditorias.programacaoId, ids),
        ),
      )
      .orderBy(asc(auditorias.dataInicio));
    for (const a of linhas) {
      if (!a.programacaoId) continue;
      const lista = mapa.get(a.programacaoId) ?? [];
      lista.push({
        id: a.id,
        numero: a.numero,
        status: a.status as StatusAuditoria,
        mes: a.dataInicio ? Number(a.dataInicio.slice(5, 7)) : null,
      });
      mapa.set(a.programacaoId, lista);
    }
    return mapa;
  }
}

function montar(
  l: Linha,
  realizadas: AuditoriaDaProgramacao[],
): ItemDaProgramacao {
  return {
    id: l.id,
    ano: l.ano,
    setor: l.setor,
    normas: l.normas as Norma[],
    frequencia: l.frequencia as FrequenciaDeAuditoria,
    meses: l.meses,
    responsavel: l.responsavel,
    observacoes: l.observacoes,
    realizadas,
    versao: l.atualizadoEm.toISOString(),
  };
}
