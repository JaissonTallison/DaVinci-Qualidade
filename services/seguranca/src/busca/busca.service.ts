import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { validar } from '@davinci/shared';
import {
  buscaSchema,
  normalizarDocumento,
  padraoDeBusca,
  RESULTADOS_POR_TIPO,
  type Contexto,
  type ResultadoDaBusca,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  acidentes,
  epis,
  permissoesDeTrabalho,
  registrosSst,
  riscos,
  terceiros,
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
        .from(acidentes)
        .where(
          and(
            eq(acidentes.empresaId, ctx.empresaId),
            or(
              ...[
                ilike(acidentes.numero, p),
                ilike(acidentes.acidentado, p),
                ilike(acidentes.local, p),
              ],
            ),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'seguranca',
            tipo: 'Acidente',
            titulo: `${l.numero} · ${l.local}`,
            detalhe: l.acidentado ?? null,
            href: `/seguranca/acidentes/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(permissoesDeTrabalho)
        .where(
          and(
            eq(permissoesDeTrabalho.empresaId, ctx.empresaId),
            or(
              ...[
                ilike(permissoesDeTrabalho.numero, p),
                ilike(permissoesDeTrabalho.local, p),
                ilike(permissoesDeTrabalho.servico, p),
              ],
            ),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'seguranca',
            tipo: 'Permissão de trabalho',
            titulo: `${l.numero} · ${l.local}`,
            detalhe: l.servico ?? null,
            href: `/seguranca/permissoes-de-trabalho/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(terceiros)
        .where(
          and(
            eq(terceiros.empresaId, ctx.empresaId),
            or(
              ...[
                ilike(terceiros.razaoSocial, p),
                ilike(terceiros.cnpj, p),
                ilike(terceiros.servico, p),
              ],
            ),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'seguranca',
            tipo: 'Terceiro',
            titulo: l.razaoSocial,
            detalhe: l.servico ?? null,
            href: `/seguranca/terceiros/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(riscos)
        .where(
          and(
            eq(riscos.empresaId, ctx.empresaId),
            or(...[ilike(riscos.perigo, p), ilike(riscos.local, p)]),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'seguranca',
            tipo: 'Risco do PGR',
            titulo: l.perigo,
            detalhe: l.local ?? null,
            href: `/seguranca/pgr/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(registrosSst)
        .where(
          and(
            eq(registrosSst.empresaId, ctx.empresaId),
            or(...[ilike(registrosSst.tema, p)]),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'seguranca',
            tipo: 'Registro de segurança',
            titulo: l.tema,
            detalhe: l.responsavel ?? null,
            href: `/seguranca/registros/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(epis)
        .where(
          and(
            eq(epis.empresaId, ctx.empresaId),
            or(...[ilike(epis.nome, p), ilike(epis.ca, p)]),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'seguranca',
            tipo: 'EPI',
            titulo: `${l.nome} · CA ${l.ca}`,
            detalhe: null,
            href: `/seguranca/epis/${l.id}`,
          })),
        ),
    ]);
    return listas.flat();
  }
}
