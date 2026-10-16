import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, pedir, validar } from '@davinci/shared';
import {
  cancelarInspecaoSchema,
  concluirInspecaoSchema,
  filtroDoFornecedorSchema,
  loteAceito,
  PATTERNS,
  planoDeAmostragem,
  SERVICES,
  type NivelDeInspecao,
  type Nqa,
  type Parceiro,
  type PlanoDeAmostragem,
  type RecebimentoDoFornecedor,
  filtroInspecoesSchema,
  isUuid,
  novaInspecaoSchema,
  responderInspecaoSchema,
  type Contexto,
  type Inspecao,
  type InspecaoResumo,
  type Pagina,
  type RespostaItem,
  type ResumoInspecoes,
  type StatusInspecao,
  type TipoInspecao,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  inspecoes,
  inspecoesItens,
  modelosInspecao,
  sequencias,
} from '../db/schema.js';
import { hojeEmBrasilia } from '../datas.js';
import {
  contarNaoConformes,
  contarRespondidos,
  formatarNumeroInspecao,
  pendenciasParaConcluir,
  recusaPorStatusFinal,
  resultadoDaInspecao,
} from './regras.js';

type Db = Database<typeof schema>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Linha = typeof inspecoes.$inferSelect;
type LinhaItem = typeof inspecoesItens.$inferSelect;
type ComId = { id?: unknown; alteracoes?: unknown };

const ALTERADA_POR_OUTRA_PESSOA =
  'Esta inspeção foi alterada por outra pessoa. Recarregue a página para ver a versão atual.';

