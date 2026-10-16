import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  atualizarFmeaSchema,
  atualizarPlanoDeControleSchema,
  atualizarPpapSchema,
  decidirPpapSchema,
  ELEMENTOS_DO_PPAP,
  exigenciaDoElemento,
  isUuid,
  novoFmeaSchema,
  novoPlanoDeControleSchema,
  novoPpapSchema,
  pendenciasDoPpap,
  prioridadeDeAcao,
  submeterPpapSchema,
  type ClassificacaoEspecial,
  type Contexto,
  type ElementoDoPpap,
  type FaseDoPlanoDeControle,
  type Fmea,
  type FmeaResumo,
  type LinhaDoFmea,
  type LinhaDoPlanoDeControle,
  type NivelDoPpap,
  type PlanoDeControle,
  type PlanoDeControleResumo,
  type Ppap,
  type PpapResumo,
  type StatusDoElemento,
  type StatusDoPpap,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { fmeas, planosDeControle, ppaps, sequencias } from '../db/schema.js';
import { hojeEmBrasilia } from '../datas.js';

type Db = Database<typeof schema>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type ComId = { id?: unknown; alteracoes?: unknown };
type LinhaFmea = typeof fmeas.$inferSelect;
type LinhaPlano = typeof planosDeControle.$inferSelect;
type LinhaPpap = typeof ppaps.$inferSelect;
type ElementosGravados = Partial<
  Record<ElementoDoPpap, { status: StatusDoElemento; observacao: string }>
>;

const CONFLITO =
  'Este registro foi alterado por outra pessoa. Recarregue a página para ver a versão atual.';

