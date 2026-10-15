import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, lte } from 'drizzle-orm';
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
import { ordensServico as os } from '../db/schema.js';
import { ServicosService } from '../servicos/servicos.service.js';

type Db = Database<typeof schema>;

/** Prazos de Serviços: OS em aberto e reavaliação de fornecedor. */
@Injectable()
export class PrazosService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly servicos: ServicosService,
  ) {}

  /** `dias`: horizonte pedido pelo painel (30, 90 ou 365). */
  async prazos(ctx: Contexto, dados?: unknown): Promise<Prazo[]> {
    const { dias } = validar(horizonteSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const limite = somarDias(hoje, dias);
    const [abertas, avaliacoes] = await Promise.all([
      this.db
        .select()
        .from(os)
        .where(
          and(
            eq(os.empresaId, ctx.empresaId),
            inArray(os.status, ['aberta', 'em_execucao']),
            lte(os.prazo, limite),
          ),
        ),
      this.servicos.listarAvaliacoes(ctx),
    ]);
    return [
      ...abertas.map((o) =>
        prazo(
          {
            modulo: 'servicos',
            tipo: 'Ordem de serviço',
            descricao: `${o.numero} · ${o.titulo} · ${o.clienteNome}`,
            data: o.prazo,
            href: `/servicos/ordens/${o.id}`,
          },
          hoje,
        ),
      ),
      ...avaliacoes
        .filter((a) => a.vigente && a.proximaAvaliacao <= limite)
        .map((a) =>
          prazo(
            {
              modulo: 'servicos',
              tipo: 'Avaliação de fornecedor',
              descricao: a.fornecedorNome,
              data: a.proximaAvaliacao,
              href: '/servicos/fornecedores',
            },
            hoje,
          ),
        ),
    ];
  }
}
