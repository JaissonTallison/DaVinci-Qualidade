import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  pedir,
  somarDias,
  somarMeses,
  validar,
} from '@davinci/shared';
import {
  analisarReclamacaoSchema,
  CANAIS_DE_RECLAMACAO,
  DIAS_PARA_RESPONDER,
  encerrarReclamacaoSchema,
  filtroReclamacoesSchema,
  isUuid,
  novaReclamacaoSchema,
  PATTERNS,
  responderReclamacaoSchema,
  SERVICES,
  type Contexto,
  type NaoConformidade,
  type Reclamacao,
  type ResumoReclamacoes,
  type StatusDaReclamacao,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { reclamacoes as rc, sequencias } from '../db/schema.js';
import { ServicosService } from './servicos.service.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
type Linha = typeof rc.$inferSelect;
/** Prazo da NC aberta por reclamação procedente. */
const DIAS_DA_NC = 30;

/** Reclamações de clientes: aberta → analisada → respondida → encerrada. Procedente pode abrir NC na Qualidade. */
@Injectable()
export class ReclamacoesService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly servicos: ServicosService,
    @Inject(SERVICES.QUALIDADE)
    private readonly qualidade: Pick<ClientProxy, 'send'>,
  ) {}

  async listar(ctx: Contexto, dados: unknown): Promise<Reclamacao[]> {
    const f = validar(filtroReclamacoesSchema, dados ?? {});
    const c: SQL[] = [eq(rc.empresaId, ctx.empresaId)];
    if (f.status) c.push(eq(rc.status, f.status));
    if (f.clienteId) c.push(eq(rc.clienteId, f.clienteId));
    const linhas = await this.db
      .select()
      .from(rc)
      .where(and(...c))
      .orderBy(desc(rc.recebidaEm), desc(rc.numero));
    const hoje = hojeEmBrasilia();
    return linhas.map((l) => montar(l, hoje));
  }

  async resumo(ctx: Contexto): Promise<ResumoReclamacoes> {
    const desde = somarMeses(hojeEmBrasilia(), -12);
    const todas = (await this.listar(ctx, {})).filter(
      (r) => r.recebidaEm >= desde || r.status !== 'encerrada',
    );
    const analisadas = todas.filter((r) => r.procedente !== null);
    const respondidas = todas.filter((r) => r.respondidaEm);
    const encerradas = todas.filter((r) => r.clienteSatisfeito !== null);
    const dias = (de: string, ate: string) =>
      (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) /
      86_400_000;
    return {
      abertas: todas.filter((r) => r.status !== 'encerrada').length,
      atrasadas: todas.filter((r) => r.atrasada).length,
      procedentes: analisadas.length
        ? Math.round(
            (analisadas.filter((r) => r.procedente).length /
              analisadas.length) *
              100,
          )
        : null,
      tempoMedioResposta: respondidas.length
        ? Math.round(
            (respondidas.reduce(
              (t, r) => t + dias(r.recebidaEm, r.respondidaEm!),
              0,
            ) /
              respondidas.length) *
              10,
          ) / 10
        : null,
      satisfacao: encerradas.length
        ? Math.round(
            (encerradas.filter((r) => r.clienteSatisfeito).length /
              encerradas.length) *
              100,
          )
        : null,
    };
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Reclamacao> {
    return montar(await this.buscar(ctx, dados?.id), hojeEmBrasilia());
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Reclamacao> {
    const n = validar(novaReclamacaoSchema, dados);
    const hoje = hojeEmBrasilia();
    if (n.recebidaEm > hoje)
      throw invalido('recebidaEm', 'A data não pode estar no futuro.');
    if (n.prazoResposta && n.prazoResposta < n.recebidaEm)
      throw invalido(
        'prazoResposta',
        'O prazo não pode ser anterior ao recebimento.',
      );
    const cliente = await this.servicos.parceiro(
      ctx,
      n.clienteId,
      'cliente',
      'clienteId',
    );
    let osNumero: string | null = null;
    if (n.osId) {
      const o = await this.servicos.os(ctx, n.osId);
      if (o.clienteId !== n.clienteId)
        throw invalido('osId', 'Esta OS é de outro cliente.');
      osNumero = o.numero;
    }
    const ano = hoje.slice(0, 4);
    const l = await this.db.transaction(async (tx) => {
      const [{ ultimo }] = (await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `RCL-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo })) as [{ ultimo: number }];
      const [nova] = await tx
        .insert(rc)
        .values({
          ...n,
          osId: n.osId ?? null,
          osNumero,
          prazoResposta:
            n.prazoResposta ?? somarDias(n.recebidaEm, DIAS_PARA_RESPONDER),
          clienteNome: cliente.nomeFantasia ?? cliente.nome,
          numero: `RCL-${ano}-${String(ultimo).padStart(3, '0')}`,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return nova!;
    });
    return montar(l, hoje);
  }

  /** Análise de procedência. Procedente com "abrir NC" cria a NC na Qualidade (origem Reclamação de cliente). */
  async analisar(ctx: Contexto, dados: ComId): Promise<Reclamacao> {
    const a = validar(analisarReclamacaoSchema, dados?.alteracoes);
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.status !== 'aberta' && atual.status !== 'analisada')
      throw regra('A análise muda só antes da resposta ao cliente.');
    let nc: NaoConformidade | null = null;
    if (a.abrirNc && !atual.ncId)
      nc = await pedir<NaoConformidade>(
        this.qualidade,
        PATTERNS.naoConformidades.criar,
        {
          titulo: `Reclamação ${atual.numero}: ${atual.clienteNome}`.slice(
            0,
            150,
          ),
          descricao: [
            `Relato do cliente (${CANAIS_DE_RECLAMACAO[atual.canal as keyof typeof CANAIS_DE_RECLAMACAO].toLowerCase()}, ${atual.recebidaEm}): ${atual.descricao}`,
            `Análise: ${a.analise}`,
            atual.osNumero ? `Ordem de serviço: ${atual.osNumero}.` : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
          origem: 'reclamacao_cliente',
          origemRef: atual.numero,
          tipo: atual.produto ? 'produto' : 'servico',
          gravidade: a.gravidadeNc ?? 'media',
          produto: atual.produto ?? undefined,
          responsavel: a.responsavelNc,
          prazo: somarDias(hojeEmBrasilia(), DIAS_DA_NC),
        },
        ctx,
        'Qualidade',
      );
    return this.gravar(ctx, atual.id, a.versao, {
      procedente: a.procedente,
      analise: a.analise,
      analisadaEm: new Date(),
      status: 'analisada',
      ...(nc ? { ncId: nc.id, ncNumero: nc.numero } : {}),
    });
  }

  async responder(ctx: Contexto, dados: ComId): Promise<Reclamacao> {
    const { versao, resposta } = validar(
      responderReclamacaoSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.status !== 'analisada')
      throw regra('Analise a reclamação antes de responder ao cliente.');
    return this.gravar(ctx, atual.id, versao, {
      resposta,
      respondidaEm: hojeEmBrasilia(),
      status: 'respondida',
    });
  }

  async encerrar(ctx: Contexto, dados: ComId): Promise<Reclamacao> {
    const { versao, clienteSatisfeito, observacao } = validar(
      encerrarReclamacaoSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.status !== 'respondida')
      throw regra('Só se encerra a reclamação depois de responder ao cliente.');
    return this.gravar(ctx, atual.id, versao, {
      clienteSatisfeito,
      observacaoEncerramento: observacao,
      encerradaEm: new Date(),
      status: 'encerrada',
    });
  }

  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof rc.$inferInsert>,
  ): Promise<Reclamacao> {
    const [l] = await this.db
      .update(rc)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(and(eq(rc.id, id), eq(rc.atualizadoEm, new Date(versao))))
      .returning();
    if (!l)
      throw new ErroDeNegocio(
        'CONFLITO',
        'Esta reclamação foi alterada por outra pessoa. Recarregue a página.',
      );
    return montar(l, hojeEmBrasilia());
  }

  private async buscar(ctx: Contexto, id: unknown): Promise<Linha> {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(rc)
          .where(and(eq(rc.id, id), eq(rc.empresaId, ctx.empresaId)))
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Reclamação não encontrada.');
    return l;
  }
}

function montar(l: Linha, hoje: string): Reclamacao {
  const status = l.status as StatusDaReclamacao;
  return {
    id: l.id,
    numero: l.numero,
    clienteId: l.clienteId,
    clienteNome: l.clienteNome,
    canal: l.canal as Reclamacao['canal'],
    recebidaEm: l.recebidaEm,
    descricao: l.descricao,
    produto: l.produto,
    osId: l.osId,
    osNumero: l.osNumero,
    prazoResposta: l.prazoResposta,
    atrasada: !l.respondidaEm && l.prazoResposta < hoje,
    status,
    procedente: l.procedente,
    analise: l.analise,
    ncId: l.ncId,
    ncNumero: l.ncNumero,
    resposta: l.resposta,
    respondidaEm: l.respondidaEm,
    clienteSatisfeito: l.clienteSatisfeito,
    observacaoEncerramento: l.observacaoEncerramento,
    versao: l.atualizadoEm.toISOString(),
  };
}

const regra = (m: string) => new ErroDeNegocio('REGRA_DE_NEGOCIO', m);
const invalido = (campo: string, mensagem: string) =>
  new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique os campos destacados.', [
    { campo, mensagem },
  ]);
