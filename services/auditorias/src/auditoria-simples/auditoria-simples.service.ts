import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  atualizarAuditoriaSimplesSchema,
  isUuid,
  novaAuditoriaSimplesSchema,
  type AuditoriaSimples,
  type AuditoriaSimplesResumo,
  type Contexto,
  type LinhaDaAuditoriaSimples,
  type NovaAuditoriaSimples,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { auditoriasSimples as tb, sequencias } from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Auditoria interna simples: documento (cabeçalho + tabela por setor), à parte da auditoria completa. */
@Injectable()
export class AuditoriaSimplesService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto): Promise<AuditoriaSimplesResumo[]> {
    const linhas = await this.db
      .select()
      .from(tb)
      .where(eq(tb.empresaId, ctx.empresaId))
      .orderBy(desc(tb.data), desc(tb.criadoEm));
    return linhas.map((l) => ({
      id: l.id,
      numero: l.numero,
      data: l.data,
      unidade: l.unidade,
      setores: (l.linhas as unknown[]).length,
    }));
  }

  async obter(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<AuditoriaSimples> {
    return montar(await this.linha(ctx, dados?.id));
  }

  async criar(ctx: Contexto, dados: unknown): Promise<AuditoriaSimples> {
    const n = validar(novaAuditoriaSimplesSchema, dados);
    const ano = Number(n.data.slice(0, 4));
    return this.db.transaction(async (tx) => {
      const [{ ultimo }] = await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `AIS-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo });
      const [l] = await tx
        .insert(tb)
        .values({
          ...n,
          linhas: normalizar(n.linhas),
          numero: `AIS-${ano}-${String(ultimo!).padStart(3, '0')}`,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montar(l!);
    });
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<AuditoriaSimples> {
    const { versao, ...n } = validar(
      atualizarAuditoriaSimplesSchema,
      dados?.alteracoes,
    );
    if (!isUuid(dados?.id))
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Auditoria não encontrada.');
    const [l] = await this.db
      .update(tb)
      .set({ ...n, linhas: normalizar(n.linhas), atualizadoPor: ctx.usuarioId })
      .where(
        and(
          eq(tb.id, dados.id),
          eq(tb.empresaId, ctx.empresaId),
          eq(tb.atualizadoEm, new Date(versao)),
        ),
      )
      .returning();
    if (!l)
      throw new ErroDeNegocio(
        'CONFLITO',
        'Este documento foi alterado por outra pessoa. Recarregue a página.',
      );
    return montar(l);
  }

  async excluir(ctx: Contexto, dados: { id?: unknown }): Promise<{ ok: true }> {
    const id = dados?.id;
    const [l] = isUuid(id)
      ? await this.db
          .delete(tb)
          .where(and(eq(tb.id, id), eq(tb.empresaId, ctx.empresaId)))
          .returning()
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Auditoria não encontrada.');
    return { ok: true };
  }

  private async linha(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(tb)
          .where(and(eq(tb.id, id), eq(tb.empresaId, ctx.empresaId)))
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Auditoria não encontrada.');
    return l;
  }
}

/** Campos vazios viram `null` (consistência na gravação do jsonb). */
function normalizar(
  linhas: NovaAuditoriaSimples['linhas'],
): LinhaDaAuditoriaSimples[] {
  return (linhas ?? []).map((x) => ({
    setor: x.setor,
    comentarios: x.comentarios ?? null,
    pontosPositivos: x.pontosPositivos ?? null,
    observacoes: x.observacoes ?? null,
    naoConformidade: x.naoConformidade ?? null,
  }));
}

function montar(l: typeof tb.$inferSelect): AuditoriaSimples {
  return {
    id: l.id,
    numero: l.numero,
    data: l.data,
    horario: l.horario,
    unidade: l.unidade,
    setoresEnvolvidos: l.setoresEnvolvidos,
    auditores: l.auditores,
    areaFoco: l.areaFoco,
    linhas: l.linhas as LinhaDaAuditoriaSimples[],
    versao: l.atualizadoEm.toISOString(),
  };
}
