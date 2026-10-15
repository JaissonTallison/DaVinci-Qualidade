import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lte } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { hojeEmBrasilia, somarDias, validar } from '@davinci/shared';
import {
  horizonteSchema,
  DIAS_DO_PAINEL,
  prazo,
  type Contexto,
  type Prazo,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { mudancas } from '../db/schema.js';
import { SgiService } from '../sgi/sgi.service.js';

type Db = Database<typeof schema>;

/** Prazos do SGI: tratamento de riscos e oportunidades, análise crítica e mudança aprovada a implementar. */
@Injectable()
export class PrazosService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly sgi: SgiService,
  ) {}

  /** `dias`: horizonte pedido pelo painel (30, 90 ou 365). */
  async prazos(ctx: Contexto, dados?: unknown): Promise<Prazo[]> {
    const { dias } = validar(horizonteSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const limite = somarDias(hoje, dias);
    const [ros, resumo, aprovadas] = await Promise.all([
      this.sgi.listarRos(ctx, {}),
      this.sgi.resumo(ctx),
      this.db
        .select()
        .from(mudancas)
        .where(
          and(
            eq(mudancas.empresaId, ctx.empresaId),
            eq(mudancas.status, 'aprovada'),
            lte(mudancas.dataPrevista, limite),
          ),
        ),
    ]);
    const lista: Prazo[] = [
      ...ros
        .filter((r) => r.prazo && r.prazo <= limite)
        .map((r) =>
          prazo(
            {
              modulo: 'sgi',
              tipo: r.tipo === 'risco' ? 'Risco' : 'Oportunidade',
              descricao: `${r.processo} · ${r.descricao}`,
              data: r.prazo!,
              href: `/sgi/riscos-e-oportunidades/${r.id}`,
            },
            hoje,
          ),
        ),
      ...aprovadas.map((m) =>
        prazo(
          {
            modulo: 'sgi',
            tipo: 'Mudança',
            descricao: `${m.numero} · ${m.titulo}`,
            data: m.dataPrevista,
            href: `/sgi/mudancas/${m.id}`,
          },
          hoje,
        ),
      ),
    ];
    if (resumo.proximaAnaliseCritica && resumo.proximaAnaliseCritica <= limite)
      lista.push(
        prazo(
          {
            modulo: 'sgi',
            tipo: 'Análise crítica',
            descricao: 'Reunião de análise crítica pela direção',
            data: resumo.proximaAnaliseCritica,
            href: '/sgi/analises-criticas',
          },
          hoje,
        ),
      );
    return lista;
  }
}
