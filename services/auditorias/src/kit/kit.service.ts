import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  validar,
} from '@davinci/shared';
import {
  isUuid,
  marcarItemDoKitSchema,
  MOMENTOS_DO_KIT,
  type Contexto,
  type KitPreAuditoria,
  type StatusDoItemDoKit,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { auditorias, itensDoKit } from '../db/schema.js';
import { KIT_PRE_AUDITORIA } from './catalogo.js';

type Db = Database<typeof schema>;

/** Kit pré-auditoria: o catálogo é fixo; por auditoria se grava só o status de cada item. */
@Injectable()
export class KitService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async obter(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<KitPreAuditoria> {
    const a = await this.auditoria(ctx, dados?.id);
    const marcados = await this.db
      .select()
      .from(itensDoKit)
      .where(eq(itensDoKit.auditoriaId, a.id));
    const hoje = hojeEmBrasilia();
    const encerrada = a.status === 'concluida' || a.status === 'cancelada';
    const itens = KIT_PRE_AUDITORIA.map((i) => {
      const status = (marcados.find((m) => m.codigo === i.codigo)?.status ??
        'pendente') as StatusDoItemDoKit;
      const prazo = somarDias(a.dataInicio, -MOMENTOS_DO_KIT[i.momento].dias);
      return {
        ...i,
        status,
        prazo,
        atrasado: !encerrada && status !== 'concluido' && prazo < hoje,
      };
    });
    const concluidos = itens.filter((i) => i.status === 'concluido').length;
    return {
      auditoriaId: a.id,
      itens,
      concluidos,
      total: itens.length,
      prontidao: Math.round((concluidos / itens.length) * 100),
      somenteLeitura: encerrada,
    };
  }

  async marcar(
    ctx: Contexto,
    dados: { id?: unknown; alteracoes?: unknown },
  ): Promise<KitPreAuditoria> {
    const { codigo, status } = validar(
      marcarItemDoKitSchema,
      dados?.alteracoes,
    );
    const a = await this.auditoria(ctx, dados?.id);
    if (a.status === 'concluida' || a.status === 'cancelada')
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Auditoria encerrada: o kit não muda mais.',
      );
    if (!KIT_PRE_AUDITORIA.some((i) => i.codigo === codigo))
      throw new ErroDeNegocio('DADOS_INVALIDOS', 'Item do kit desconhecido.');
    await this.db
      .insert(itensDoKit)
      .values({
        auditoriaId: a.id,
        codigo,
        status,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .onConflictDoUpdate({
        target: [itensDoKit.auditoriaId, itensDoKit.codigo],
        set: { status, atualizadoPor: ctx.usuarioId, atualizadoEm: new Date() },
      });
    return this.obter(ctx, { id: a.id });
  }

  private async auditoria(ctx: Contexto, id: unknown) {
    const [a] = isUuid(id)
      ? await this.db
          .select()
          .from(auditorias)
          .where(
            and(eq(auditorias.id, id), eq(auditorias.empresaId, ctx.empresaId)),
          )
      : [];
    if (!a)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Auditoria não encontrada.');
    return a;
  }
}
