import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { validar } from '@davinci/shared';
import {
  buscaSchema,
  padraoDeBusca,
  PILARES,
  RESULTADOS_POR_TIPO,
  type Contexto,
  type Pilar,
  type ResultadoDaBusca,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { temas } from '../db/schema.js';

type Db = Database<typeof schema>;

/** Pesquisa geral: temas ESG por nome, meta ou responsável. */
@Injectable()
export class BuscaService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async buscar(ctx: Contexto, dados: unknown): Promise<ResultadoDaBusca[]> {
    const { termo } = validar(buscaSchema, dados);
    const p = padraoDeBusca(termo);
    const ts = await this.db
      .select()
      .from(temas)
      .where(
        and(
          eq(temas.empresaId, ctx.empresaId),
          or(
            ilike(temas.nome, p),
            ilike(temas.meta, p),
            ilike(temas.responsavel, p),
          ),
        ),
      )
      .limit(RESULTADOS_POR_TIPO);
    return ts.map((t): ResultadoDaBusca => ({
      modulo: 'esg',
      tipo: 'Tema ESG',
      titulo: t.nome,
      detalhe: PILARES[t.pilar as Pilar],
      href: `/esg/temas/${t.id}`,
    }));
  }
}