@Injectable()
export class InspecoesService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    /** Dono do cadastro de fornecedores: confere o fornecedor da inspeção de recebimento. */
    @Inject(SERVICES.CODEX) private readonly codex: Pick<ClientProxy, 'send'>,
  ) {}

  async listar(ctx: Contexto, dados: unknown): Promise<Pagina<InspecaoResumo>> {
    const f = validar(filtroInspecoesSchema, dados ?? {});
    const condicoes: SQL[] = [eq(inspecoes.empresaId, ctx.empresaId)];
    if (f.status) condicoes.push(eq(inspecoes.status, f.status));
    if (f.tipo) condicoes.push(eq(inspecoes.tipo, f.tipo));
    if (f.busca) {
      const termo = `%${f.busca}%`;
      condicoes.push(
        or(
          ilike(inspecoes.numero, termo),
          ilike(inspecoes.lote, termo),
          ilike(inspecoes.fornecedorNome, termo),
          sql`unaccent(${inspecoes.objeto}) ILIKE unaccent(${termo})`,
        )!,
      );
    }
    const onde = and(...condicoes);
    const [linhas, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(inspecoes)
        .where(onde)
        .orderBy(desc(inspecoes.data), desc(inspecoes.numero))
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db.select({ total: count() }).from(inspecoes).where(onde),
    ]);
    const itens = await this.itensDe(
      this.db,
      linhas.map((l) => l.id),
    );
    return {
      itens: linhas.map((l) => {
        const daInspecao = itens.get(l.id) ?? [];
        return {
          id: l.id,
          numero: l.numero,
          tipo: l.tipo as TipoInspecao,
          objeto: l.objeto,
          lote: l.lote,
          inspetor: l.inspetor,
          data: l.data,
          status: l.status as StatusInspecao,
          respondidos: contarRespondidos(daInspecao),
          naoConformes: contarNaoConformes(daInspecao),
          fornecedorNome: l.fornecedorNome,
          totalDeItens: daInspecao.length,
        };
      }),
      total: total!,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  async resumo(ctx: Contexto): Promise<ResumoInspecoes> {
    const desde = new Date(`${hojeEmBrasilia()}T12:00:00Z`);
    desde.setUTCDate(desde.getUTCDate() - 30);
    const [r] = await this.db
      .select({
        emAndamento: sql<number>`count(*) FILTER (WHERE ${inspecoes.status} = 'em_andamento')::int`,
        aprovadas: sql<number>`count(*) FILTER (WHERE ${inspecoes.status} = 'aprovada' AND ${inspecoes.data} >= ${desde.toISOString().slice(0, 10)})::int`,
        reprovadas: sql<number>`count(*) FILTER (WHERE ${inspecoes.status} = 'reprovada' AND ${inspecoes.data} >= ${desde.toISOString().slice(0, 10)})::int`,
      })
      .from(inspecoes)
      .where(eq(inspecoes.empresaId, ctx.empresaId));
    const concluidas = r!.aprovadas + r!.reprovadas;
    return {
      emAndamento: r!.emAndamento,
      reprovadas30Dias: r!.reprovadas,
      taxaDeAprovacao30Dias: concluidas
        ? Math.round((r!.aprovadas / concluidas) * 100)
        : null,
    };
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Inspecao> {
    const linha = await this.buscar(ctx, this.db, dados?.id);
    return montar(
      linha,
      (await this.itensDe(this.db, [linha.id])).get(linha.id) ?? [],
    );
  }

  /** Cria a inspeção copiando os itens do modelo (ou usando os digitados). Data no futuro não é registro, é plano. */
  async criar(ctx: Contexto, dados: unknown): Promise<Inspecao> {
    const {
      itens: digitados,
      modeloId,
      fornecedorId,
      ...nova
    } = validar(novaInspecaoSchema, dados);
    const fornecedorNome = fornecedorId
      ? (await this.fornecedor(ctx, fornecedorId)).nome
      : null;
    const nivelInspecao = nova.nqa ? (nova.nivelInspecao ?? 'II') : null;
    if (nova.data > hojeEmBrasilia())
      throw invalido('data', 'A data da inspeção não pode estar no futuro.');
    let itens = digitados ?? [];
    let modeloNome: string | null = null;
    if (modeloId) {
      const [modelo] = await this.db
        .select()
        .from(modelosInspecao)
        .where(
          and(
            eq(modelosInspecao.id, modeloId),
            eq(modelosInspecao.empresaId, ctx.empresaId),
          ),
        );
      if (!modelo || !modelo.ativo)
        throw invalido('modeloId', 'Modelo não encontrado ou inativo.');
      itens = modelo.itens;
      modeloNome = modelo.nome;
    }
    const ano = Number(nova.data.slice(0, 4));
    return this.db.transaction(async (tx) => {
      const [{ ultimo }] = await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `INS-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo });
      const [linha] = await tx
        .insert(inspecoes)
        .values({
          ...nova,
          nivelInspecao,
          fornecedorId: fornecedorId ?? null,
          fornecedorNome,
          modeloId: modeloId ?? null,
          modeloNome,
          empresaId: ctx.empresaId,
          numero: formatarNumeroInspecao(ano, ultimo!),
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      const linhasItens = await tx
        .insert(inspecoesItens)
        .values(
          itens.map((i, ordem) => ({
            verificar: i.verificar,
            criterio: i.criterio,
            ordem,
            inspecaoId: linha!.id,
            empresaId: ctx.empresaId,
            criadoPor: ctx.usuarioId,
            atualizadoPor: ctx.usuarioId,
          })),
        )
        .returning();
      return montar(linha!, linhasItens);
    });
  }

  /** Salva respostas e observações (parcial ou total). Item não enviado fica como estava. */
  async responder(ctx: Contexto, dados: ComId): Promise<Inspecao> {
    const { versao, respostas, observacoes } = validar(
      responderInspecaoSchema,
      dados?.alteracoes,
    );
    // O schema transforma "ausente" em null: sem esta conferência, responder alguns itens apagaria as observações gerais
    const veioObservacoes =
      typeof dados?.alteracoes === 'object' &&
      dados.alteracoes !== null &&
      'observacoes' in dados.alteracoes;
    return this.alterar(ctx, dados?.id, versao, async (tx, linha, itens) => {
      const ids = new Set(itens.map((i) => i.id));
      const estranho = respostas.find((r) => !ids.has(r.itemId));
      if (estranho)
        throw new ErroDeNegocio(
          'DADOS_INVALIDOS',
          'Item não pertence a esta inspeção.',
        );
      for (const r of respostas)
        await tx
          .update(inspecoesItens)
          .set({
            resposta: r.resposta,
            observacao: r.observacao,
            atualizadoPor: ctx.usuarioId,
          })
          .where(
            and(
              eq(inspecoesItens.id, r.itemId),
              eq(inspecoesItens.inspecaoId, linha.id),
            ),
          );
      if (veioObservacoes)
        await tx
          .update(inspecoes)
          .set({ observacoes })
          .where(eq(inspecoes.id, linha.id));
    });
  }

  /** Todos respondidos e NOK descritos: o resultado é calculado e a inspeção vira registro, sem mais mudanças. */
  async concluir(ctx: Contexto, dados: ComId): Promise<Inspecao> {
    const { versao, defeituosos } = validar(
      concluirInspecaoSchema,
      dados?.alteracoes,
    );
    return this.alterar(ctx, dados?.id, versao, async (tx, linha, itens) => {
      const pendencias = pendenciasParaConcluir(itens);
      const plano = planoDa(linha);
      if (plano && defeituosos === null)
        pendencias.push({
          campo: 'defeituosos',
          mensagem: `Informe quantos defeituosos havia na amostra de ${plano.amostra}.`,
        });
      if (plano && defeituosos !== null && defeituosos > plano.amostra)
        pendencias.push({
          campo: 'defeituosos',
          mensagem: `A amostra tem ${plano.amostra} peças: os defeituosos não passam disso.`,
        });
      if (pendencias.length)
        throw new ErroDeNegocio(
          'DADOS_INVALIDOS',
          'Antes de concluir, complete os itens destacados.',
          pendencias,
        );
      await tx
        .update(inspecoes)
        .set({
          // Com amostragem, decide o número de defeituosos na amostra (Ac/Re); sem, um NOK reprova
          status: plano
            ? loteAceito(plano, defeituosos!)
              ? 'aprovada'
              : 'reprovada'
            : resultadoDaInspecao(itens),
          defeituosos: plano ? defeituosos : null,
          concluidaEm: new Date(),
          concluidaPor: ctx.usuarioId,
        })
        .where(eq(inspecoes.id, linha.id));
    });
  }

  async cancelar(ctx: Contexto, dados: ComId): Promise<Inspecao> {
    const { versao, motivo } = validar(
      cancelarInspecaoSchema,
      dados?.alteracoes,
    );
    return this.alterar(ctx, dados?.id, versao, async (tx, linha) => {
      await tx
        .update(inspecoes)
        .set({
          status: 'cancelada',
          motivoCancelamento: motivo,
          canceladaEm: new Date(),
          canceladaPor: ctx.usuarioId,
        })
        .where(eq(inspecoes.id, linha.id));
    });
  }

  /** Recebimento do fornecedor nos últimos 12 meses (base da nota de qualidade na avaliação). */
  async recebimentoDoFornecedor(
    ctx: Contexto,
    dados: unknown,
  ): Promise<RecebimentoDoFornecedor> {
    const { fornecedorId } = validar(filtroDoFornecedorSchema, dados);
    const desde = new Date(`${hojeEmBrasilia()}T12:00:00Z`);
    desde.setUTCFullYear(desde.getUTCFullYear() - 1);
    const linhas = await this.db
      .select()
      .from(inspecoes)
      .where(
        and(
          eq(inspecoes.empresaId, ctx.empresaId),
          eq(inspecoes.fornecedorId, fornecedorId),
          sql`${inspecoes.data} >= ${desde.toISOString().slice(0, 10)}`,
        ),
      )
      .orderBy(desc(inspecoes.data), desc(inspecoes.numero));
    const aprovadas = linhas.filter((l) => l.status === 'aprovada').length;
    const reprovadas = linhas.filter((l) => l.status === 'reprovada').length;
    return {
      fornecedorId,
      inspecoes: linhas.length,
      aprovadas,
      reprovadas,
      indiceDeAprovacao:
        aprovadas + reprovadas
          ? Math.round((aprovadas / (aprovadas + reprovadas)) * 100)
          : null,
      ultimas: linhas.slice(0, 10).map((l) => ({
        id: l.id,
        numero: l.numero,
        data: l.data,
        objeto: l.objeto,
        lote: l.lote,
        status: l.status as StatusInspecao,
      })),
    };
  }

  /** Confere no codex: existe, está ativo e é fornecedor. */
  private async fornecedor(ctx: Contexto, id: string): Promise<Parceiro> {
    const p = await pedir<Parceiro>(
      this.codex,
      PATTERNS.parceiros.obter,
      { id },
      ctx,
      'Cadastros',
    ).catch((erro: unknown) => {
      if (
        erro instanceof ErroDeNegocio &&
        (erro.getError() as { codigo?: string }).codigo === 'NAO_ENCONTRADO'
      )
        throw invalido('fornecedorId', 'Fornecedor não encontrado.');
      throw erro;
    });
    if (!p.ativo)
      throw invalido('fornecedorId', `${p.nome} está inativo no cadastro.`);
    if (!p.papeis.includes('fornecedor'))
      throw invalido(
        'fornecedorId',
        `${p.nome} não está cadastrado como fornecedor.`,
      );
    return p;
  }

  /** Transação: confere empresa, status e versão (já avançando-a, o que trava gravação simultânea) e aplica a mudança. */
  private async alterar(
    ctx: Contexto,
    id: unknown,
    versao: string,
    mudanca: (tx: Tx, linha: Linha, itens: LinhaItem[]) => Promise<void>,
  ): Promise<Inspecao> {
    const lida = new Date(versao);
    if (Number.isNaN(lida.getTime()))
      throw new ErroDeNegocio('CONFLITO', ALTERADA_POR_OUTRA_PESSOA);
    return this.db.transaction(async (tx) => {
      const atual = await this.buscar(ctx, tx, id);
      const recusa = recusaPorStatusFinal(atual.status as StatusInspecao);
      if (recusa) throw new ErroDeNegocio('REGRA_DE_NEGOCIO', recusa);
      const [travada] = await tx
        .update(inspecoes)
        .set({ atualizadoPor: ctx.usuarioId })
        .where(
          and(eq(inspecoes.id, atual.id), eq(inspecoes.atualizadoEm, lida)),
        )
        .returning();
      if (!travada)
        throw new ErroDeNegocio('CONFLITO', ALTERADA_POR_OUTRA_PESSOA);
      await mudanca(
        tx,
        travada,
        (await this.itensDe(tx, [travada.id])).get(travada.id) ?? [],
      );
      const [final] = await tx
        .select()
        .from(inspecoes)
        .where(eq(inspecoes.id, travada.id));
      return montar(
        final!,
        (await this.itensDe(tx, [travada.id])).get(travada.id) ?? [],
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
          .from(inspecoes)
          .where(
            and(eq(inspecoes.id, id), eq(inspecoes.empresaId, ctx.empresaId)),
          )
      : [];
    if (!linha)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Inspeção não encontrada.');
    return linha;
  }

  private async itensDe(
    db: Db | Tx,
    ids: string[],
  ): Promise<Map<string, LinhaItem[]>> {
    const mapa = new Map<string, LinhaItem[]>();
    if (!ids.length) return mapa;
    const linhas = await db
      .select()
      .from(inspecoesItens)
      .where(inArray(inspecoesItens.inspecaoId, ids))
      .orderBy(asc(inspecoesItens.ordem));
    for (const l of linhas)
      mapa.set(l.inspecaoId, [...(mapa.get(l.inspecaoId) ?? []), l]);
    return mapa;
  }
}

function invalido(campo: string, mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio(
    'DADOS_INVALIDOS',
    'Verifique os campos destacados.',
    [{ campo, mensagem }],
  );
}

function montar(l: Linha, itens: LinhaItem[]): Inspecao {
  return {
    id: l.id,
    numero: l.numero,
    tipo: l.tipo as TipoInspecao,
    objeto: l.objeto,
    lote: l.lote,
    local: l.local,
    quantidade: l.quantidade,
    inspetor: l.inspetor,
    data: l.data,
    modeloId: l.modeloId,
    modeloNome: l.modeloNome,
    observacoes: l.observacoes,
    plano: planoDa(l),
    defeituosos: l.defeituosos,
    fornecedorId: l.fornecedorId,
    fornecedorNome: l.fornecedorNome,
    status: l.status as StatusInspecao,
    itens: itens.map((i) => ({
      id: i.id,
      ordem: i.ordem,
      verificar: i.verificar,
      criterio: i.criterio,
      resposta: i.resposta as RespostaItem | null,
      observacao: i.observacao,
    })),
    respondidos: contarRespondidos(itens),
    naoConformes: contarNaoConformes(itens),
    concluidaEm: l.concluidaEm?.toISOString() ?? null,
    motivoCancelamento: l.motivoCancelamento,
    criadoEm: l.criadoEm.toISOString(),
    versao: l.atualizadoEm.toISOString(),
  };
}

/** Plano de amostragem da inspeção: NQA, nível e a quantidade como tamanho do lote. */
function planoDa(l: Linha): PlanoDeAmostragem | null {
  return l.nqa && l.quantidade
    ? planoDeAmostragem(
        l.quantidade,
        (l.nivelInspecao ?? 'II') as NivelDeInspecao,
        l.nqa as Nqa,
      )
    : null;
}
