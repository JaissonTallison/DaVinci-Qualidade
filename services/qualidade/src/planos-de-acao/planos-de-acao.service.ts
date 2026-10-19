import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  notInArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  atualizarPlanoSchema,
  cancelarPlanoSchema,
  cancelarTarefaSchema,
  concluirTarefaSchema,
  filtroPlanosSchema,
  incluirTarefaSchema,
  isUuid,
  MAXIMO_DE_TAREFAS,
  novoPlanoSchema,
  reabrirTarefaSchema,
  STATUS_FINAIS_PLANO,
  verificarEficaciaPlanoSchema,
  type Contexto,
  type Pagina,
  type PlanoDeAcao,
  type PlanoResumo,
  type ResumoPlanos,
  type SituacaoTarefa,
  type StatusPlano,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  naoConformidades,
  planosAcao,
  planosAcaoTarefas,
  sequencias,
} from '../db/schema.js';
import { hojeEmBrasilia } from '../datas.js';
import {
  formatarNumeroPlano,
  planoAtrasado,
  prazoDoPlano,
  progresso,
  recusaPorStatusFinal,
  statusPelasTarefas,
  tarefaAtrasada,
} from './regras.js';

type Db = Database<typeof schema>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type LinhaPlano = typeof planosAcao.$inferSelect;
type LinhaTarefa = typeof planosAcaoTarefas.$inferSelect;
type ComId = { id?: unknown; alteracoes?: unknown };

const ALTERADO_POR_OUTRA_PESSOA =
  'Este plano foi alterado por outra pessoa. Recarregue a página para ver a versão atual.';

