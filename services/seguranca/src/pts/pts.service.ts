import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { agoraEmBrasilia, ErroDeNegocio, validar } from '@davinci/shared';
import {
  cancelarPtSchema,
  encerrarPtSchema,
  filtroPtsSchema,
  isUuid,
  liberarPtSchema,
  novaPtSchema,
  type Contexto,
  type Pagina,
  type PermissaoDeTrabalho,
  type ResumoPts,
  type StatusPt,
  type TipoPt,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { permissoesDeTrabalho as pts, sequencias } from '../db/schema.js';

type Db = Database<typeof schema>;
type Linha = typeof pts.$inferSelect;
type ComId = { id?: unknown; alteracoes?: unknown };

@Injectable()
export class PtsService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Pagina<PermissaoDeTrabalho>> {
    const f = validar(filtroPtsSchema, dados ?? {});
    const condicoes: SQL[] = [eq(pts.empresaId, ctx.empresaId)];
    if (f.status) condicoes.push(eq(pts.status, f.status));
    if (f.tipo) condicoes.push(eq(pts.tipo, f.tipo));
    const onde = and(...condicoes);
    const colunas = {
      numero: pts.numero,
      tipo: pts.tipo,
      inicio: pts.inicio,
      status: pts.status,
    } as const;
    const ordenacao = f.ordenar
      ? [f.ordem === 'asc' ? asc(colunas[f.ordenar]) : desc(colunas[f.ordenar])]
      : [desc(pts.inicio), desc(pts.criadoEm)];
    const [linhas, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(pts)
        .where(onde)
        .orderBy(...ordenacao)
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db.select({ total: count() }).from(pts).where(onde),
    ]);
    const agora = agoraEmBrasilia();
    return {
      itens: linhas.map((l) => montar(l, ctx, agora)),
      total: total!,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  async obter(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<PermissaoDeTrabalho> {
    return montar(await this.buscar(ctx, dados?.id), ctx, agoraEmBrasilia());
  }

  /** Numeração PT-AAAA-NNN por empresa e ano do início. */
  async criar(ctx: Contexto, dados: unknown): Promise<PermissaoDeTrabalho> {
    const nova = validar(novaPtSchema, dados);
    const agora = agoraEmBrasilia();
    if (nova.fim <= agora)
      throw invalido(
        'fim',
        'O fim já passou: a PT é para um serviço que ainda vai acontecer.',
      );
    const ano = nova.inicio.slice(0, 4);
    return this.db.transaction(async (tx) => {
      const [{ ultimo }] = await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `PT-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo });
      const [l] = await tx
        .insert(pts)
        .values({
          ...nova,
          numero: `PT-${ano}-${String(ultimo).padStart(3, '0')}`,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montar(l!, ctx, agora);
    });
  }

  /** Quem libera não pode ser quem pediu (dupla checagem), e a PT não pode ter vencido. */
  async liberar(ctx: Contexto, dados: ComId): Promise<PermissaoDeTrabalho> {
    const { versao } = validar(liberarPtSchema, dados?.alteracoes);
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.status !== 'solicitada')
      throw regra(`Só PT solicitada é liberada; esta está ${atual.status}.`);
    if (atual.criadoPor === ctx.usuarioId)
      throw regra(
        'Quem solicitou a PT não pode liberá-la: peça a outra pessoa autorizada.',
      );
    if (atual.fim <= agoraEmBrasilia())
      throw regra('O horário da PT já passou. Cancele e emita outra.');
    return this.gravar(ctx, atual.id, versao, {
      status: 'liberada',
      liberadaPor: ctx.usuarioId,
      liberadaEm: new Date(),
    });
  }

  async encerrar(ctx: Contexto, dados: ComId): Promise<PermissaoDeTrabalho> {
    const { versao, observacao } = validar(encerrarPtSchema, dados?.alteracoes);
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.status !== 'liberada') throw regra('Só PT liberada é encerrada.');
    return this.gravar(ctx, atual.id, versao, {
      status: 'encerrada',
      encerradaEm: new Date(),
      observacaoEncerramento: observacao,
    });
  }

  async cancelar(ctx: Contexto, dados: ComId): Promise<PermissaoDeTrabalho> {
    const { versao, motivo } = validar(cancelarPtSchema, dados?.alteracoes);
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.status === 'encerrada' || atual.status === 'cancelada')
      throw regra(`Esta PT já está ${atual.status}.`);
    return this.gravar(ctx, atual.id, versao, {
      status: 'cancelada',
      motivoCancelamento: motivo,
    });
  }

  async resumo(ctx: Contexto): Promise<ResumoPts> {
    const agora = agoraEmBrasilia();
    const linhas = await this.db
      .select({ status: pts.status, fim: pts.fim })
      .from(pts)
      .where(
        and(
          eq(pts.empresaId, ctx.empresaId),
          sql`${pts.status} IN ('solicitada', 'liberada')`,
        ),
      );
    return {
      aguardandoLiberacao: linhas.filter((l) => l.status === 'solicitada')
        .length,
      emExecucao: linhas.filter((l) => l.status === 'liberada' && l.fim > agora)
        .length,
      vencidas: linhas.filter((l) => l.status === 'liberada' && l.fim <= agora)
        .length,
    };
  }

  private async buscar(ctx: Contexto, id: unknown): Promise<Linha> {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(pts)
          .where(and(eq(pts.id, id), eq(pts.empresaId, ctx.empresaId)))
      : [];
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Permissão de trabalho não encontrada.',
      );
    return l;
  }

  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof pts.$inferInsert>,
  ): Promise<PermissaoDeTrabalho> {
    const lida = new Date(versao);
    const [l] = Number.isNaN(lida.getTime())
      ? []
      : await this.db
          .update(pts)
          .set({ ...valores, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(pts.id, id),
              eq(pts.empresaId, ctx.empresaId),
              eq(pts.atualizadoEm, lida),
            ),
          )
          .returning();
    if (!l)
      throw new ErroDeNegocio(
        'CONFLITO',
        'Esta PT foi alterada por outra pessoa. Recarregue a página.',
      );
    return montar(l, ctx, agoraEmBrasilia());
  }
}

function regra(mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio('REGRA_DE_NEGOCIO', mensagem);
}

function invalido(campo: string, mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio(
    'DADOS_INVALIDOS',
    'Verifique os campos destacados.',
    [{ campo, mensagem }],
  );
}

function montar(l: Linha, ctx: Contexto, agora: string): PermissaoDeTrabalho {
  return {
    id: l.id,
    numero: l.numero,
    tipo: l.tipo as TipoPt,
    local: l.local,
    servico: l.servico,
    executantes: l.executantes,
    inicio: l.inicio,
    fim: l.fim,
    riscos: l.riscos,
    epis: l.epis,
    status: l.status as StatusPt,
    vencida: l.status === 'liberada' && l.fim <= agora,
    solicitadaPorMim: l.criadoPor === ctx.usuarioId,
    liberadaEm: l.liberadaEm?.toISOString() ?? null,
    encerradaEm: l.encerradaEm?.toISOString() ?? null,
    observacaoEncerramento: l.observacaoEncerramento,
    motivoCancelamento: l.motivoCancelamento,
    versao: l.atualizadoEm.toISOString(),
  };
}
