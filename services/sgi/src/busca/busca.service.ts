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
import { mudancas, objetivos, riscosOportunidades } from '../db/schema.js';

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
        .from(riscosOportunidades)
        .where(
          and(
            eq(riscosOportunidades.empresaId, ctx.empresaId),
            or(
              ...[
                ilike(riscosOportunidades.descricao, p),
                ilike(riscosOportunidades.processo, p),
              ],
            ),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'sgi',
            tipo: 'Risco ou oportunidade',
            titulo: l.descricao,
            detalhe: l.processo ?? null,
            href: `/sgi/riscos-e-oportunidades/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(mudancas)
        .where(
          and(
            eq(mudancas.empresaId, ctx.empresaId),
            or(...[ilike(mudancas.numero, p), ilike(mudancas.titulo, p)]),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'sgi',
            tipo: 'Mudança',
            titulo: `${l.numero} · ${l.titulo}`,
            detalhe: l.responsavel ?? null,
            href: `/sgi/mudancas/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(objetivos)
        .where(
          and(
            eq(objetivos.empresaId, ctx.empresaId),
            or(...[ilike(objetivos.nome, p), ilike(objetivos.indicador, p)]),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'sgi',
            tipo: 'Objetivo',
            titulo: l.nome,
            detalhe: l.indicador ?? null,
            href: '/sgi/objetivos',
          })),
        ),
    ]);
    return listas.flat();
  }
}
