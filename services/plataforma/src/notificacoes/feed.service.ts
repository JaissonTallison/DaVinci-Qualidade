import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import type {
  Contexto,
  FiltroDeNotificacoes,
  ModuloDaBusca,
  Notificacao,
  NovaNotificacao,
  ResumoDeNotificacoes,
  TipoDeNotificacao,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { notificacoes } from '../db/schema.js';

/** Central de notificações: cria (por evento dos módulos), lista por aba, conta não lidas e marca lidas. */
@Injectable()
export class FeedDeNotificacoesService {
  constructor(@Inject(DATABASE) private readonly db: Database<typeof schema>) {}

  async criar(dados: NovaNotificacao): Promise<void> {
    await this.db.insert(notificacoes).values({
      empresaId: dados.empresaId,
      usuarioId: dados.usuarioId,
      tipo: dados.tipo,
      titulo: dados.titulo,
      descricao: dados.descricao ?? null,
      modulo: dados.modulo ?? null,
      href: dados.href ?? null,
      mencao: dados.mencao ?? false,
    });
  }

  async listar(
    ctx: Contexto,
    filtro: FiltroDeNotificacoes,
  ): Promise<ResumoDeNotificacoes> {
    if (!ctx.usuarioId) return { itens: [], naoLidas: 0 };
    const base = and(
      eq(notificacoes.empresaId, ctx.empresaId),
      eq(notificacoes.usuarioId, ctx.usuarioId),
    );
    const where =
      filtro === 'nao-lidas'
        ? and(base, eq(notificacoes.lida, false))
        : filtro === 'mencoes'
          ? and(base, eq(notificacoes.mencao, true))
          : base;
    const linhas = await this.db
      .select()
      .from(notificacoes)
      .where(where)
      .orderBy(desc(notificacoes.criadoEm))
      .limit(30);
    return {
      itens: linhas.map((l) => this.mapear(l)),
      naoLidas: await this.contarNaoLidas(ctx),
    };
  }

  async contar(ctx: Contexto): Promise<{ naoLidas: number }> {
    return { naoLidas: await this.contarNaoLidas(ctx) };
  }

  async marcarLida(ctx: Contexto, id: string): Promise<void> {
    if (!ctx.usuarioId) return;
    await this.db
      .update(notificacoes)
      .set({ lida: true })
      .where(
        and(
          eq(notificacoes.id, id),
          eq(notificacoes.empresaId, ctx.empresaId),
          eq(notificacoes.usuarioId, ctx.usuarioId),
        ),
      );
  }

  async marcarTodas(ctx: Contexto): Promise<void> {
    if (!ctx.usuarioId) return;
    await this.db
      .update(notificacoes)
      .set({ lida: true })
      .where(
        and(
          eq(notificacoes.empresaId, ctx.empresaId),
          eq(notificacoes.usuarioId, ctx.usuarioId),
          eq(notificacoes.lida, false),
        ),
      );
  }

  private async contarNaoLidas(ctx: Contexto): Promise<number> {
    if (!ctx.usuarioId) return 0;
    const [linha] = await this.db
      .select({ n: count() })
      .from(notificacoes)
      .where(
        and(
          eq(notificacoes.empresaId, ctx.empresaId),
          eq(notificacoes.usuarioId, ctx.usuarioId),
          eq(notificacoes.lida, false),
        ),
      );
    return linha?.n ?? 0;
  }

  private mapear(l: typeof notificacoes.$inferSelect): Notificacao {
    return {
      id: l.id,
      tipo: l.tipo as TipoDeNotificacao,
      titulo: l.titulo,
      descricao: l.descricao,
      modulo: (l.modulo as ModuloDaBusca | null) ?? null,
      href: l.href,
      lida: l.lida,
      criadaEm: l.criadoEm.toISOString(),
    };
  }
}
