import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { validar } from '@davinci/shared';
import {
  buscaSchema,
  padraoDeBusca,
  RESULTADOS_POR_TIPO,
  TIPOS_LICENCA,
  type Contexto,
  type ResultadoDaBusca,
  type TipoLicenca,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { aspectos, licencas, requisitos, residuos } from '../db/schema.js';

type Db = Database<typeof schema>;

/** Pesquisa geral: licenças, requisitos legais, aspectos e resíduos. */
@Injectable()
export class BuscaService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async buscar(ctx: Contexto, dados: unknown): Promise<ResultadoDaBusca[]> {
    const { termo } = validar(buscaSchema, dados);
    const p = padraoDeBusca(termo);
    const [ls, rs, as, res] = await Promise.all([
      this.db
        .select()
        .from(licencas)
        .where(
          and(
            eq(licencas.empresaId, ctx.empresaId),
            or(
              ilike(licencas.numero, p),
              ilike(licencas.orgao, p),
              ilike(licencas.descricao, p),
            ),
          ),
        )
        .limit(RESULTADOS_POR_TIPO),
      this.db
        .select()
        .from(requisitos)
        .where(
          and(
            eq(requisitos.empresaId, ctx.empresaId),
            or(ilike(requisitos.norma, p), ilike(requisitos.tema, p)),
          ),
        )
        .limit(RESULTADOS_POR_TIPO),
      this.db
        .select()
        .from(aspectos)
        .where(
          and(
            eq(aspectos.empresaId, ctx.empresaId),
            or(ilike(aspectos.atividade, p), ilike(aspectos.aspecto, p)),
          ),
        )
        .limit(RESULTADOS_POR_TIPO),
      this.db
        .select()
        .from(residuos)
        .where(
          and(eq(residuos.empresaId, ctx.empresaId), ilike(residuos.nome, p)),
        )
        .limit(RESULTADOS_POR_TIPO),
    ]);
    return [
      ...ls.map((l): ResultadoDaBusca => ({
        modulo: 'ambiental',
        tipo: 'Licença',
        titulo: `${TIPOS_LICENCA[l.tipo as TipoLicenca]} nº ${l.numero}`,
        detalhe: l.orgao,
        href: `/ambiental/licencas/${l.id}`,
      })),
      ...rs.map((r): ResultadoDaBusca => ({
        modulo: 'ambiental',
        tipo: 'Requisito legal',
        titulo: r.norma,
        detalhe: r.tema,
        href: `/ambiental/requisitos/${r.id}`,
      })),
      ...as.map((a): ResultadoDaBusca => ({
        modulo: 'ambiental',
        tipo: 'Aspecto ambiental',
        titulo: `${a.atividade} · ${a.aspecto}`,
        detalhe: a.impacto,
        href: `/ambiental/aspectos/${a.id}`,
      })),
      ...res.map((r): ResultadoDaBusca => ({
        modulo: 'ambiental',
        tipo: 'Resíduo',
        titulo: r.nome,
        detalhe: r.destinacao,
        href: '/ambiental/residuos',
      })),
    ];
  }
}
