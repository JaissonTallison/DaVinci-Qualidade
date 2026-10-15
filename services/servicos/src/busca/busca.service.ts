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
import { ordensServico } from '../db/schema.js';

type Db = Database<typeof schema>;

/** Pesquisa geral: ordens de serviço por número, título ou cliente. */
@Injectable()
export class BuscaService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async buscar(ctx: Contexto, dados: unknown): Promise<ResultadoDaBusca[]> {
    const { termo } = validar(buscaSchema, dados);
    const p = padraoDeBusca(termo);
    const ls = await this.db
      .select()
      .from(ordensServico)
      .where(
        and(
          eq(ordensServico.empresaId, ctx.empresaId),
          or(
            ilike(ordensServico.numero, p),
            ilike(ordensServico.titulo, p),
            ilike(ordensServico.clienteNome, p),
          ),
        ),
      )
      .limit(RESULTADOS_POR_TIPO);
    return ls.map((l) => ({
      modulo: 'servicos',
      tipo: 'Ordem de serviço',
      titulo: `${l.numero} · ${l.titulo}`,
      detalhe: l.clienteNome,
      href: `/servicos/ordens/${l.id}`,
    }));
  }
}