/** FMEA de processo, plano de controle e PPAP (IATF 16949). */
@Injectable()
export class AutomotivoService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  // ---------------------------------------------------------------- FMEA

  async listarFmeas(ctx: Contexto): Promise<FmeaResumo[]> {
    const linhas = await this.db
      .select()
      .from(fmeas)
      .where(eq(fmeas.empresaId, ctx.empresaId))
      .orderBy(desc(fmeas.atualizadoEm));
    return linhas.map((l) => {
      const { linhas: _, ...resumo } = montarFmea(l);
      return resumo;
    });
  }

  async obterFmea(ctx: Contexto, dados: { id?: unknown }): Promise<Fmea> {
    return montarFmea(
      await this.buscar(ctx, fmeas, dados?.id, 'FMEA não encontrado.'),
    );
  }

  async criarFmea(ctx: Contexto, dados: unknown): Promise<Fmea> {
    const n = validar(novoFmeaSchema, dados);
    return this.db.transaction(async (tx) => {
      const numero = await proximoNumero(tx, ctx, 'FMEA');
      const [l] = await tx
        .insert(fmeas)
        .values({
          ...n,
          numero,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montarFmea(l!);
    });
  }

  async atualizarFmea(ctx: Contexto, dados: ComId): Promise<Fmea> {
    const { versao, ...n } = validar(atualizarFmeaSchema, dados?.alteracoes);
    const atual = await this.buscar(
      ctx,
      fmeas,
      dados?.id,
      'FMEA não encontrado.',
    );
    const [l] = await this.db
      .update(fmeas)
      .set({ ...n, atualizadoPor: ctx.usuarioId })
      .where(
        and(eq(fmeas.id, atual.id), eq(fmeas.atualizadoEm, new Date(versao))),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarFmea(l);
  }

  // ---------------------------------------------------------------- plano de controle

  async listarPlanos(ctx: Contexto): Promise<PlanoDeControleResumo[]> {
    const linhas = await this.db
      .select({ p: planosDeControle, fmeaNumero: fmeas.numero })
      .from(planosDeControle)
      .leftJoin(fmeas, eq(fmeas.id, planosDeControle.fmeaId))
      .where(eq(planosDeControle.empresaId, ctx.empresaId))
      .orderBy(desc(planosDeControle.atualizadoEm));
    return linhas.map(({ p, fmeaNumero }) => {
      const { linhas: l, ...resumo } = montarPlano(p, fmeaNumero);
      return { ...resumo, totalDeLinhas: l.length };
    });
  }

  async obterPlano(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<PlanoDeControle> {
    const p = await this.buscar(
      ctx,
      planosDeControle,
      dados?.id,
      'Plano de controle não encontrado.',
    );
    return montarPlano(p, await this.numeroDoFmea(ctx, p.fmeaId));
  }

  /** Com FMEA e sem linhas: cada linha do FMEA vira uma característica a controlar, com os controles dele. */
  async criarPlano(ctx: Contexto, dados: unknown): Promise<PlanoDeControle> {
    const n = validar(novoPlanoDeControleSchema, dados);
    let linhas = n.linhas;
    if (n.fmeaId) {
      const f = montarFmea(
        await this.buscar(ctx, fmeas, n.fmeaId, 'FMEA não encontrado.'),
      );
      if (!linhas.length) linhas = linhasDoFmea(f.linhas);
    }
    return this.db.transaction(async (tx) => {
      const numero = await proximoNumero(tx, ctx, 'PC');
      const [l] = await tx
        .insert(planosDeControle)
        .values({
          ...n,
          linhas,
          fmeaId: n.fmeaId ?? null,
          numero,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montarPlano(l!, await this.numeroDoFmea(ctx, l!.fmeaId));
    });
  }

  async atualizarPlano(ctx: Contexto, dados: ComId): Promise<PlanoDeControle> {
    const { versao, ...n } = validar(
      atualizarPlanoDeControleSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(
      ctx,
      planosDeControle,
      dados?.id,
      'Plano de controle não encontrado.',
    );
    if (n.fmeaId)
      await this.buscar(ctx, fmeas, n.fmeaId, 'FMEA não encontrado.');
    const [l] = await this.db
      .update(planosDeControle)
      .set({ ...n, fmeaId: n.fmeaId ?? null, atualizadoPor: ctx.usuarioId })
      .where(
        and(
          eq(planosDeControle.id, atual.id),
          eq(planosDeControle.atualizadoEm, new Date(versao)),
        ),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarPlano(l, await this.numeroDoFmea(ctx, l.fmeaId));
  }

  // ---------------------------------------------------------------- PPAP

  async listarPpaps(ctx: Contexto): Promise<PpapResumo[]> {
    const linhas = await this.db
      .select()
      .from(ppaps)
      .where(eq(ppaps.empresaId, ctx.empresaId))
      .orderBy(desc(ppaps.atualizadoEm));
    return linhas.map((l) => {
      const { elementos: _, ...resumo } = montarPpap(l);
      return resumo;
    });
  }

  async obterPpap(ctx: Contexto, dados: { id?: unknown }): Promise<Ppap> {
    return montarPpap(
      await this.buscar(ctx, ppaps, dados?.id, 'PPAP não encontrado.'),
    );
  }

  async criarPpap(ctx: Contexto, dados: unknown): Promise<Ppap> {
    const n = validar(novoPpapSchema, dados);
    await this.conferirLigacoes(
      ctx,
      n.fmeaId ?? null,
      n.planoDeControleId ?? null,
    );
    return this.db.transaction(async (tx) => {
      const numero = await proximoNumero(tx, ctx, 'PPAP');
      const [l] = await tx
        .insert(ppaps)
        .values({
          ...n,
          fmeaId: n.fmeaId ?? null,
          planoDeControleId: n.planoDeControleId ?? null,
          numero,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montarPpap(l!);
    });
  }

  /** Só em preparação ou depois de rejeitado (volta a "em preparação"). Submetido e aprovado não mudam. */
  async atualizarPpap(ctx: Contexto, dados: ComId): Promise<Ppap> {
    const { versao, elementos, ...n } = validar(
      atualizarPpapSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(
      ctx,
      ppaps,
      dados?.id,
      'PPAP não encontrado.',
    );
    if (atual.status !== 'em_preparacao' && atual.status !== 'rejeitado')
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'PPAP submetido ou aprovado não muda: abra uma nova submissão.',
      );
    await this.conferirLigacoes(
      ctx,
      n.fmeaId ?? null,
      n.planoDeControleId ?? null,
    );
    const [l] = await this.db
      .update(ppaps)
      .set({
        ...n,
        fmeaId: n.fmeaId ?? null,
        planoDeControleId: n.planoDeControleId ?? null,
        ...(elementos
          ? {
              elementos: {
                ...(atual.elementos as ElementosGravados),
                ...elementos,
              },
            }
          : {}),
        status: 'em_preparacao',
        atualizadoPor: ctx.usuarioId,
      })
      .where(
        and(eq(ppaps.id, atual.id), eq(ppaps.atualizadoEm, new Date(versao))),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarPpap(l);
  }

  async submeterPpap(ctx: Contexto, dados: ComId): Promise<Ppap> {
    const { versao, data } = validar(submeterPpapSchema, dados?.alteracoes);
    const atual = await this.buscar(
      ctx,
      ppaps,
      dados?.id,
      'PPAP não encontrado.',
    );
    if (atual.status !== 'em_preparacao')
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Só se submete o PPAP em preparação.',
      );
    if (data > hojeEmBrasilia())
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [
          {
            campo: 'data',
            mensagem: 'A data de submissão não pode estar no futuro.',
          },
        ],
      );
    const faltam = pendenciasDoPpap(montarPpap(atual).elementos);
    if (faltam.length)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        `Antes de submeter, conclua (ou justifique como não aplicável): ${faltam.map((e) => ELEMENTOS_DO_PPAP[e.elemento]).join('; ')}.`,
      );
    return this.mudarStatus(ctx, atual.id, versao, {
      status: 'submetido',
      submetidoEm: data,
    });
  }

  async decidirPpap(ctx: Contexto, dados: ComId): Promise<Ppap> {
    const { versao, decisao, parecer } = validar(
      decidirPpapSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(
      ctx,
      ppaps,
      dados?.id,
      'PPAP não encontrado.',
    );
    if (atual.status !== 'submetido')
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Só se registra a decisão do cliente de um PPAP submetido.',
      );
    return this.mudarStatus(ctx, atual.id, versao, {
      status: decisao,
      parecer,
      decididoEm: new Date(),
    });
  }

  // ---------------------------------------------------------------- apoio

  private async mudarStatus(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof ppaps.$inferInsert>,
  ): Promise<Ppap> {
    const [l] = await this.db
      .update(ppaps)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(and(eq(ppaps.id, id), eq(ppaps.atualizadoEm, new Date(versao))))
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarPpap(l);
  }

  private async conferirLigacoes(
    ctx: Contexto,
    fmeaId: string | null,
    planoId: string | null,
  ) {
    if (fmeaId) await this.buscar(ctx, fmeas, fmeaId, 'FMEA não encontrado.');
    if (planoId)
      await this.buscar(
        ctx,
        planosDeControle,
        planoId,
        'Plano de controle não encontrado.',
      );
  }

  private async numeroDoFmea(
    ctx: Contexto,
    id: string | null,
  ): Promise<string | null> {
    if (!id) return null;
    const [f] = await this.db
      .select({ numero: fmeas.numero })
      .from(fmeas)
      .where(and(eq(fmeas.id, id), eq(fmeas.empresaId, ctx.empresaId)));
    return f?.numero ?? null;
  }

  private async buscar<
    T extends typeof fmeas | typeof planosDeControle | typeof ppaps,
  >(
    ctx: Contexto,
    tabela: T,
    id: unknown,
    mensagem: string,
  ): Promise<T['$inferSelect']> {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(tabela as typeof fmeas)
          .where(
            and(
              eq((tabela as typeof fmeas).id, id),
              eq((tabela as typeof fmeas).empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!l) throw new ErroDeNegocio('NAO_ENCONTRADO', mensagem);
    return l as T['$inferSelect'];
  }
}

/** FMEA-2026-001, PC-2026-001, PPAP-2026-001: sequência por empresa e ano. */
async function proximoNumero(
  tx: Tx,
  ctx: Contexto,
  prefixo: string,
): Promise<string> {
  const ano = Number(hojeEmBrasilia().slice(0, 4));
  const [{ ultimo }] = (await tx
    .insert(sequencias)
    .values({ empresaId: ctx.empresaId, nome: `${prefixo}-${ano}`, ultimo: 1 })
    .onConflictDoUpdate({
      target: [sequencias.empresaId, sequencias.nome],
      set: { ultimo: sql`${sequencias.ultimo} + 1` },
    })
    .returning({ ultimo: sequencias.ultimo })) as [{ ultimo: number }];
  return `${prefixo}-${ano}-${String(ultimo).padStart(3, '0')}`;
}

type LinhaFmeaGravada = Omit<LinhaDoFmea, 'ap' | 'npr'>;

function montarFmea(l: LinhaFmea): Fmea {
  const linhas = (l.linhas as LinhaFmeaGravada[]).map((x) => ({
    ...x,
    classificacao: x.classificacao ?? null,
    ap: prioridadeDeAcao(x.severidade, x.ocorrencia, x.notaDeteccao),
    npr: x.severidade * x.ocorrencia * x.notaDeteccao,
  }));
  return {
    id: l.id,
    numero: l.numero,
    titulo: l.titulo,
    item: l.item,
    cliente: l.cliente,
    equipe: l.equipe,
    revisao: l.revisao,
    linhas,
    contagem: {
      H: linhas.filter((x) => x.ap === 'H').length,
      M: linhas.filter((x) => x.ap === 'M').length,
      L: linhas.filter((x) => x.ap === 'L').length,
    },
    acoesAltasAbertas: linhas.filter(
      (x) => x.ap === 'H' && x.statusAcao !== 'concluida',
    ).length,
    atualizadoEm: l.atualizadoEm.toISOString(),
    versao: l.atualizadoEm.toISOString(),
  };
}

/** Do FMEA para o plano: característica = função, controle = prevenção e detecção; reação a preencher. */
export function linhasDoFmea(linhas: LinhaDoFmea[]): LinhaDoPlanoDeControle[] {
  const vistos = new Set<string>();
  const saida: LinhaDoPlanoDeControle[] = [];
  for (const l of linhas) {
    const chave = `${l.etapa}|${l.funcao}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    saida.push({
      etapa: l.etapa,
      maquina: '',
      caracteristica: l.funcao,
      tipo: 'produto',
      classificacao: l.classificacao,
      especificacao: 'A definir',
      metodo: l.deteccao || 'A definir',
      amostra: 'A definir',
      frequencia: 'A definir',
      controle:
        [l.prevencao, l.deteccao].filter(Boolean).join(' · ') || 'A definir',
      reacao: 'Segregar o lote, conter e abrir NC',
    });
  }
  return saida;
}

function montarPlano(
  l: LinhaPlano,
  fmeaNumero: string | null,
): PlanoDeControle {
  return {
    id: l.id,
    numero: l.numero,
    titulo: l.titulo,
    item: l.item,
    fase: l.fase as FaseDoPlanoDeControle,
    revisao: l.revisao,
    fmeaId: l.fmeaId,
    fmeaNumero,
    linhas: (l.linhas as LinhaDoPlanoDeControle[]).map((x) => ({
      ...x,
      classificacao: (x.classificacao ?? null) as ClassificacaoEspecial | null,
    })),
    atualizadoEm: l.atualizadoEm.toISOString(),
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarPpap(l: LinhaPpap): Ppap {
  const nivel = l.nivel as NivelDoPpap;
  const gravados = l.elementos as ElementosGravados;
  const elementos = (Object.keys(ELEMENTOS_DO_PPAP) as ElementoDoPpap[]).map(
    (e) => ({
      elemento: e,
      exigencia: exigenciaDoElemento(e, nivel),
      status: gravados[e]?.status ?? 'pendente',
      observacao: gravados[e]?.observacao ?? '',
    }),
  );
  return {
    id: l.id,
    numero: l.numero,
    peca: l.peca,
    numeroDaPeca: l.numeroDaPeca,
    revisaoDoDesenho: l.revisaoDoDesenho,
    cliente: l.cliente,
    nivel,
    motivo: l.motivo as Ppap['motivo'],
    fmeaId: l.fmeaId,
    planoDeControleId: l.planoDeControleId,
    elementos,
    pendentesParaSubmeter: pendenciasDoPpap(elementos).length,
    status: l.status as StatusDoPpap,
    submetidoEm: l.submetidoEm,
    parecer: l.parecer,
    decididoEm: l.decididoEm?.toISOString() ?? null,
    atualizadoEm: l.atualizadoEm.toISOString(),
    versao: l.atualizadoEm.toISOString(),
  };
}
