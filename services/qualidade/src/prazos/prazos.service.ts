import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lte, notInArray } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { hojeEmBrasilia, somarDias, validar } from '@davinci/shared';
import {
  horizonteSchema,
  DIAS_DO_PAINEL,
  prazo,
  type Contexto,
  type Prazo,
} from '@davinci/types';
import { CalibracaoService } from '../calibracao/calibracao.service.js';
import * as schema from '../db/schema.js';
import {
  naoConformidades as ncs,
  planosAcao,
  planosAcaoTarefas as tarefas,
} from '../db/schema.js';

type Db = Database<typeof schema>;

/** Prazos da Qualidade para o painel: NC em aberto, tarefa pendente e calibração. */
@Injectable()
export class PrazosService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly calibracao: CalibracaoService,
  ) {}

  /** `dias`: horizonte pedido pelo painel (30, 90 ou 365). */
  async prazos(ctx: Contexto, dados?: unknown): Promise<Prazo[]> {
    const { dias } = validar(horizonteSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const limite = somarDias(hoje, dias);
    const [abertas, pendentes, instrumentos] = await Promise.all([
      this.db
        .select({
          id: ncs.id,
          numero: ncs.numero,
          titulo: ncs.titulo,
          prazo: ncs.prazo,
        })
        .from(ncs)
        .where(
          and(
            eq(ncs.empresaId, ctx.empresaId),
            notInArray(ncs.status, ['encerrada', 'cancelada']),
            lte(ncs.prazo, limite),
          ),
        ),
      this.db
        .select({
          planoId: planosAcao.id,
          numero: planosAcao.numero,
          oQue: tarefas.oQue,
          prazo: tarefas.prazo,
        })
        .from(tarefas)
        .innerJoin(planosAcao, eq(planosAcao.id, tarefas.planoId))
        .where(
          and(
            eq(tarefas.empresaId, ctx.empresaId),
            eq(tarefas.situacao, 'pendente'),
            notInArray(planosAcao.status, ['cancelado', 'concluido']),
            lte(tarefas.prazo, limite),
          ),
        ),
      this.calibracao.listar(ctx, { porPagina: 100 }),
    ]);
    return [
      ...abertas.map((n) =>
        prazo(
          {
            modulo: 'qualidade',
            tipo: 'NC',
            descricao: `${n.numero} · ${n.titulo}`,
            data: n.prazo,
            href: `/qualidade/nao-conformidades/${n.id}`,
          },
          hoje,
        ),
      ),
      ...pendentes.map((t) =>
        prazo(
          {
            modulo: 'qualidade',
            tipo: 'Tarefa de plano',
            descricao: `${t.numero} · ${t.oQue}`,
            data: t.prazo,
            href: `/qualidade/planos-de-acao/${t.planoId}`,
          },
          hoje,
        ),
      ),
      ...instrumentos.itens
        .filter(
          (i) =>
            i.proximaCalibracao &&
            i.proximaCalibracao <= limite &&
            i.situacao !== 'fora_de_uso' &&
            i.situacao !== 'reprovado',
        )
        .map((i) =>
          prazo(
            {
              modulo: 'qualidade',
              tipo: 'Calibração',
              descricao: `${i.tag} · ${i.descricao}`,
              data: i.proximaCalibracao!,
              href: `/qualidade/calibracao/${i.id}`,
            },
            hoje,
          ),
        ),
    ];
  }
}
