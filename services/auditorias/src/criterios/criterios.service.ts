import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  isUuid,
  novoCriterioSchema,
  type Contexto,
  type CriterioProprio,
  type TipoDeCriterio,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { criteriosProprios } from '../db/schema.js';

type Db = Database<typeof schema>;

/** Critérios próprios de auditoria da empresa (Minha biblioteca). */
@Injectable()
export class CriteriosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto): Promise<CriterioProprio[]> {
    const linhas = await this.db
      .select()
      .from(criteriosProprios)
      .where(eq(criteriosProprios.empresaId, ctx.empresaId))
      .orderBy(asc(criteriosProprios.nome));
    return linhas.map(montar);
  }

  async criar(ctx: Contexto, dados: unknown): Promise<CriterioProprio> {
    const n = validar(novoCriterioSchema, dados);
    const [l] = await this.db
      .insert(criteriosProprios)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montar(l!);
  }

  async excluir(ctx: Contexto, dados: { id?: unknown }): Promise<{ ok: true }> {
    const id = dados?.id;
    const [l] = isUuid(id)
      ? await this.db
          .delete(criteriosProprios)
          .where(
            and(
              eq(criteriosProprios.id, id),
              eq(criteriosProprios.empresaId, ctx.empresaId),
            ),
          )
          .returning()
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Critério não encontrado.');
    return { ok: true };
  }
}

function montar(l: typeof criteriosProprios.$inferSelect): CriterioProprio {
  return {
    id: l.id,
    tipo: l.tipo as TipoDeCriterio,
    nome: l.nome,
    referencia: l.referencia,
    requisitos: l.requisitos,
  };
}
