import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  pedir,
  somarDias,
  validar,
} from '@davinci/shared';
import {
  alterarConstatacaoSchema,
  atualizarAuditoriaSchema,
  cancelarAuditoriaSchema,
  concluirAuditoriaSchema,
  DIAS_DE_PRAZO_DA_NC_DE_AUDITORIA,
  ehConstatacaoDeNc,
  filtroAuditoriasSchema,
  iniciarAuditoriaSchema,
  isUuid,
  NORMAS,
  novaAuditoriaSchema,
  PATTERNS,
  registrarConstatacaoSchema,
  SERVICES,
  TIPOS_CONSTATACAO,
  formalizarNcSchema,
  type Auditoria,
  type AuditoriaResumo,
  type Contexto,
  type NaoConformidade,
  type NovaNc,
  type Norma,
  type Pagina,
  type ResumoAuditorias,
  type StatusAuditoria,
  type TipoAuditoria,
  type TipoConstatacao,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { auditorias, constatacoes, sequencias } from '../db/schema.js';
import {
  contagemPorTipo,
  formatarNumeroAuditoria,
  gravidadeDaNc,
  ncsPendentes,
  recusaDaAcao,
  type AcaoAuditoria,
} from './regras.js';

type Db = Database<typeof schema>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Linha = typeof auditorias.$inferSelect;
type LinhaConstatacao = typeof constatacoes.$inferSelect;
type ComId = { id?: unknown; alteracoes?: unknown };

const ALTERADA_POR_OUTRA_PESSOA =
  'Esta auditoria foi alterada por outra pessoa. Recarregue a página para ver a versão atual.';

@Injectable()
export class AuditoriasService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    /** Dono das NCs: a constatação de NC vira NC lá. */
    @Inject(SERVICES.QUALIDADE)
    private readonly qualidade: Pick<ClientProxy, 'send'>,
  ) {}

  async listar(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Pagina<AuditoriaResumo>> {
    const f = validar(filtroAuditoriasSchema, dados ?? {});
    const condicoes: SQL[] = [eq(auditorias.empresaId, ctx.empresaId)];
    if (f.status) condicoes.push(eq(auditorias.status, f.status));
    if (f.tipo) condicoes.push(eq(auditorias.tipo, f.tipo));
    if (f.busca) {
      const termo = `%${f.busca}%`;
      condicoes.push(
        or(
          ilike(auditorias.numero, termo),
          ilike(auditorias.escopo, termo),
          ilike(auditorias.auditorLider, termo),
        )!,
      );
    }
    const onde = and(...condicoes);
    const terminada = sql`${auditorias.status} IN ('concluida', 'cancelada')`;
    const [linhas, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(auditorias)
        .where(onde)
        .orderBy(
          terminada,
          desc(auditorias.dataInicio),
          desc(auditorias.numero),
        )
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db.select({ total: count() }).from(auditorias).where(onde),
    ]);
    const todas = await this.constatacoesDe(
      this.db,
      linhas.map((l) => l.id),
    );
    return {
      itens: linhas.map((l) => {
        const daAuditoria = todas.get(l.id) ?? [];
        return {
          id: l.id,
          numero: l.numero,
          tipo: l.tipo as TipoAuditoria,
          escopo: l.escopo,
          normas: l.normas as Norma[],
          auditorLider: l.auditorLider,
          dataInicio: l.dataInicio,
          dataFim: l.dataFim,
          status: l.status as StatusAuditoria,
          ncsPendentes: ncsPendentes(daAuditoria),
          constatacoesDeNc: daAuditoria.filter((c) =>
            ehConstatacaoDeNc(c.tipo as TipoConstatacao),
          ).length,
        };
      }),
      total: total!,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  async resumo(ctx: Contexto): Promise<ResumoAuditorias> {
    const desde = somarDias(hojeEmBrasilia(), -365);
    const [status] = await this.db
      .select({
        planejadas: sql<number>`count(*) FILTER (WHERE ${auditorias.status} = 'planejada')::int`,
        emAndamento: sql<number>`count(*) FILTER (WHERE ${auditorias.status} = 'em_andamento')::int`,
      })
      .from(auditorias)
      .where(eq(auditorias.empresaId, ctx.empresaId));
    const [ncs] = await this.db
      .select({ total: count() })
      .from(constatacoes)
      .innerJoin(auditorias, eq(auditorias.id, constatacoes.auditoriaId))
      .where(
        and(
          eq(auditorias.empresaId, ctx.empresaId),
          eq(auditorias.status, 'concluida'),
          gte(auditorias.dataFim, desde),
          inArray(constatacoes.tipo, ['nc_maior', 'nc_menor']),
        ),
      );
    return {
      planejadas: status!.planejadas,
      emAndamento: status!.emAndamento,
      ncsUltimos12Meses: ncs!.total,
    };
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Auditoria> {
    const linha = await this.buscar(ctx, this.db, dados?.id);
    return montar(
      linha,
      (await this.constatacoesDe(this.db, [linha.id])).get(linha.id) ?? [],
    );
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Auditoria> {
    const nova = validar(novaAuditoriaSchema, dados);
    const ano = Number(nova.dataInicio.slice(0, 4));
    return this.db.transaction(async (tx) => {
      const [{ ultimo }] = await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `AUD-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo });
      const [linha] = await tx
        .insert(auditorias)
        .values({
          ...nova,
          empresaId: ctx.empresaId,
          numero: formatarNumeroAuditoria(ano, ultimo!),
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montar(linha!, []);
    });
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<Auditoria> {
    const { versao, ...campos } = validar(
      atualizarAuditoriaSchema,
      dados?.alteracoes,
    );
    return this.alterar(
      ctx,
      dados?.id,
      versao,
      'editar',
      async (tx, linha, lista) => {
        const fora = lista.find(
          (c) => !campos.normas.includes(c.norma as Norma),
        );
        if (fora)
          throw invalido(
            'normas',
            `Há constatação na ${NORMAS[fora.norma as Norma]}: mantenha essa norma na auditoria.`,
          );
        await tx
          .update(auditorias)
          .set(campos)
          .where(eq(auditorias.id, linha.id));
      },
    );
  }

  async iniciar(ctx: Contexto, dados: ComId): Promise<Auditoria> {
    const { versao } = validar(iniciarAuditoriaSchema, dados?.alteracoes);
    return this.alterar(
      ctx,
      dados?.id,
      versao,
      'iniciar',
      async (tx, linha) => {
        await tx
          .update(auditorias)
          .set({ status: 'em_andamento' })
          .where(eq(auditorias.id, linha.id));
      },
    );
  }

  async registrarConstatacao(ctx: Contexto, dados: ComId): Promise<Auditoria> {
    const { versao, constatacao } = validar(
      registrarConstatacaoSchema,
      dados?.alteracoes,
    );
    return this.alterar(
      ctx,
      dados?.id,
      versao,
      'constatar',
      async (tx, linha, lista) => {
        exigirNormaDaAuditoria(linha, constatacao.norma);
        await tx.insert(constatacoes).values({
          ...constatacao,
          ordem: lista.length,
          auditoriaId: linha.id,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        });
      },
    );
  }

  /** Corrige uma constatação. A que já virou NC não muda: a NC levou o texto dela. */
  async alterarConstatacao(ctx: Contexto, dados: ComId): Promise<Auditoria> {
    const { versao, constatacaoId, constatacao } = validar(
      alterarConstatacaoSchema,
      dados?.alteracoes,
    );
    return this.alterar(
      ctx,
      dados?.id,
      versao,
      'constatar',
      async (tx, linha, lista) => {
        const atual = lista.find((c) => c.id === constatacaoId);
        if (!atual)
          throw new ErroDeNegocio(
            'NAO_ENCONTRADO',
            'Constatação não encontrada nesta auditoria.',
          );
        if (atual.ncId)
          throw new ErroDeNegocio(
            'REGRA_DE_NEGOCIO',
            `Esta constatação já virou a ${atual.ncNumero}. Corrija na própria NC.`,
          );
        exigirNormaDaAuditoria(linha, constatacao.norma);
        await tx
          .update(constatacoes)
          .set({ ...constatacao, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(constatacoes.id, atual.id),
              eq(constatacoes.auditoriaId, linha.id),
            ),
          );
      },
    );
  }

  /**
   * Constatação de NC → NC no serviço qualidade. A NC é criada lá primeiro; só então o número é gravado aqui.
   * Se o qualidade recusar ou não responder, nada muda aqui (ver docs/05-modulos/auditorias.md §3).
   */
  async formalizarNc(ctx: Contexto, dados: ComId): Promise<Auditoria> {
    const { versao, constatacaoId, responsavel, prazo } = validar(
      formalizarNcSchema,
      dados?.alteracoes,
    );
    return this.alterar(
      ctx,
      dados?.id,
      versao,
      'constatar',
      async (tx, linha, lista) => {
        const c = lista.find((x) => x.id === constatacaoId);
        if (!c)
          throw new ErroDeNegocio(
            'NAO_ENCONTRADO',
            'Constatação não encontrada nesta auditoria.',
          );
        if (!ehConstatacaoDeNc(c.tipo as TipoConstatacao))
          throw new ErroDeNegocio(
            'REGRA_DE_NEGOCIO',
            `"${TIPOS_CONSTATACAO[c.tipo as TipoConstatacao]}" não vira NC: só NC maior ou menor.`,
          );
        if (c.ncId)
          throw new ErroDeNegocio(
            'REGRA_DE_NEGOCIO',
            `Esta constatação já virou a ${c.ncNumero}.`,
          );
        const requisito = `${NORMAS[c.norma as Norma]}${c.clausula ? ` ${c.clausula}` : ''}`;
        const nova: NovaNc = {
          titulo: `${linha.numero} ${requisito}: ${c.descricao}`.slice(0, 150),
          descricao: [
            c.descricao,
            c.evidencia ? `Evidência: ${c.evidencia}` : '',
            `Requisito: ${requisito}. Constatação da auditoria ${linha.numero}.`,
          ]
            .filter(Boolean)
            .join('\n\n'),
          origem: 'auditoria',
          origemRef: linha.numero,
          tipo: 'sistema',
          gravidade: gravidadeDaNc(c.tipo as TipoConstatacao),
          setor: c.area ?? undefined,
          responsavel,
          prazo:
            prazo ??
            somarDias(hojeEmBrasilia(), DIAS_DE_PRAZO_DA_NC_DE_AUDITORIA),
        };
        const nc = await pedir<NaoConformidade>(
          this.qualidade,
          PATTERNS.naoConformidades.criar,
          nova,
          ctx,
          'Qualidade',
        );
        await tx
          .update(constatacoes)
          .set({
            ncId: nc.id,
            ncNumero: nc.numero,
            atualizadoPor: ctx.usuarioId,
          })
          .where(eq(constatacoes.id, c.id));
      },
    );
  }

  async concluir(ctx: Contexto, dados: ComId): Promise<Auditoria> {
    const { versao, conclusao } = validar(
      concluirAuditoriaSchema,
      dados?.alteracoes,
    );
    return this.alterar(
      ctx,
      dados?.id,
      versao,
      'concluir',
      async (tx, linha, lista) => {
        const pendentes = ncsPendentes(lista);
        if (pendentes)
          throw new ErroDeNegocio(
            'REGRA_DE_NEGOCIO',
            `Formalize ${pendentes === 1 ? 'a NC pendente' : `as ${pendentes} NCs pendentes`} antes de concluir: NC de auditoria precisa de registro para tratamento.`,
          );
        await tx
          .update(auditorias)
          .set({ status: 'concluida', conclusao, concluidaEm: new Date() })
          .where(eq(auditorias.id, linha.id));
      },
    );
  }

  async cancelar(ctx: Contexto, dados: ComId): Promise<Auditoria> {
    const { versao, motivo } = validar(
      cancelarAuditoriaSchema,
      dados?.alteracoes,
    );
    return this.alterar(
      ctx,
      dados?.id,
      versao,
      'cancelar',
      async (tx, linha) => {
        await tx
          .update(auditorias)
          .set({
            status: 'cancelada',
            motivoCancelamento: motivo,
            canceladaEm: new Date(),
          })
          .where(eq(auditorias.id, linha.id));
      },
    );
  }

  /** Transação: confere empresa, status e versão (já avançando-a, o que trava gravação simultânea) e aplica a mudança. */
  private async alterar(
    ctx: Contexto,
    id: unknown,
    versao: string,
    acao: AcaoAuditoria,
    mudanca: (tx: Tx, linha: Linha, lista: LinhaConstatacao[]) => Promise<void>,
  ): Promise<Auditoria> {
    const lida = new Date(versao);
    if (Number.isNaN(lida.getTime()))
      throw new ErroDeNegocio('CONFLITO', ALTERADA_POR_OUTRA_PESSOA);
    return this.db.transaction(async (tx) => {
      const atual = await this.buscar(ctx, tx, id);
      const recusa = recusaDaAcao(acao, atual.status as StatusAuditoria);
      if (recusa) throw new ErroDeNegocio('REGRA_DE_NEGOCIO', recusa);
      const [travada] = await tx
        .update(auditorias)
        .set({ atualizadoPor: ctx.usuarioId })
        .where(
          and(eq(auditorias.id, atual.id), eq(auditorias.atualizadoEm, lida)),
        )
        .returning();
      if (!travada)
        throw new ErroDeNegocio('CONFLITO', ALTERADA_POR_OUTRA_PESSOA);
      await mudanca(
        tx,
        travada,
        (await this.constatacoesDe(tx, [travada.id])).get(travada.id) ?? [],
      );
      const [final] = await tx
        .select()
        .from(auditorias)
        .where(eq(auditorias.id, travada.id));
      return montar(
        final!,
        (await this.constatacoesDe(tx, [travada.id])).get(travada.id) ?? [],
      );
    });
  }

  private async buscar(
    ctx: Contexto,
    db: Db | Tx,
    id: unknown,
  ): Promise<Linha> {
    const [linha] = isUuid(id)
      ? await db
          .select()
          .from(auditorias)
          .where(
            and(eq(auditorias.id, id), eq(auditorias.empresaId, ctx.empresaId)),
          )
      : [];
    if (!linha)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Auditoria não encontrada.');
    return linha;
  }

  private async constatacoesDe(
    db: Db | Tx,
    ids: string[],
  ): Promise<Map<string, LinhaConstatacao[]>> {
    const mapa = new Map<string, LinhaConstatacao[]>();
    if (!ids.length) return mapa;
    const linhas = await db
      .select()
      .from(constatacoes)
      .where(inArray(constatacoes.auditoriaId, ids))
      .orderBy(asc(constatacoes.ordem));
    for (const l of linhas)
      mapa.set(l.auditoriaId, [...(mapa.get(l.auditoriaId) ?? []), l]);
    return mapa;
  }
}

function exigirNormaDaAuditoria(linha: Linha, norma: Norma): void {
  if (!linha.normas.includes(norma))
    throw invalido(
      'constatacao.norma',
      `A ${NORMAS[norma]} não está entre as normas desta auditoria.`,
    );
}

function invalido(campo: string, mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio(
    'DADOS_INVALIDOS',
    'Verifique os campos destacados.',
    [{ campo, mensagem }],
  );
}

function montar(l: Linha, lista: LinhaConstatacao[]): Auditoria {
  return {
    id: l.id,
    numero: l.numero,
    tipo: l.tipo as TipoAuditoria,
    escopo: l.escopo,
    normas: l.normas as Norma[],
    areas: l.areas,
    auditorLider: l.auditorLider,
    equipe: l.equipe,
    representante: l.representante,
    dataInicio: l.dataInicio,
    dataFim: l.dataFim,
    status: l.status as StatusAuditoria,
    conclusao: l.conclusao,
    motivoCancelamento: l.motivoCancelamento,
    constatacoes: lista.map((c) => ({
      id: c.id,
      ordem: c.ordem,
      tipo: c.tipo as TipoConstatacao,
      norma: c.norma as Norma,
      clausula: c.clausula,
      area: c.area,
      descricao: c.descricao,
      evidencia: c.evidencia,
      ncId: c.ncId,
      ncNumero: c.ncNumero,
    })),
    contagem: contagemPorTipo(lista),
    ncsPendentes: ncsPendentes(lista),
    concluidaEm: l.concluidaEm?.toISOString() ?? null,
    versao: l.atualizadoEm.toISOString(),
  };
}
