import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { DATABASE, type Database, ordemAlfabetica } from '@davinci/database';
import { ErroDeNegocio, hojeEmBrasilia, validar } from '@davinci/shared';
import {
  aprovarProcessoSchema,
  atualizarProcessoSchema,
  cancelarProcessoSchema,
  encerrarProcessoSchema,
  enviarRevisaoProcessoSchema,
  filtroProcessosSchema,
  isUuid,
  novaRevisaoProcessoSchema,
  novoProcessoSchema,
  publicarProcessoSchema,
  salvarDiagramaProcessoSchema,
  type Contexto,
  type DiagramaProcesso,
  type Processo,
  type ProcessoComRevisoes,
  type RevisaoDoProcesso,
  type StatusProcesso,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { processos, processosRevisoes } from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const CONFLITO =
  'Este registro foi alterado por outra pessoa ou não existe. Recarregue a página.';

@Injectable()
export class ProcessosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<Processo[]> {
    const f = validar(filtroProcessosSchema, dados ?? {});
    const c: SQL[] = [eq(processos.empresaId, ctx.empresaId)];
    if (f.status) c.push(eq(processos.status, f.status));
    const hoje = hojeEmBrasilia();
    return (
      await this.db
        .select()
        .from(processos)
        .where(and(...c))
        .orderBy(ordemAlfabetica(processos.codigo))
    ).map((l) => montar(l, ctx, hoje));
  }

  async obter(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<ProcessoComRevisoes> {
    const l = await this.processo(ctx, dados?.id);
    const revs = await this.db
      .select()
      .from(processosRevisoes)
      .where(eq(processosRevisoes.processoId, l.id))
      .orderBy(desc(processosRevisoes.revisao));
    return {
      ...montar(l, ctx, hojeEmBrasilia()),
      revisoes: revs.map(montarRevisao),
    };
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Processo> {
    const novo = validar(novoProcessoSchema, dados);
    const [l] = await this.db
      .insert(processos)
      .values({ ...comNulos(novo), ...autoria(ctx) })
      .returning();
    return montar(l!, ctx, hojeEmBrasilia());
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<Processo> {
    const { versao, ...campos } = validar(
      atualizarProcessoSchema,
      dados?.alteracoes,
    );
    const atual = await this.processo(ctx, dados?.id);
    if (atual.status !== 'em_elaboracao' && atual.status !== 'em_revisao')
      throw regra('Só processo em elaboração ou em revisão pode ser editado.');
    return this.gravar(ctx, atual.id, versao, comNulos(campos));
  }

  async enviarRevisao(ctx: Contexto, dados: ComId): Promise<Processo> {
    const { versao } = validar(enviarRevisaoProcessoSchema, dados?.alteracoes);
    const atual = await this.processo(ctx, dados?.id);
    if (atual.status !== 'em_elaboracao')
      throw regra('Só um processo em elaboração é enviado para revisão.');
    return this.gravar(ctx, atual.id, versao, { status: 'em_revisao' });
  }

  /** Aprova a revisão: vira aprovado e gera a linha no histórico. Quem elaborou não aprova. */
  async aprovar(ctx: Contexto, dados: ComId): Promise<ProcessoComRevisoes> {
    const { versao, dataProximaRevisao } = validar(
      aprovarProcessoSchema,
      dados?.alteracoes,
    );
    const atual = await this.processo(ctx, dados?.id);
    if (atual.status !== 'em_revisao')
      throw regra('Só processo em revisão é aprovado.');
    if (atual.criadoPor === ctx.usuarioId)
      throw regra(
        'Quem elaborou o processo não aprova a própria revisão: peça a outro gestor.',
      );
    const revisao = atual.revisaoAtual + 1;
    const nome = ctx.usuarioNome ?? null;
    const agora = new Date();
    await this.db.transaction(async (tx) => {
      const [l] = await tx
        .update(processos)
        .set({
          status: 'aprovado',
          revisaoAtual: revisao,
          aprovadoPor: ctx.usuarioId,
          aprovadoPorNome: nome,
          aprovadoEm: agora,
          dataProximaRevisao: dataProximaRevisao ?? null,
          oQueMudouPendente: null,
          atualizadoPor: ctx.usuarioId,
        })
        .where(
          and(
            eq(processos.id, atual.id),
            eq(processos.atualizadoEm, new Date(versao)),
          ),
        )
        .returning();
      if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
      await tx.insert(processosRevisoes).values({
        processoId: atual.id,
        revisao,
        oQueMudou: atual.oQueMudouPendente ?? 'Emissão inicial',
        elaboradoPor: atual.elaboradoPor,
        aprovadoPorNome: nome,
        aprovadoEm: agora,
        conteudo: atual.conteudo ?? null,
        ...autoria(ctx),
      });
    });
    return this.obter(ctx, { id: atual.id });
  }

  async publicar(ctx: Contexto, dados: ComId): Promise<Processo> {
    const { versao } = validar(publicarProcessoSchema, dados?.alteracoes);
    const atual = await this.processo(ctx, dados?.id);
    if (atual.status !== 'aprovado')
      throw regra('Só um processo aprovado é publicado.');
    return this.gravar(ctx, atual.id, versao, {
      status: 'publicado',
      publicadoEm: new Date(),
    });
  }

  async novaRevisao(ctx: Contexto, dados: ComId): Promise<Processo> {
    const { versao, oQueMudou } = validar(
      novaRevisaoProcessoSchema,
      dados?.alteracoes,
    );
    const atual = await this.processo(ctx, dados?.id);
    if (atual.status !== 'publicado' && atual.status !== 'aprovado')
      throw regra('Só processo aprovado ou publicado abre nova revisão.');
    return this.gravar(ctx, atual.id, versao, {
      status: 'em_elaboracao',
      oQueMudouPendente: oQueMudou,
    });
  }

  async encerrar(ctx: Contexto, dados: ComId): Promise<Processo> {
    const { versao, motivo } = validar(
      encerrarProcessoSchema,
      dados?.alteracoes,
    );
    const atual = await this.processo(ctx, dados?.id);
    if (atual.status !== 'aprovado' && atual.status !== 'publicado')
      throw regra('Só processo aprovado ou publicado se torna obsoleto.');
    return this.gravar(ctx, atual.id, versao, {
      status: 'obsoleto',
      motivoEncerramento: motivo,
    });
  }

  /** Salva o conteúdo do diagrama (nós/conexões). Só com o processo editável. */
  async salvarDiagrama(ctx: Contexto, dados: ComId): Promise<Processo> {
    const { versao, conteudo } = validar(
      salvarDiagramaProcessoSchema,
      dados?.alteracoes,
    );
    const atual = await this.processo(ctx, dados?.id);
    if (atual.status !== 'em_elaboracao' && atual.status !== 'em_revisao')
      throw regra(
        'O diagrama só pode ser editado com o processo em elaboração ou em revisão.',
      );
    return this.gravar(ctx, atual.id, versao, {
      conteudo: conteudo as DiagramaProcesso,
    });
  }

  async cancelar(ctx: Contexto, dados: ComId): Promise<Processo> {
    const { versao, motivo } = validar(
      cancelarProcessoSchema,
      dados?.alteracoes,
    );
    const atual = await this.processo(ctx, dados?.id);
    if (atual.status !== 'em_elaboracao' && atual.status !== 'em_revisao')
      throw regra('Só processo em elaboração ou em revisão pode ser cancelado.');
    return this.gravar(ctx, atual.id, versao, {
      status: 'cancelado',
      motivoEncerramento: motivo,
    });
  }

  private async processo(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(processos)
          .where(
            and(eq(processos.id, id), eq(processos.empresaId, ctx.empresaId)),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Processo não encontrado.');
    return l;
  }

  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof processos.$inferInsert>,
  ): Promise<Processo> {
    const [l] = await this.db
      .update(processos)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(eq(processos.id, id), eq(processos.atualizadoEm, new Date(versao))),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montar(l, ctx, hojeEmBrasilia());
  }
}

const autoria = (ctx: Contexto) => ({
  empresaId: ctx.empresaId,
  criadoPor: ctx.usuarioId,
  atualizadoPor: ctx.usuarioId,
});
const regra = (m: string) => new ErroDeNegocio('REGRA_DE_NEGOCIO', m);

/** Campos do processo com os opcionais de texto coeridos para null (vazio = null). */
function comNulos(c: {
  codigo: string;
  nome: string;
  elaboradoPor: string;
  descricao?: string | null;
  objetivo?: string | null;
  escopo?: string | null;
  unidade?: string | null;
  departamento?: string | null;
  gestor?: string | null;
  normas?: string | null;
}) {
  return {
    codigo: c.codigo,
    nome: c.nome,
    elaboradoPor: c.elaboradoPor,
    descricao: c.descricao || null,
    objetivo: c.objetivo || null,
    escopo: c.escopo || null,
    unidade: c.unidade || null,
    departamento: c.departamento || null,
    gestor: c.gestor || null,
    normas: c.normas || null,
  };
}

function montar(
  l: typeof processos.$inferSelect,
  ctx: Contexto,
  hoje: string,
): Processo {
  return {
    id: l.id,
    codigo: l.codigo,
    nome: l.nome,
    descricao: l.descricao,
    objetivo: l.objetivo,
    escopo: l.escopo,
    unidade: l.unidade,
    departamento: l.departamento,
    gestor: l.gestor,
    elaboradoPor: l.elaboradoPor,
    normas: l.normas,
    status: l.status as StatusProcesso,
    revisaoAtual: l.revisaoAtual,
    oQueMudouPendente: l.oQueMudouPendente,
    aprovadoPorNome: l.aprovadoPorNome,
    aprovadoEm: l.aprovadoEm?.toISOString() ?? null,
    publicadoEm: l.publicadoEm?.toISOString() ?? null,
    dataProximaRevisao: l.dataProximaRevisao,
    motivoEncerramento: l.motivoEncerramento,
    conteudo: (l.conteudo as DiagramaProcesso | null) ?? null,
    revisaoVencida:
      l.status === 'publicado' &&
      Boolean(l.dataProximaRevisao && l.dataProximaRevisao < hoje),
    criadoPorMim: l.criadoPor === ctx.usuarioId,
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarRevisao(
  l: typeof processosRevisoes.$inferSelect,
): RevisaoDoProcesso {
  return {
    revisao: l.revisao,
    oQueMudou: l.oQueMudou,
    elaboradoPor: l.elaboradoPor,
    aprovadoPorNome: l.aprovadoPorNome,
    aprovadoEm: l.aprovadoEm.toISOString(),
  };
}
