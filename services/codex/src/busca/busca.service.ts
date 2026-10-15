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
import { funcionarios, treinamentos } from '../db/schema.js';

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
        .from(funcionarios)
        .where(
          and(
            eq(funcionarios.empresaId, ctx.empresaId),
            or(
              ...[
                ilike(funcionarios.nome, p),
                ilike(funcionarios.matricula, p),
                ilike(funcionarios.cpf, p),
              ],
            ),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'funcionarios',
            tipo: 'Funcionário',
            titulo: l.nome,
            detalhe: `Matrícula ${l.matricula}`,
            href: `/cadastros/funcionarios/${l.id}`,
          })),
        ),
      this.db
        .select()
        .from(treinamentos)
        .where(
          and(
            eq(treinamentos.empresaId, ctx.empresaId),
            or(...[ilike(treinamentos.nome, p), ilike(treinamentos.norma, p)]),
          ),
        )
        .limit(RESULTADOS_POR_TIPO)
        .then((ls) =>
          ls.map((l): ResultadoDaBusca => ({
            modulo: 'funcionarios',
            tipo: 'Treinamento',
            titulo: l.nome,
            detalhe: l.norma ?? null,
            href: '/cadastros/treinamentos',
          })),
        ),
    ]);
    return listas.flat();
  }
}
