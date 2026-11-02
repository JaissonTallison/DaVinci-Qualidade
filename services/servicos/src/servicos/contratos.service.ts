import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  somarMeses,
  validar,
} from '@davinci/shared';
import {
  analiseDoContratoSchema,
  atualizarContratoSchema,
  atualizarRequisitoDoContratoSchema,
  DIAS_DE_AVISO_DO_CONTRATO,
  encerrarContratoSchema,
  indicadorDoSla,
  isUuid,
  novoContratoSchema,
  novoRequisitoDoContratoSchema,
  situacaoDoRequisitoDoContratoSchema,
  type ConclusaoDaAnalise,
  type Contexto,
  type Contrato,
  type RequisitoDoContrato,
  type SituacaoDoContrato,
  type SituacaoDoRequisitoDoContrato,
  type TipoDeRequisitoDoContrato,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  contratos,
  ordensServico as os,
  requisitosContrato,
  sequencias,
} from '../db/schema.js';
import { noPrazo, ServicosService } from './servicos.service.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
type Linha = typeof contratos.$inferSelect;

/** Contratos com cliente e o SLA medido nas OS do contrato. */
@Injectable()
export class ContratosService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly servicos: ServicosService,
  ) {}

  async listar(ctx: Contexto): Promise<Contrato[]> {
    const linhas = await this.db
      .select()
      .from(contratos)
      .where(eq(contratos.empresaId, ctx.empresaId))
      .orderBy(desc(contratos.fim));
    return this.montar(ctx, linhas);
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Contrato> {
    return (await this.montar(ctx, [await this.buscar(ctx, dados?.id)]))[0]!;
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Contrato> {
    const n = validar(novoContratoSchema, dados);
    const cliente = await this.servicos.parceiro(
      ctx,
      n.clienteId,
      'cliente',
      'clienteId',
    );
    const ano = hojeEmBrasilia().slice(0, 4);
    const l = await this.db.transaction(async (tx) => {
      const [{ ultimo }] = (await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `CT-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo })) as [{ ultimo: number }];
      const [nova] = await tx
        .insert(contratos)
        .values({
          ...n,
          clienteNome: cliente.nomeFantasia ?? cliente.nome,
          numero: `CT-${ano}-${String(ultimo).padStart(3, '0')}`,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return nova!;
    });
    return (await this.montar(ctx, [l]))[0]!;
  }

  /** Revisar ou renovar (mudar o fim). Encerrado não muda. */
  async atualizar(ctx: Contexto, dados: ComId): Promise<Contrato> {
    const { versao, ...n } = validar(
      atualizarContratoSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.encerradoEm)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Contrato encerrado não muda.',
      );
    return this.gravar(ctx, atual.id, versao, n);
  }

  async encerrar(ctx: Contexto, dados: ComId): Promise<Contrato> {
    const { versao, motivo } = validar(
      encerrarContratoSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.encerradoEm)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Este contrato já está encerrado.',
      );
    return this.gravar(ctx, atual.id, versao, {
      motivoEncerramento: motivo,
      encerradoEm: new Date(),
    });
  }

  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof contratos.$inferInsert>,
  ): Promise<Contrato> {
    const [l] = await this.db
      .update(contratos)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(eq(contratos.id, id), eq(contratos.atualizadoEm, new Date(versao))),
      )
      .returning();
    if (!l)
      throw new ErroDeNegocio(
        'CONFLITO',
        'Este contrato foi alterado por outra pessoa. Recarregue a página.',
      );
    return (await this.montar(ctx, [l]))[0]!;
  }

  private async buscar(ctx: Contexto, id: unknown): Promise<Linha> {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(contratos)
          .where(
            and(eq(contratos.id, id), eq(contratos.empresaId, ctx.empresaId)),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Contrato não encontrado.');
    return l;
  }

  /** SLA dos últimos 12 meses: OS do contrato concluídas, e quantas no prazo. */
  private async montar(ctx: Contexto, linhas: Linha[]): Promise<Contrato[]> {
    const ids = linhas.map((l) => l.id);
    const ordens = ids.length
      ? await this.db
          .select({
            contratoId: os.contratoId,
            status: os.status,
            prazo: os.prazo,
            concluidaEm: os.concluidaEm,
          })
          .from(os)
          .where(
            and(eq(os.empresaId, ctx.empresaId), inArray(os.contratoId, ids)),
          )
      : [];
    const requisitos = ids.length
      ? await this.db
          .select()
          .from(requisitosContrato)
          .where(
            and(
              eq(requisitosContrato.empresaId, ctx.empresaId),
              inArray(requisitosContrato.contratoId, ids),
            ),
          )
          .orderBy(requisitosContrato.criadoEm)
      : [];
    const hoje = hojeEmBrasilia();
    const desde = new Date(`${somarMeses(hoje, -12)}T03:00:00Z`);
    return linhas.map((l) => {
      const doContrato = ordens.filter((o) => o.contratoId === l.id);
      const concluidas = doContrato
        .filter(
          (o) =>
            o.status === 'concluida' && o.concluidaEm && o.concluidaEm >= desde,
        )
        .map((o) => ({ noPrazo: noPrazo(o) === true }));
      return {
        id: l.id,
        numero: l.numero,
        clienteId: l.clienteId,
        clienteNome: l.clienteNome,
        objeto: l.objeto,
        inicio: l.inicio,
        fim: l.fim,
        prazoAtendimentoDias: l.prazoAtendimentoDias,
        metaNoPrazo: l.metaNoPrazo,
        valorMensal: l.valorMensal,
        observacoes: l.observacoes,
        situacao: situacaoDoContrato(l, hoje),
        motivoEncerramento: l.motivoEncerramento,
        sla: indicadorDoSla(concluidas, l.metaNoPrazo),
        osAbertas: doContrato.filter(
          (o) => o.status === 'aberta' || o.status === 'em_execucao',
        ).length,
        requisitos: requisitos
          .filter((r) => r.contratoId === l.id)
          .map(montarRequisito),
        analiseData: l.analiseData,
        analiseResponsavel: l.analiseResponsavel,
        analiseConclusao: l.analiseConclusao as ConclusaoDaAnalise | null,
        analiseParecer: l.analiseParecer,
        versao: l.atualizadoEm.toISOString(),
      };
    });
  }

  /** Registra ou revê a análise crítica dos requisitos (ISO 9001 8.2.3). */
  async analisar(ctx: Contexto, dados: ComId): Promise<Contrato> {
    const { versao, conclusao, responsavel, parecer } = validar(
      analiseDoContratoSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.encerradoEm)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Contrato encerrado não muda.',
      );
    return this.gravar(ctx, atual.id, versao, {
      analiseData: hojeEmBrasilia(),
      analiseResponsavel: responsavel,
      analiseConclusao: conclusao,
      analiseParecer: parecer,
    });
  }

  async criarRequisito(
    ctx: Contexto,
    dados: { contratoId?: unknown } & Record<string, unknown>,
  ): Promise<Contrato> {
    const n = validar(novoRequisitoDoContratoSchema, dados);
    const contrato = await this.buscar(ctx, dados?.contratoId);
    if (contrato.encerradoEm)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Contrato encerrado não recebe requisito.',
      );
    await this.db.insert(requisitosContrato).values({
      ...n,
      contratoId: contrato.id,
      empresaId: ctx.empresaId,
      criadoPor: ctx.usuarioId,
      atualizadoPor: ctx.usuarioId,
    });
    return this.obter(ctx, { id: contrato.id });
  }

  async atualizarRequisito(ctx: Contexto, dados: ComId): Promise<Contrato> {
    const { versao, ...campos } = validar(
      atualizarRequisitoDoContratoSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscarRequisito(ctx, dados?.id);
    return this.gravarRequisito(ctx, atual, versao, campos);
  }

  async situacaoRequisito(ctx: Contexto, dados: ComId): Promise<Contrato> {
    const { versao, situacao } = validar(
      situacaoDoRequisitoDoContratoSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscarRequisito(ctx, dados?.id);
    return this.gravarRequisito(ctx, atual, versao, { situacao });
  }

  async removerRequisito(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<Contrato> {
    const atual = await this.buscarRequisito(ctx, dados?.id);
    await this.db
      .delete(requisitosContrato)
      .where(
        and(
          eq(requisitosContrato.id, atual.id),
          eq(requisitosContrato.empresaId, ctx.empresaId),
        ),
      );
    return this.obter(ctx, { id: atual.contratoId });
  }

  private async buscarRequisito(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(requisitosContrato)
          .where(
            and(
              eq(requisitosContrato.id, id),
              eq(requisitosContrato.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Requisito não encontrado.');
    return l;
  }

  private async gravarRequisito(
    ctx: Contexto,
    atual: typeof requisitosContrato.$inferSelect,
    versao: string,
    valores: Partial<typeof requisitosContrato.$inferInsert>,
  ): Promise<Contrato> {
    const [l] = await this.db
      .update(requisitosContrato)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(
          eq(requisitosContrato.id, atual.id),
          eq(requisitosContrato.atualizadoEm, new Date(versao)),
        ),
      )
      .returning();
    if (!l)
      throw new ErroDeNegocio(
        'CONFLITO',
        'Este requisito foi alterado por outra pessoa. Recarregue a página.',
      );
    return this.obter(ctx, { id: l.contratoId });
  }
}

function montarRequisito(
  l: typeof requisitosContrato.$inferSelect,
): RequisitoDoContrato {
  return {
    id: l.id,
    tipo: l.tipo as TipoDeRequisitoDoContrato,
    descricao: l.descricao,
    criterioAceitacao: l.criterioAceitacao,
    obrigatorio: l.obrigatorio,
    situacao: l.situacao as SituacaoDoRequisitoDoContrato,
    evidencia: l.evidencia,
    versao: l.atualizadoEm.toISOString(),
  };
}

export function situacaoDoContrato(
  l: { encerradoEm: Date | null; fim: string },
  hoje: string,
): SituacaoDoContrato {
  if (l.encerradoEm) return 'encerrado';
  if (l.fim < hoje) return 'vencido';
  return l.fim <= somarDias(hoje, DIAS_DE_AVISO_DO_CONTRATO)
    ? 'vence_em_breve'
    : 'vigente';
}