@Injectable()
export class PlanosDeAcaoService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<Pagina<PlanoResumo>> {
    const f = validar(filtroPlanosSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const condicoes: SQL[] = [eq(planosAcao.empresaId, ctx.empresaId)];
    if (f.status) condicoes.push(eq(planosAcao.status, f.status));
    if (f.origem) condicoes.push(eq(planosAcao.origem, f.origem));
    if (f.ncId) condicoes.push(eq(planosAcao.ncId, f.ncId));
    if (f.atrasados)
      condicoes.push(
        notInArray(planosAcao.status, [...STATUS_FINAIS_PLANO]),
        sql`EXISTS (${this.tarefasAtrasadas(hoje)})`,
      );
    if (f.busca) {
      const termo = `%${f.busca}%`;
      condicoes.push(
        or(
          ilike(planosAcao.numero, termo),
          sql`unaccent(${planosAcao.titulo}) ILIKE unaccent(${termo})`,
        )!,
      );
    }
    const onde = and(...condicoes);
    const terminado = sql`${planosAcao.status} IN ('encerrado', 'cancelado')`;
    const colunas = {
      numero: planosAcao.numero,
      titulo: planosAcao.titulo,
      origem: planosAcao.origem,
      status: planosAcao.status,
    } as const;
    const ordenacao = f.ordenar
      ? [f.ordem === 'asc' ? asc(colunas[f.ordenar]) : desc(colunas[f.ordenar])]
      : [terminado, desc(planosAcao.numero)];
    const [linhas, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(planosAcao)
        .where(onde)
        .orderBy(...ordenacao)
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db.select({ total: count() }).from(planosAcao).where(onde),
    ]);
    const tarefas = await this.tarefasDe(
      this.db,
      linhas.map((l) => l.id),
    );
    return {
      itens: linhas.map((l) => {
        const doPlano = tarefas.get(l.id) ?? [];
        const p = montar(l, doPlano, hoje);
        return {
          id: p.id,
          numero: p.numero,
          titulo: p.titulo,
          tipo: p.tipo,
          origem: p.origem,
          origemRef: p.origemRef,
          responsavel: p.responsavel,
          status: p.status,
          progresso: p.progresso,
          prazo: p.prazo,
          atrasado: p.atrasado,
          tarefasPendentes: doPlano.filter((t) => t.situacao === 'pendente')
            .length,
        };
      }),
      total: total!,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  async resumo(ctx: Contexto): Promise<ResumoPlanos> {
    const hoje = hojeEmBrasilia();
    const [r] = await this.db
      .select({
        emExecucao: sql<number>`count(*) FILTER (WHERE ${planosAcao.status} = 'em_execucao')::int`,
        aguardandoEficacia: sql<number>`count(*) FILTER (WHERE ${planosAcao.status} = 'aguardando_eficacia')::int`,
        atrasados: sql<number>`count(*) FILTER (WHERE EXISTS (${this.tarefasAtrasadas(hoje)}))::int`,
      })
      .from(planosAcao)
      .where(
        and(
          eq(planosAcao.empresaId, ctx.empresaId),
          notInArray(planosAcao.status, [...STATUS_FINAIS_PLANO]),
        ),
      );
    return {
      emExecucao: r!.emExecucao,
      aguardandoEficacia: r!.aguardandoEficacia,
      atrasados: r!.atrasados,
    };
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<PlanoDeAcao> {
    const plano = await this.buscar(ctx, this.db, dados?.id);
    return montar(
      plano,
      (await this.tarefasDe(this.db, [plano.id])).get(plano.id) ?? [],
      hojeEmBrasilia(),
    );
  }

  async criar(ctx: Contexto, dados: unknown): Promise<PlanoDeAcao> {
    const { tarefas, ...novo } = validar(novoPlanoSchema, dados);
    const hoje = hojeEmBrasilia();
    tarefas.forEach((t, i) => {
      if (t.prazo < hoje)
        throw invalido(
          `tarefas.${i}.prazo`,
          'O prazo não pode ser anterior a hoje.',
        );
    });
    if (novo.ncId) await this.conferirNc(ctx, novo.ncId);
    const ano = Number(hoje.slice(0, 4));
    return this.db.transaction(async (tx) => {
      const [{ ultimo }] = await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `PA-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo });
      const [plano] = await tx
        .insert(planosAcao)
        .values({
          ...novo,
          empresaId: ctx.empresaId,
          numero: formatarNumeroPlano(ano, ultimo!),
          status: 'em_execucao',
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      const linhas = await tx
        .insert(planosAcaoTarefas)
        .values(
          tarefas.map((t, ordem) => ({
            ...t,
            ordem,
            planoId: plano!.id,
            empresaId: ctx.empresaId,
            criadoPor: ctx.usuarioId,
            atualizadoPor: ctx.usuarioId,
          })),
        )
        .returning();
      return montar(plano!, linhas, hoje);
    });
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<PlanoDeAcao> {
    const { versao, ...campos } = validar(
      atualizarPlanoSchema,
      dados?.alteracoes,
    );
    return this.alterar(ctx, dados?.id, versao, async (tx, plano) => {
      await tx
        .update(planosAcao)
        .set({ ...campos, atualizadoPor: ctx.usuarioId })
        .where(eq(planosAcao.id, plano.id));
    });
  }

  async incluirTarefa(ctx: Contexto, dados: ComId): Promise<PlanoDeAcao> {
    const { versao, tarefa } = validar(incluirTarefaSchema, dados?.alteracoes);
    if (tarefa.prazo < hojeEmBrasilia())
      throw invalido('tarefa.prazo', 'O prazo não pode ser anterior a hoje.');
    return this.alterar(ctx, dados?.id, versao, async (tx, plano, tarefas) => {
      if (tarefas.length >= MAXIMO_DE_TAREFAS)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          `O plano já tem ${MAXIMO_DE_TAREFAS} tarefas. Para mais que isso, divida em outro plano.`,
        );
      await tx.insert(planosAcaoTarefas).values({
        ...tarefa,
        ordem: tarefas.length,
        planoId: plano.id,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      });
    });
  }

  async concluirTarefa(ctx: Contexto, dados: ComId): Promise<PlanoDeAcao> {
    const { versao, tarefaId } = validar(
      concluirTarefaSchema,
      dados?.alteracoes,
    );
    return this.mudarTarefa(ctx, dados?.id, versao, tarefaId, 'pendente', {
      situacao: 'concluida',
      concluidaEm: new Date(),
      concluidaPor: ctx.usuarioId,
    });
  }

  async reabrirTarefa(ctx: Contexto, dados: ComId): Promise<PlanoDeAcao> {
    const { versao, tarefaId } = validar(
      reabrirTarefaSchema,
      dados?.alteracoes,
    );
    return this.mudarTarefa(ctx, dados?.id, versao, tarefaId, 'concluida', {
      situacao: 'pendente',
      concluidaEm: null,
      concluidaPor: null,
    });
  }

  async cancelarTarefa(ctx: Contexto, dados: ComId): Promise<PlanoDeAcao> {
    const { versao, tarefaId, motivo } = validar(
      cancelarTarefaSchema,
      dados?.alteracoes,
    );
    return this.mudarTarefa(
      ctx,
      dados?.id,
      versao,
      tarefaId,
      'pendente',
      { situacao: 'cancelada', motivoCancelamento: motivo },
      (tarefas) => {
        const restantes = tarefas.filter(
          (t) => t.id !== tarefaId && t.situacao !== 'cancelada',
        );
        if (!restantes.length)
          throw new ErroDeNegocio(
            'REGRA_DE_NEGOCIO',
            'Esta é a única tarefa válida do plano. Para não executá-lo, cancele o plano.',
          );
      },
    );
  }

  /** Eficaz encerra. Ineficaz volta para execução: inclua as tarefas que faltam para alcançar o objetivo. */
  async verificarEficacia(ctx: Contexto, dados: ComId): Promise<PlanoDeAcao> {
    const { versao, eficaz, parecer } = validar(
      verificarEficaciaPlanoSchema,
      dados?.alteracoes,
    );
    return this.alterar(
      ctx,
      dados?.id,
      versao,
      async (tx, plano) => {
        if (plano.status !== 'aguardando_eficacia')
          throw new ErroDeNegocio(
            'REGRA_DE_NEGOCIO',
            'A eficácia é verificada depois que todas as tarefas estão concluídas.',
          );
        await tx
          .update(planosAcao)
          .set({
            eficaz,
            parecerEficacia: parecer,
            verificadoPor: ctx.usuarioId,
            verificadoEm: new Date(),
            status: eficaz ? 'encerrado' : 'em_execucao',
            atualizadoPor: ctx.usuarioId,
          })
          .where(eq(planosAcao.id, plano.id));
      },
      { recalcular: false },
    );
  }

  async cancelar(ctx: Contexto, dados: ComId): Promise<PlanoDeAcao> {
    const { versao, motivo } = validar(cancelarPlanoSchema, dados?.alteracoes);
    return this.alterar(
      ctx,
      dados?.id,
      versao,
      async (tx, plano) => {
        await tx
          .update(planosAcao)
          .set({
            status: 'cancelado',
            motivoCancelamento: motivo,
            canceladoEm: new Date(),
            canceladoPor: ctx.usuarioId,
            atualizadoPor: ctx.usuarioId,
          })
          .where(eq(planosAcao.id, plano.id));
      },
      { recalcular: false },
    );
  }

  private mudarTarefa(
    ctx: Contexto,
    id: unknown,
    versao: string,
    tarefaId: string,
    situacaoEsperada: SituacaoTarefa,
    valores: Partial<typeof planosAcaoTarefas.$inferInsert>,
    conferir?: (tarefas: LinhaTarefa[]) => void,
  ): Promise<PlanoDeAcao> {
    return this.alterar(ctx, id, versao, async (tx, plano, tarefas) => {
      const tarefa = tarefas.find((t) => t.id === tarefaId);
      if (!tarefa)
        throw new ErroDeNegocio(
          'NAO_ENCONTRADO',
          'Tarefa não encontrada neste plano.',
        );
      if (tarefa.situacao !== situacaoEsperada)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          situacaoEsperada === 'pendente'
            ? 'Esta tarefa não está pendente.'
            : 'Só uma tarefa concluída pode ser reaberta.',
        );
      conferir?.(tarefas);
      await tx
        .update(planosAcaoTarefas)
        .set({ ...valores, atualizadoPor: ctx.usuarioId })
        .where(
          and(
            eq(planosAcaoTarefas.id, tarefa.id),
            eq(planosAcaoTarefas.planoId, plano.id),
          ),
        );
    });
  }

  /**
   * Toda alteração passa por aqui, numa transação: confere a empresa, o status e a versão lida (e já a avança,
   * travando o plano contra outra gravação simultânea), aplica a mudança e recalcula o status pelas tarefas.
   */
  private async alterar(
    ctx: Contexto,
    id: unknown,
    versao: string,
    mudanca: (
      tx: Tx,
      plano: LinhaPlano,
      tarefas: LinhaTarefa[],
    ) => Promise<void>,
    { recalcular = true } = {},
  ): Promise<PlanoDeAcao> {
    const lida = new Date(versao);
    if (Number.isNaN(lida.getTime()))
      throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    return this.db.transaction(async (tx) => {
      const atual = await this.buscar(ctx, tx, id);
      const recusa = recusaPorStatusFinal(atual.status as StatusPlano);
      if (recusa) throw new ErroDeNegocio('REGRA_DE_NEGOCIO', recusa);
      const [travado] = await tx
        .update(planosAcao)
        .set({ atualizadoPor: ctx.usuarioId })
        .where(
          and(eq(planosAcao.id, atual.id), eq(planosAcao.atualizadoEm, lida)),
        )
        .returning();
      if (!travado)
        throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
      await mudanca(
        tx,
        travado,
        (await this.tarefasDe(tx, [travado.id])).get(travado.id) ?? [],
      );
      const tarefas =
        (await this.tarefasDe(tx, [travado.id])).get(travado.id) ?? [];
      if (recalcular)
        await tx
          .update(planosAcao)
          .set({ status: statusPelasTarefas(tarefas) })
          .where(eq(planosAcao.id, travado.id));
      const [final] = await tx
        .select()
        .from(planosAcao)
        .where(eq(planosAcao.id, travado.id));
      return montar(final!, tarefas, hojeEmBrasilia());
    });
  }

  private async buscar(
    ctx: Contexto,
    db: Db | Tx,
    id: unknown,
  ): Promise<LinhaPlano> {
    const [linha] = isUuid(id)
      ? await db
          .select()
          .from(planosAcao)
          .where(
            and(eq(planosAcao.id, id), eq(planosAcao.empresaId, ctx.empresaId)),
          )
      : [];
    if (!linha)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Plano de ação não encontrado.',
      );
    return linha;
  }

  private async tarefasDe(
    db: Db | Tx,
    planoIds: string[],
  ): Promise<Map<string, LinhaTarefa[]>> {
    const mapa = new Map<string, LinhaTarefa[]>();
    if (!planoIds.length) return mapa;
    const linhas = await db
      .select()
      .from(planosAcaoTarefas)
      .where(inArray(planosAcaoTarefas.planoId, planoIds))
      .orderBy(asc(planosAcaoTarefas.ordem));
    for (const l of linhas)
      mapa.set(l.planoId, [...(mapa.get(l.planoId) ?? []), l]);
    return mapa;
  }

  private tarefasAtrasadas(hoje: string) {
    return this.db
      .select({ um: sql`1` })
      .from(planosAcaoTarefas)
      .where(
        and(
          eq(planosAcaoTarefas.planoId, planosAcao.id),
          eq(planosAcaoTarefas.situacao, 'pendente'),
          sql`${planosAcaoTarefas.prazo} < ${hoje}`,
        ),
      );
  }

  private async conferirNc(ctx: Contexto, ncId: string): Promise<void> {
    const [nc] = await this.db
      .select({ id: naoConformidades.id })
      .from(naoConformidades)
      .where(
        and(
          eq(naoConformidades.id, ncId),
          eq(naoConformidades.empresaId, ctx.empresaId),
        ),
      );
    if (!nc) throw invalido('ncId', 'NC não encontrada.');
  }
}

function invalido(campo: string, mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio(
    'DADOS_INVALIDOS',
    'Verifique os campos destacados.',
    [{ campo, mensagem }],
  );
}

function montar(
  l: LinhaPlano,
  tarefas: LinhaTarefa[],
  hoje: string,
): PlanoDeAcao {
  const status = l.status as StatusPlano;
  return {
    id: l.id,
    numero: l.numero,
    titulo: l.titulo,
    objetivo: l.objetivo,
    tipo: l.tipo as PlanoDeAcao['tipo'],
    origem: l.origem as PlanoDeAcao['origem'],
    origemRef: l.origemRef,
    ncId: l.ncId,
    responsavel: l.responsavel,
    custoPrevisto: l.custoPrevisto,
    status,
    tarefas: tarefas.map((t) => ({
      id: t.id,
      ordem: t.ordem,
      oQue: t.oQue,
      responsavel: t.responsavel,
      prazo: t.prazo,
      onde: t.onde,
      como: t.como,
      situacao: t.situacao as SituacaoTarefa,
      concluidaEm: t.concluidaEm?.toISOString() ?? null,
      motivoCancelamento: t.motivoCancelamento,
      atrasada: tarefaAtrasada(t, hoje),
    })),
    progresso: progresso(tarefas),
    prazo: prazoDoPlano(tarefas),
    atrasado: planoAtrasado(status, tarefas, hoje),
    eficaz: l.eficaz,
    parecerEficacia: l.parecerEficacia,
    verificadoEm: l.verificadoEm?.toISOString() ?? null,
    motivoCancelamento: l.motivoCancelamento,
    canceladoEm: l.canceladoEm?.toISOString() ?? null,
    criadoEm: l.criadoEm.toISOString(),
    versao: l.atualizadoEm.toISOString(),
  };
}
