import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { validar } from '@davinci/shared';
import {
  buscaSchema,
  padraoDeBusca,
  RESULTADOS_POR_TIPO,
  type Contexto,
  type ResultadoDaBusca,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { auditorias } from '../db/schema.js';

type Db = Database<typeof schema>;

/** Pesquisa geral: os registros deste serviço que batem com o termo (até {RESULTADOS_POR_TIPO} por tipo). */
@Injectable()
export class BuscaService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async buscar(ctx: Contexto, dados: unknown): Promise<ResultadoDaBusca[]> {
    const { termo } = validar(buscaSchema, dados);
    const p = padraoDeBusca(termo);
    const listas = await Promise.all([
      this.db
        .select()
        .from(auditorias)
        .where(
          and(
            eq(auditorias.empresaId, ctx.empresaId),
            or(
              ...[
                ilike(auditorias.numero, p),
                ilike(auditorias.escopo, p),
                ilike(auditorias.auditorLider, p),
              ],
            ),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'auditorias',
            tipo: 'Auditoria',
            titulo: `${l.numero} · ${l.escopo.slice(0, 120)}`,
            detalhe: l.auditorLider ?? null,
            href: `/auditorias/${l.id}`,
          })),
        ),
    ]);
    return listas.flat();
  }
}
