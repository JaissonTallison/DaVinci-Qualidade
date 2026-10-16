import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  filtroPerguntasSchema,
  isUuid,
  noPack,
  novaPerguntaPropriaSchema,
  PACKS_ANTI_NC,
  type PackAntiNc,
  responderPerguntaSchema,
  RESPOSTAS_DA_PERGUNTA,
  selecionarPerguntasSchema,
  type Contexto,
  type Norma,
  type PerguntaDaAuditoria,
  type PerguntaDeRoteiro,
  type ProcessoAuditado,
  type RespostaDaPergunta,
  type RoteiroDaAuditoria,
} from '@davinci/types';
import { BANCO_DE_PERGUNTAS } from '../conteudo/perguntas.js';
import * as schema from '../db/schema.js';
import {
  auditorias,
  perguntasDaAuditoria,
  perguntasProprias,
} from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Roteiros de entrevista: banco de perguntas + perguntas próprias, o roteiro de cada auditoria e as respostas. */
@Injectable()
export class RoteiroService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listarPerguntas(
    ctx: Contexto,
    dados: unknown,
  ): Promise<PerguntaDeRoteiro[]> {
    const f = validar(filtroPerguntasSchema, dados ?? {});
    const proprias = (
      await this.db
        .select()
        .from(perguntasProprias)
        .where(eq(perguntasProprias.empresaId, ctx.empresaId))
        .orderBy(asc(perguntasProprias.criadoEm))
    ).map(propria);
    const termo = f.busca ? normalizar(f.busca) : null;
    return [...BANCO_DE_PERGUNTAS, ...proprias].filter(
      (p) =>
        (!f.pack ||
          !(f.pack in PACKS_ANTI_NC) ||
          noPack(f.pack as PackAntiNc, p.norma, p.clausula)) &&
        (!f.processo || p.processo === f.processo) &&
        (!f.norma || p.norma === f.norma) &&
        (!f.clausula ||
          p.clausula === f.clausula ||
          p.clausula.startsWith(`${f.clausula}.`)) &&
        (!termo ||
          normalizar(
            `${p.pergunta} ${p.respostaEsperada} ${p.sinalDeAlerta} ${p.clausula}`,
          ).includes(termo)),
    );
  }

  async criarPropria(
    ctx: Contexto,
    dados: unknown,
  ): Promise<PerguntaDeRoteiro> {
    const n = validar(novaPerguntaPropriaSchema, dados);
    const [l] = await this.db
      .insert(perguntasProprias)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return propria(l!);
  }

  /** Apaga do banco da empresa; as auditorias que já usaram guardam a cópia. */
  async excluirPropria(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<{ ok: true }> {
    const id = dados?.id;
    const [l] = isUuid(id)
      ? await this.db
          .delete(perguntasProprias)
          .where(
            and(
              eq(perguntasProprias.id, id),
              eq(perguntasProprias.empresaId, ctx.empresaId),
            ),
          )
          .returning()
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Pergunta não encontrada.');
    return { ok: true };
  }

  async obterRoteiro(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<RoteiroDaAuditoria> {
    const a = await this.auditoria(ctx, dados?.id);
    const linhas = await this.db
      .select()
      .from(perguntasDaAuditoria)
      .where(eq(perguntasDaAuditoria.auditoriaId, a.id))
      .orderBy(asc(perguntasDaAuditoria.ordem));
    const perguntas = linhas.map((l): PerguntaDaAuditoria => ({
      codigo: l.codigo,
      origem: l.origem as PerguntaDaAuditoria['origem'],
      processo: l.processo as ProcessoAuditado,
      norma: l.norma as Norma,
      clausula: l.clausula,
      pergunta: l.pergunta,
      objetivo: l.objetivo,
      respostaEsperada: l.respostaEsperada,
      sinalDeAlerta: l.sinalDeAlerta,
      ordem: l.ordem,
      resposta: l.resposta as RespostaDaPergunta,
      evidencia: l.evidencia,
      respondidaEm: l.respondidaEm?.toISOString() ?? null,
    }));
    const contagem = Object.fromEntries(
      Object.keys(RESPOSTAS_DA_PERGUNTA).map((r) => [
        r,
        perguntas.filter((p) => p.resposta === r).length,
      ]),
    ) as Record<RespostaDaPergunta, number>;
    return {
      auditoriaId: a.id,
      perguntas,
      contagem,
      somenteLeitura: encerrada(a.status),
    };
  }

  /** Inclui perguntas do banco ou próprias e retira as ainda sem resposta. */
  async selecionar(ctx: Contexto, dados: ComId): Promise<RoteiroDaAuditoria> {
    const { incluir, retirar } = validar(
      selecionarPerguntasSchema,
      dados?.alteracoes,
    );
    const a = await this.auditoria(ctx, dados?.id);
    if (encerrada(a.status))
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Auditoria encerrada: o roteiro não muda mais.',
      );
    const disponiveis = await this.listarPerguntas(ctx, {});
    const atuais = await this.db
      .select()
      .from(perguntasDaAuditoria)
      .where(eq(perguntasDaAuditoria.auditoriaId, a.id));
    const desconhecidas = incluir.filter(
      (c) => !disponiveis.some((p) => p.codigo === c),
    );
    if (desconhecidas.length)
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        `Pergunta desconhecida: ${desconhecidas.join(', ')}.`,
      );
    const respondidas = atuais.filter(
      (l) => retirar.includes(l.codigo) && l.resposta !== 'pendente',
    );
    if (respondidas.length)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Pergunta já respondida não sai do roteiro: ela faz parte do registro da auditoria.',
      );
    await this.db.transaction(async (tx) => {
      if (retirar.length)
        await tx
          .delete(perguntasDaAuditoria)
          .where(
            and(
              eq(perguntasDaAuditoria.auditoriaId, a.id),
              inArray(perguntasDaAuditoria.codigo, retirar),
            ),
          );
      let ordem = Math.max(0, ...atuais.map((l) => l.ordem));
      const novas = incluir.filter((c) => !atuais.some((l) => l.codigo === c));
      for (const codigo of novas) {
        const p = disponiveis.find((x) => x.codigo === codigo)!;
        await tx.insert(perguntasDaAuditoria).values({
          auditoriaId: a.id,
          codigo,
          origem: p.origem,
          ordem: ++ordem,
          processo: p.processo,
          norma: p.norma,
          clausula: p.clausula,
          pergunta: p.pergunta,
          objetivo: p.objetivo,
          respostaEsperada: p.respostaEsperada,
          sinalDeAlerta: p.sinalDeAlerta,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        });
      }
    });
    return this.obterRoteiro(ctx, { id: a.id });
  }

  /** Resposta na execução: só com a auditoria em andamento; Parcial e Não conforme exigem evidência. */
  async responder(ctx: Contexto, dados: ComId): Promise<RoteiroDaAuditoria> {
    const { codigo, resposta, evidencia } = validar(
      responderPerguntaSchema,
      dados?.alteracoes,
    );
    const a = await this.auditoria(ctx, dados?.id);
    if (a.status !== 'em_andamento')
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Inicie a auditoria para registrar as respostas.',
      );
    const [l] = await this.db
      .update(perguntasDaAuditoria)
      .set({
        resposta,
        evidencia,
        respondidaEm: resposta === 'pendente' ? null : new Date(),
        atualizadoPor: ctx.usuarioId,
      })
      .where(
        and(
          eq(perguntasDaAuditoria.auditoriaId, a.id),
          eq(perguntasDaAuditoria.codigo, codigo),
        ),
      )
      .returning();
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Esta pergunta não está no roteiro da auditoria.',
      );
    return this.obterRoteiro(ctx, { id: a.id });
  }

  private async auditoria(ctx: Contexto, id: unknown) {
    const [a] = isUuid(id)
      ? await this.db
          .select()
          .from(auditorias)
          .where(
            and(eq(auditorias.id, id), eq(auditorias.empresaId, ctx.empresaId)),
          )
      : [];
    if (!a)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Auditoria não encontrada.');
    return a;
  }
}

const encerrada = (status: string) =>
  status === 'concluida' || status === 'cancelada';
const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function propria(l: typeof perguntasProprias.$inferSelect): PerguntaDeRoteiro {
  return {
    codigo: l.id,
    origem: 'propria',
    processo: l.processo as ProcessoAuditado,
    norma: l.norma as Norma,
    clausula: l.clausula,
    pergunta: l.pergunta,
    objetivo: l.objetivo,
    respostaEsperada: l.respostaEsperada,
    sinalDeAlerta: l.sinalDeAlerta,
  };
}
