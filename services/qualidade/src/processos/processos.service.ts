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
  novoVinculoSchema,
  publicarProcessoSchema,
  removerVinculoSchema,
  gerarIaDiagramaSchema,
  salvarDiagramaProcessoSchema,
  type AcaoProcesso,
  type Contexto,
  type DiagramaProcesso,
  type EventoDoProcesso,
  type TipoVinculo,
  type VinculoDoProcesso,
  type Processo,
  type ProcessoComRevisoes,
  type RevisaoDoProcesso,
  type StatusProcesso,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  processos,
  processosEventos,
  processosRevisoes,
  processosVinculos,
} from '../db/schema.js';
import { gerarDiagramaComClaude } from './ia.js';

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
    const [revs, vinculos, eventos] = await Promise.all([
      this.db
        .select()
        .from(processosRevisoes)
        .where(eq(processosRevisoes.processoId, l.id))
        .orderBy(desc(processosRevisoes.revisao)),
      this.db
        .select()
        .from(processosVinculos)
        .where(eq(processosVinculos.processoId, l.id))
        .orderBy(desc(processosVinculos.criadoEm)),
      this.db
        .select()
        .from(processosEventos)
        .where(eq(processosEventos.processoId, l.id))
        .orderBy(desc(processosEventos.criadoEm)),
    ]);
    return {
      ...montar(l, ctx, hojeEmBrasilia()),
      revisoes: revs.map(montarRevisao),
      vinculos: vinculos.map(montarVinculo),
      eventos: eventos.map(montarEvento),
    };
  }

  /** Registra uma ação na trilha de auditoria. */
  private async registrarEvento(
    ctx: Contexto,
    processoId: string,
    acao: AcaoProcesso,
    comentario?: string | null,
  ): Promise<void> {
    await this.db.insert(processosEventos).values({
      processoId,
      acao,
      usuarioNome: ctx.usuarioNome ?? null,
      comentario: comentario ?? null,
      ...autoria(ctx),
    });
  }

  async adicionarVinculo(
    ctx: Contexto,
    dados: ComId,
  ): Promise<ProcessoComRevisoes> {
    const v = validar(novoVinculoSchema, dados?.alteracoes);
    const atual = await this.processo(ctx, dados?.id);
    await this.db
      .insert(processosVinculos)
      .values({
        processoId: atual.id,
        tipo: v.tipo,
        registroId: v.registroId,
        rotulo: v.rotulo,
        ...autoria(ctx),
      })
      .onConflictDoNothing();
    return this.obter(ctx, { id: atual.id });
  }

  async removerVinculo(
    ctx: Contexto,
    dados: ComId,
  ): Promise<ProcessoComRevisoes> {
    const { vinculoId } = validar(removerVinculoSchema, dados?.alteracoes);
    const atual = await this.processo(ctx, dados?.id);
    await this.db
      .delete(processosVinculos)
      .where(
        and(
          eq(processosVinculos.id, vinculoId),
          eq(processosVinculos.processoId, atual.id),
          eq(processosVinculos.empresaId, ctx.empresaId),
        ),
      );
    return this.obter(ctx, { id: atual.id });
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Processo> {
    const novo = validar(novoProcessoSchema, dados);
    const [l] = await this.db
      .insert(processos)
      .values({ ...comNulos(novo), ...autoria(ctx) })
      .returning();
    await this.registrarEvento(ctx, l!.id, 'criado');
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
    const r = await this.gravar(ctx, atual.id, versao, { status: 'em_revisao' });
    await this.registrarEvento(ctx, atual.id, 'enviado_revisao');
    return r;
  }

  /** Aprova a revisão: vira aprovado e gera a linha no histórico. Quem elaborou não aprova. */
  async aprovar(ctx: Contexto, dados: ComId): Promise<ProcessoComRevisoes> {
    const { versao, dataProximaRevisao, parecer } = validar(
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
      await tx.insert(processosEventos).values({
        processoId: atual.id,
        acao: 'aprovado',
        usuarioNome: nome,
        comentario: parecer ?? null,
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
    const r = await this.gravar(ctx, atual.id, versao, {
      status: 'publicado',
      publicadoEm: new Date(),
    });
    await this.registrarEvento(ctx, atual.id, 'publicado');
    return r;
  }

  async novaRevisao(ctx: Contexto, dados: ComId): Promise<Processo> {
    const { versao, oQueMudou } = validar(
      novaRevisaoProcessoSchema,
      dados?.alteracoes,
    );
    const atual = await this.processo(ctx, dados?.id);
    if (atual.status !== 'publicado' && atual.status !== 'aprovado')
      throw regra('Só processo aprovado ou publicado abre nova revisão.');
    const r = await this.gravar(ctx, atual.id, versao, {
      status: 'em_elaboracao',
      oQueMudouPendente: oQueMudou,
    });
    await this.registrarEvento(ctx, atual.id, 'nova_revisao', oQueMudou);
    return r;
  }

  async encerrar(ctx: Contexto, dados: ComId): Promise<Processo> {
    const { versao, motivo } = validar(
      encerrarProcessoSchema,
      dados?.alteracoes,
    );
    const atual = await this.processo(ctx, dados?.id);
    if (atual.status !== 'aprovado' && atual.status !== 'publicado')
      throw regra('Só processo aprovado ou publicado se torna obsoleto.');
    const r = await this.gravar(ctx, atual.id, versao, {
      status: 'obsoleto',
      motivoEncerramento: motivo,
    });
    await this.registrarEvento(ctx, atual.id, 'obsoleto', motivo);
    return r;
  }

  /** Gera um rascunho de diagrama a partir de texto, com o provedor de IA do Claude. */
  async gerarIaDiagrama(
    ctx: Contexto,
    dados: unknown,
  ): Promise<DiagramaProcesso> {
    void ctx;
    const { texto } = validar(gerarIaDiagramaSchema, dados);
    return gerarDiagramaComClaude(texto);
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
    const r = await this.gravar(ctx, atual.id, versao, {
      status: 'cancelado',
      motivoEncerramento: motivo,
    });
    await this.registrarEvento(ctx, atual.id, 'cancelado', motivo);
    return r;
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

function montarEvento(
  l: typeof processosEventos.$inferSelect,
): EventoDoProcesso {
  return {
    id: l.id,
    acao: l.acao as EventoDoProcesso['acao'],
    usuarioNome: l.usuarioNome,
    comentario: l.comentario,
    criadoEm: l.criadoEm.toISOString(),
  };
}

function montarVinculo(
  l: typeof processosVinculos.$inferSelect,
): VinculoDoProcesso {
  return {
    id: l.id,
    tipo: l.tipo as TipoVinculo,
    registroId: l.registroId,
    rotulo: l.rotulo,
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
