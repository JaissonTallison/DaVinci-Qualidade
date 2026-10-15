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
import {
  inspecoes,
  instrumentos,
  naoConformidades,
  planosAcao,
} from '../db/schema.js';

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
        .from(naoConformidades)
        .where(
          and(
            eq(naoConformidades.empresaId, ctx.empresaId),
            or(
              ...[
                ilike(naoConformidades.numero, p),
                ilike(naoConformidades.titulo, p),
              ],
            ),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'qualidade',
            tipo: 'Não conformidade',
            titulo: `${l.numero} · ${l.titulo}`,
            detalhe: null,
            href: `/qualidade/nao-conformidades/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(planosAcao)
        .where(
          and(
            eq(planosAcao.empresaId, ctx.empresaId),
            or(...[ilike(planosAcao.numero, p), ilike(planosAcao.titulo, p)]),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'qualidade',
            tipo: 'Plano de ação',
            titulo: `${l.numero} · ${l.titulo}`,
            detalhe: l.responsavel ?? null,
            href: `/qualidade/planos-de-acao/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(inspecoes)
        .where(
          and(
            eq(inspecoes.empresaId, ctx.empresaId),
            or(
              ...[
                ilike(inspecoes.numero, p),
                ilike(inspecoes.objeto, p),
                ilike(inspecoes.lote, p),
              ],
            ),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'qualidade',
            tipo: 'Inspeção',
            titulo: `${l.numero} · ${l.objeto}`,
            detalhe: l.lote ?? null,
            href: `/qualidade/inspecoes/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(instrumentos)
        .where(
          and(
            eq(instrumentos.empresaId, ctx.empresaId),
            or(
              ...[ilike(instrumentos.tag, p), ilike(instrumentos.descricao, p)],
            ),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'qualidade',
            tipo: 'Instrumento',
            titulo: `${l.tag} · ${l.descricao}`,
            detalhe: l.local ?? null,
            href: `/qualidade/calibracao/${l.id}`,
          })),
        ),
    ]);
    return listas.flat();
  }
}
