import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, lte, ne, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import {
  agoraEmBrasilia,
  hojeEmBrasilia,
  somarDias,
  validar,
} from '@davinci/shared';
import {
  horizonteSchema,
  DIAS_DO_PAINEL,
  prazo,
  TIPOS_DOC_TERCEIRO,
  type Contexto,
  type Prazo,
  type TipoDocTerceiro,
} from '@davinci/types';
import { proximoDiaUtil } from '../acidentes/regras.js';
import * as schema from '../db/schema.js';
import {
  acidentes,
  documentosTerceiros,
  entregasEpi,
  epis,
  permissoesDeTrabalho as pts,
  riscos,
  terceiros,
} from '../db/schema.js';
import { PgrService } from '../pgr/pgr.service.js';
import { vigentes } from '../terceiros/regras.js';

type Db = Database<typeof schema>;

/** Prazos da Segurança: CAT, troca de EPI, CA, ação do PGR, PT sem encerramento e documento de terceiro. */
@Injectable()
export class PrazosService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly pgr: PgrService,
  ) {}

  /** `dias`: horizonte pedido pelo painel (30, 90 ou 365). */
  async prazos(ctx: Contexto, dados?: unknown): Promise<Prazo[]> {
    const { dias } = validar(horizonteSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const limite = somarDias(hoje, dias);
    const emp = ctx.empresaId;
    const [semCat, trocas, cas, listaPgr, ptsAbertas, docs] = await Promise.all(
      [
        this.db
          .select({
            id: acidentes.id,
            numero: acidentes.numero,
            data: acidentes.data,
            acidentado: acidentes.acidentado,
          })
          .from(acidentes)
          .where(
            and(
              eq(acidentes.empresaId, emp),
              ne(acidentes.status, 'cancelado'),
              sql`${acidentes.tipo} IN ('com_afastamento', 'sem_afastamento')`,
              isNull(acidentes.catNumero),
            ),
          ),
        this.db
          .select({
            funcionarioId: entregasEpi.funcionarioId,
            nome: entregasEpi.funcionarioNome,
            epi: entregasEpi.epiNome,
            proximaTroca: entregasEpi.proximaTroca,
          })
          .from(entregasEpi)
          .where(
            and(
              eq(entregasEpi.empresaId, emp),
              isNull(entregasEpi.devolvidoEm),
              isNull(entregasEpi.motivoAnulacao),
              lte(entregasEpi.proximaTroca, limite),
            ),
          ),
        this.db
          .select()
          .from(epis)
          .where(
            and(
              eq(epis.empresaId, emp),
              eq(epis.ativo, true),
              lte(epis.validadeCa, limite),
            ),
          ),
        this.pgr.listar(ctx, {}),
        this.db
          .select()
          .from(pts)
          .where(and(eq(pts.empresaId, emp), eq(pts.status, 'liberada'))),
        this.db
          .select({
            d: documentosTerceiros,
            razaoSocial: terceiros.razaoSocial,
            fimContrato: terceiros.fimContrato,
          })
          .from(documentosTerceiros)
          .innerJoin(
            terceiros,
            eq(terceiros.id, documentosTerceiros.terceiroId),
          )
          .where(eq(documentosTerceiros.empresaId, emp)),
      ],
    );
    const agora = agoraEmBrasilia();
    const porTerceiro = new Map<
      string,
      {
        razaoSocial: string;
        fimContrato: string | null;
        docs: (typeof docs)[number]['d'][];
      }
    >();
    for (const x of docs) {
      const t = porTerceiro.get(x.d.terceiroId) ?? {
        razaoSocial: x.razaoSocial,
        fimContrato: x.fimContrato,
        docs: [],
      };
      t.docs.push(x.d);
      porTerceiro.set(x.d.terceiroId, t);
    }
    const lista: Prazo[] = [
      ...semCat
        .map((a) => ({ a, p: proximoDiaUtil(a.data) }))
        .filter(({ p }) => p <= limite)
        .map(({ a, p }) =>
          prazo(
            {
              modulo: 'seguranca',
              tipo: 'CAT',
              descricao: `${a.numero} · ${a.acidentado}`,
              data: p,
              href: `/seguranca/acidentes/${a.id}`,
            },
            hoje,
          ),
        ),
      ...trocas.map((t) =>
        prazo(
          {
            modulo: 'seguranca',
            tipo: 'Troca de EPI',
            descricao: `${t.epi} · ${t.nome}`,
            data: t.proximaTroca!,
            href: `/cadastros/funcionarios/${t.funcionarioId}`,
          },
          hoje,
        ),
      ),
      ...cas.map((e) =>
        prazo(
          {
            modulo: 'seguranca',
            tipo: 'CA de EPI',
            descricao: `${e.nome} · CA ${e.ca}`,
            data: e.validadeCa,
            href: `/seguranca/epis/${e.id}`,
          },
          hoje,
        ),
      ),
      ...listaPgr
        .filter(
          (r) =>
            r.prazo &&
            r.prazo <= limite &&
            (r.nivel === 'alto' || r.nivel === 'critico'),
        )
        .map((r) =>
          prazo(
            {
              modulo: 'seguranca',
              tipo: 'Ação do PGR',
              descricao: `${r.local} · ${r.perigo}`,
              data: r.prazo!,
              href: `/seguranca/pgr/${r.id}`,
            },
            hoje,
          ),
        ),
      ...ptsAbertas
        .filter((p) => p.fim <= agora)
        .map((p) =>
          prazo(
            {
              modulo: 'seguranca',
              tipo: 'PT sem encerramento',
              descricao: `${p.numero} · ${p.local}`,
              data: p.fim.slice(0, 10),
              href: `/seguranca/permissoes-de-trabalho/${p.id}`,
            },
            hoje,
          ),
        ),
    ];
    for (const [id, t] of porTerceiro) {
      if (t.fimContrato && t.fimContrato < hoje) continue;
      for (const d of vigentes(t.docs).values())
        if (d.validade <= limite)
          lista.push(
            prazo(
              {
                modulo: 'seguranca',
                tipo: 'Documento de terceiro',
                descricao: `${t.razaoSocial} · ${TIPOS_DOC_TERCEIRO[d.tipo as TipoDocTerceiro]}`,
                data: d.validade,
                href: `/seguranca/terceiros/${id}`,
              },
              hoje,
            ),
          );
    }
    return lista;
  }
}
