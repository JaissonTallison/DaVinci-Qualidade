import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import {
  and,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  lt,
  sql,
  type SQL,
} from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  violacaoUnica,
  ordemAlfabetica,
} from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  pedir,
  somarDias,
  validar,
} from '@davinci/shared';
import {
  anularEntregaSchema,
  atualizarEpiSchema,
  devolverEntregaSchema,
  DIAS_DE_AVISO_DO_CA,
  filtroEntregasSchema,
  filtroEpisSchema,
  isUuid,
  novoEpiSchema,
  PATTERNS,
  registrarEntregaSchema,
  SERVICES,
  situacaoDoEpiSchema,
  type Contexto,
  type EntregaEpi,
  type Epi,
  type Funcionario,
  type MotivoEntrega,
  type Pagina,
  type ResumoEpis,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { entregasEpi, epis } from '../db/schema.js';
import {
  caValidoEm,
  caVenceEmBreve,
  proximaTroca,
  situacaoDaEntrega,
} from './regras.js';

type Db = Database<typeof schema>;
type LinhaEpi = typeof epis.$inferSelect;
type LinhaEntrega = typeof entregasEpi.$inferSelect;
type ComId = { id?: unknown; alteracoes?: unknown };

const EPI_REPETIDO = 'Já existe este EPI com este CA no catálogo.';

@Injectable()
export class EpisService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    /** Dono do cadastro de funcionários: confere se a pessoa existe e está ativa. */
    @Inject(SERVICES.CODEX) private readonly codex: Pick<ClientProxy, 'send'>,
  ) {}

  // ---------------------------------------------------------------- catálogo

  async listar(ctx: Contexto, dados: unknown): Promise<Epi[]> {
    const { situacao } = validar(filtroEpisSchema, dados ?? {});
    const condicoes: SQL[] = [eq(epis.empresaId, ctx.empresaId)];
    if (situacao !== 'todos')
      condicoes.push(eq(epis.ativo, situacao === 'ativos'));
    const hoje = hojeEmBrasilia();
    return (
      await this.db
        .select()
        .from(epis)
        .where(and(...condicoes))
        .orderBy(ordemAlfabetica(epis.nome))
    ).map((l) => montarEpi(l, hoje));
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Epi> {
    const id = dados?.id;
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(epis)
          .where(and(eq(epis.id, id), eq(epis.empresaId, ctx.empresaId)))
      : [];
    if (!l) throw new ErroDeNegocio('NAO_ENCONTRADO', 'EPI não encontrado.');
    return montarEpi(l, hojeEmBrasilia());
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Epi> {
    const novo = validar(novoEpiSchema, dados);
    try {
      const [l] = await this.db
        .insert(epis)
        .values({
          ...novo,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montarEpi(l!, hojeEmBrasilia());
    } catch (erro) {
      throw epiRepetido(erro) ?? erro;
    }
  }

  /** Atualizar o CA (lote novo) vale para as entregas daqui em diante; as antigas guardam o CA do dia. */
  async atualizar(ctx: Contexto, dados: ComId): Promise<Epi> {
    const { versao, ...campos } = validar(
      atualizarEpiSchema,
      dados?.alteracoes,
    );
    try {
      return await this.gravarEpi(ctx, dados?.id, versao, campos);
    } catch (erro) {
      throw epiRepetido(erro) ?? erro;
    }
  }

  async mudarSituacao(ctx: Contexto, dados: ComId): Promise<Epi> {
    const { versao, ativo } = validar(situacaoDoEpiSchema, dados?.alteracoes);
    return this.gravarEpi(ctx, dados?.id, versao, { ativo });
  }

  async resumo(ctx: Contexto): Promise<ResumoEpis> {
    const hoje = hojeEmBrasilia();
    const emUso = and(
      eq(entregasEpi.empresaId, ctx.empresaId),
      isNull(entregasEpi.devolvidoEm),
      isNull(entregasEpi.motivoAnulacao),
    );
    const [[trocas], [semTermo], [cas]] = await Promise.all([
      this.db
        .select({ total: count() })
        .from(entregasEpi)
        .where(
          and(
            emUso,
            isNotNull(entregasEpi.proximaTroca),
            lt(entregasEpi.proximaTroca, hoje),
          ),
        ),
      this.db
        .select({ total: count() })
        .from(entregasEpi)
        .where(and(emUso, eq(entregasEpi.termoAssinado, false))),
      this.db
        .select({ total: count() })
        .from(epis)
        .where(
          and(
            eq(epis.empresaId, ctx.empresaId),
            eq(epis.ativo, true),
            sql`${epis.validadeCa} <= ${somarDias(hoje, DIAS_DE_AVISO_DO_CA)}`,
          ),
        ),
    ]);
    return {
      trocasVencidas: trocas!.total,
      semTermo: semTermo!.total,
      casVencendo: cas!.total,
    };
  }

  // ---------------------------------------------------------------- entregas

  async listarEntregas(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Pagina<EntregaEpi>> {
    const f = validar(filtroEntregasSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const condicoes: SQL[] = [eq(entregasEpi.empresaId, ctx.empresaId)];
    if (f.funcionarioId)
      condicoes.push(eq(entregasEpi.funcionarioId, f.funcionarioId));
    if (f.epiId) condicoes.push(eq(entregasEpi.epiId, f.epiId));
    if (f.situacao === 'anulada')
      condicoes.push(isNotNull(entregasEpi.motivoAnulacao));
    if (f.situacao === 'devolvido')
      condicoes.push(
        isNull(entregasEpi.motivoAnulacao),
        isNotNull(entregasEpi.devolvidoEm),
      );
    if (f.situacao === 'troca_vencida')
      condicoes.push(
        isNull(entregasEpi.motivoAnulacao),
        isNull(entregasEpi.devolvidoEm),
        lt(entregasEpi.proximaTroca, hoje),
      );
    if (f.situacao === 'em_uso')
      condicoes.push(
        isNull(entregasEpi.motivoAnulacao),
        isNull(entregasEpi.devolvidoEm),
        sql`(${entregasEpi.proximaTroca} IS NULL OR ${entregasEpi.proximaTroca} >= ${hoje})`,
      );
    const onde = and(...condicoes);
    const [linhas, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(entregasEpi)
        .where(onde)
        .orderBy(desc(entregasEpi.data), desc(entregasEpi.criadoEm))
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db.select({ total: count() }).from(entregasEpi).where(onde),
    ]);
    return {
      itens: linhas.map((l) => montarEntrega(l, hoje)),
      total: total!,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  /** NR-6: só com CA válido no dia, só para funcionário ativo (conferido no codex). */
  async registrarEntrega(ctx: Contexto, dados: unknown): Promise<EntregaEpi> {
    const e = validar(registrarEntregaSchema, dados);
    const hoje = hojeEmBrasilia();
    if (e.data > hoje)
      throw invalido('data', 'A data da entrega não pode estar no futuro.');
    const [epi] = await this.db
      .select()
      .from(epis)
      .where(and(eq(epis.id, e.epiId), eq(epis.empresaId, ctx.empresaId)));
    if (!epi || !epi.ativo)
      throw invalido('epiId', 'EPI não encontrado ou inativo.');
    if (!caValidoEm(epi.validadeCa, e.data))
      throw invalido(
        'epiId',
        `O CA ${epi.ca} venceu em ${epi.validadeCa.split('-').reverse().join('/')}: EPI sem CA válido não pode ser entregue (NR-6).`,
      );
    const funcionario = await pedir<Funcionario>(
      this.codex,
      PATTERNS.funcionarios.obter,
      { id: e.funcionarioId },
      ctx,
      'Cadastros',
    ).catch((erro: unknown) => {
      if (
        erro instanceof ErroDeNegocio &&
        (erro.getError() as { codigo?: string }).codigo === 'NAO_ENCONTRADO'
      )
        throw invalido('funcionarioId', 'Funcionário não encontrado.');
      throw erro;
    });
    if (!funcionario.ativo)
      throw invalido(
        'funcionarioId',
        `${funcionario.nome} está desligado: EPI só é entregue a funcionário ativo.`,
      );
    if (e.data < funcionario.admissao)
      throw invalido(
        'data',
        'A entrega não pode ser anterior à admissão do funcionário.',
      );
    const [l] = await this.db
      .insert(entregasEpi)
      .values({
        ...e,
        funcionarioNome: funcionario.nome,
        funcionarioMatricula: funcionario.matricula,
        epiNome: epi.nome,
        ca: epi.ca,
        proximaTroca: proximaTroca(e.data, epi.vidaUtilDias),
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montarEntrega(l!, hoje);
  }

  async devolver(ctx: Contexto, dados: ComId): Promise<EntregaEpi> {
    const { data } = validar(devolverEntregaSchema, dados?.alteracoes);
    const atual = await this.buscarEntrega(ctx, dados?.id);
    if (atual.motivoAnulacao || atual.devolvidoEm)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        atual.motivoAnulacao
          ? 'Esta entrega está anulada.'
          : 'Este EPI já foi devolvido.',
      );
    if (data < atual.data)
      throw invalido('data', 'A devolução não pode ser anterior à entrega.');
    if (data > hojeEmBrasilia())
      throw invalido('data', 'A devolução não pode estar no futuro.');
    return this.gravarEntrega(ctx, atual.id, { devolvidoEm: data });
  }

  /** Registro errado (pessoa ou EPI trocados): fica na ficha, marcado, e sai das contas. */
  async anular(ctx: Contexto, dados: ComId): Promise<EntregaEpi> {
    const { motivo } = validar(anularEntregaSchema, dados?.alteracoes);
    const atual = await this.buscarEntrega(ctx, dados?.id);
    if (atual.motivoAnulacao)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Esta entrega já está anulada.',
      );
    return this.gravarEntrega(ctx, atual.id, {
      motivoAnulacao: motivo,
      anuladaPor: ctx.usuarioId,
    });
  }

  // ---------------------------------------------------------------- apoio

  private async gravarEpi(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof epis.$inferInsert>,
  ): Promise<Epi> {
    const lida = new Date(versao);
    const [l] =
      isUuid(id) && !Number.isNaN(lida.getTime())
        ? await this.db
            .update(epis)
            .set({ ...valores, atualizadoPor: ctx.usuarioId })
            .where(
              and(
                eq(epis.id, id),
                eq(epis.empresaId, ctx.empresaId),
                eq(epis.atualizadoEm, lida),
              ),
            )
            .returning()
        : [];
    if (!l) {
      const [existe] = isUuid(id)
        ? await this.db
            .select({ id: epis.id })
            .from(epis)
            .where(and(eq(epis.id, id), eq(epis.empresaId, ctx.empresaId)))
        : [];
      if (!existe)
        throw new ErroDeNegocio('NAO_ENCONTRADO', 'EPI não encontrado.');
      throw new ErroDeNegocio(
        'CONFLITO',
        'Este EPI foi alterado por outra pessoa. Recarregue a página para ver a versão atual.',
      );
    }
    return montarEpi(l, hojeEmBrasilia());
  }

  private async buscarEntrega(
    ctx: Contexto,
    id: unknown,
  ): Promise<LinhaEntrega> {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(entregasEpi)
          .where(
            and(
              eq(entregasEpi.id, id),
              eq(entregasEpi.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Entrega não encontrada.');
    return l;
  }

  private async gravarEntrega(
    ctx: Contexto,
    id: string,
    valores: Partial<typeof entregasEpi.$inferInsert>,
  ): Promise<EntregaEpi> {
    const [l] = await this.db
      .update(entregasEpi)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(eq(entregasEpi.id, id), eq(entregasEpi.empresaId, ctx.empresaId)),
      )
      .returning();
    return montarEntrega(l!, hojeEmBrasilia());
  }
}

function epiRepetido(erro: unknown): ErroDeNegocio | null {
  return violacaoUnica(erro) === 'epis_nome_ca_por_empresa'
    ? new ErroDeNegocio('CONFLITO', EPI_REPETIDO, [
        { campo: 'nome', mensagem: EPI_REPETIDO },
      ])
    : null;
}

function invalido(campo: string, mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio(
    'DADOS_INVALIDOS',
    'Verifique os campos destacados.',
    [{ campo, mensagem }],
  );
}

function montarEpi(l: LinhaEpi, hoje: string): Epi {
  return {
    id: l.id,
    nome: l.nome,
    ca: l.ca,
    validadeCa: l.validadeCa,
    caVencido: !caValidoEm(l.validadeCa, hoje),
    caVenceEmBreve: caVenceEmBreve(l.validadeCa, hoje),
    vidaUtilDias: l.vidaUtilDias,
    ativo: l.ativo,
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarEntrega(l: LinhaEntrega, hoje: string): EntregaEpi {
  return {
    id: l.id,
    funcionarioId: l.funcionarioId,
    funcionarioNome: l.funcionarioNome,
    funcionarioMatricula: l.funcionarioMatricula,
    epiId: l.epiId,
    epiNome: l.epiNome,
    ca: l.ca,
    quantidade: l.quantidade,
    data: l.data,
    motivo: l.motivo as MotivoEntrega,
    termoAssinado: l.termoAssinado,
    observacao: l.observacao,
    proximaTroca: l.proximaTroca,
    devolvidoEm: l.devolvidoEm,
    motivoAnulacao: l.motivoAnulacao,
    situacao: situacaoDaEntrega(l, hoje),
  };
}
