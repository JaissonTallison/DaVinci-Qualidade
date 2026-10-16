import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, hojeEmBrasilia, pedir, validar } from '@davinci/shared';
import {
  chaveDoRequisito,
  definirEpisDaFuncaoSchema,
  definirRiscosDaFuncaoSchema,
  type Risco,
  filtroDaFuncaoSchema,
  filtroDoFuncionarioSchema,
  pendente,
  nivelDoRisco,
  PATTERNS,
  SERVICES,
  type ConformidadeDoFuncionario,
  type Contexto,
  type Funcao,
  type Funcionario,
  type FuncionarioResumo,
  type MatrizDaFuncao,
  type Pagina,
  type RequisitoAtendido,
  type RequisitoDaFuncao,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  entregasEpi,
  epis,
  funcaoEpis,
  funcaoRiscos,
  riscos,
} from '../db/schema.js';
import { situacaoDoEpi } from './regras.js';

type Db = Database<typeof schema>;
const CADASTROS = 'Cadastros';

/** EPIs exigidos por função e a conformidade de cada pessoa (lado da segurança; pessoas e funções vêm do codex). */
@Injectable()
export class CompetenciasEpisService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    @Inject(SERVICES.CODEX) private readonly codex: Pick<ClientProxy, 'send'>,
  ) {}

  async episDaFuncao(
    ctx: Contexto,
    dados: unknown,
  ): Promise<RequisitoDaFuncao[]> {
    const { funcaoId } = validar(filtroDaFuncaoSchema, dados);
    return this.requisitos(ctx, funcaoId);
  }

  async definirEpis(
    ctx: Contexto,
    dados: unknown,
  ): Promise<RequisitoDaFuncao[]> {
    const { funcaoId, itens } = validar(definirEpisDaFuncaoSchema, dados);
    await this.conferirFuncao(ctx, funcaoId);
    const unicos = [...new Map(itens.map((i) => [i.epiId, i])).values()];
    const epiIds = unicos.map((i) => i.epiId);
    const riscoIds = [
      ...new Set(unicos.map((i) => i.riscoId).filter((r): r is string => !!r)),
    ];
    const [achadosEpis, achadosRiscos] = await Promise.all([
      epiIds.length
        ? this.db
            .select({ id: epis.id })
            .from(epis)
            .where(
              and(eq(epis.empresaId, ctx.empresaId), inArray(epis.id, epiIds)),
            )
        : Promise.resolve([]),
      riscoIds.length
        ? this.db
            .select({ id: riscos.id })
            .from(riscos)
            .where(
              and(
                eq(riscos.empresaId, ctx.empresaId),
                inArray(riscos.id, riscoIds),
              ),
            )
        : Promise.resolve([]),
    ]);
    if (achadosEpis.length !== epiIds.length)
      throw invalido('itens', 'EPI não encontrado no catálogo.');
    if (achadosRiscos.length !== riscoIds.length)
      throw invalido('itens', 'Risco não encontrado no PGR.');
    await this.db.transaction(async (tx) => {
      await tx
        .delete(funcaoEpis)
        .where(
          and(
            eq(funcaoEpis.empresaId, ctx.empresaId),
            eq(funcaoEpis.funcaoId, funcaoId),
          ),
        );
      if (unicos.length)
        await tx.insert(funcaoEpis).values(
          unicos.map((i) => ({
            empresaId: ctx.empresaId,
            funcaoId,
            epiId: i.epiId,
            riscoId: i.riscoId ?? null,
            criadoPor: ctx.usuarioId,
            atualizadoPor: ctx.usuarioId,
          })),
        );
    });
    return this.requisitos(ctx, funcaoId);
  }

  /** Riscos do PGR ligados à função (ativos ou não, para o histórico). */
  async riscosDaFuncao(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Pick<Risco, 'id' | 'perigo' | 'danos' | 'controles' | 'nivel'>[]> {
    const { funcaoId } = validar(filtroDaFuncaoSchema, dados);
    const linhas = await this.db
      .select({ r: riscos })
      .from(funcaoRiscos)
      .innerJoin(riscos, eq(riscos.id, funcaoRiscos.riscoId))
      .where(
        and(
          eq(funcaoRiscos.empresaId, ctx.empresaId),
          eq(funcaoRiscos.funcaoId, funcaoId),
        ),
      )
      .orderBy(asc(riscos.perigo));
    return linhas.map(({ r }) => ({
      id: r.id,
      perigo: r.perigo,
      danos: r.danos,
      controles: r.controles,
      nivel: nivelDoRisco(r.severidade, r.probabilidade),
    }));
  }

  async definirRiscos(ctx: Contexto, dados: unknown) {
    const { funcaoId, riscoIds } = validar(definirRiscosDaFuncaoSchema, dados);
    await this.conferirFuncao(ctx, funcaoId);
    const ids = [...new Set(riscoIds)];
    if (ids.length) {
      const achados = await this.db
        .select({ id: riscos.id })
        .from(riscos)
        .where(
          and(eq(riscos.empresaId, ctx.empresaId), inArray(riscos.id, ids)),
        );
      if (achados.length !== ids.length)
        throw invalido('riscoIds', 'Risco não encontrado no PGR.');
    }
    await this.db.transaction(async (tx) => {
      await tx
        .delete(funcaoRiscos)
        .where(
          and(
            eq(funcaoRiscos.empresaId, ctx.empresaId),
            eq(funcaoRiscos.funcaoId, funcaoId),
          ),
        );
      if (ids.length)
        await tx.insert(funcaoRiscos).values(
          ids.map((riscoId) => ({
            empresaId: ctx.empresaId,
            funcaoId,
            riscoId,
            criadoPor: ctx.usuarioId,
            atualizadoPor: ctx.usuarioId,
          })),
        );
    });
    return this.riscosDaFuncao(ctx, { funcaoId });
  }

  async conformidade(
    ctx: Contexto,
    dados: unknown,
  ): Promise<ConformidadeDoFuncionario> {
    const { funcionarioId } = validar(filtroDoFuncionarioSchema, dados);
    const f = await pedir<Funcionario>(
      this.codex,
      PATTERNS.funcionarios.obter,
      { id: funcionarioId },
      ctx,
      CADASTROS,
    );
    const requisitos = await this.requisitos(ctx, f.funcaoId);
    const r = (await this.avaliar(ctx, [f.id], requisitos)).get(f.id)!;
    return {
      funcionarioId: f.id,
      requisitos: r,
      pendentes: r.filter((x) => pendente(x.situacao)).length,
    };
  }

  async matriz(ctx: Contexto, dados: unknown): Promise<MatrizDaFuncao> {
    const { funcaoId } = validar(filtroDaFuncaoSchema, dados);
    const [requisitos, pessoas] = await Promise.all([
      this.requisitos(ctx, funcaoId),
      this.pessoasDaFuncao(ctx, funcaoId),
    ]);
    const avaliados = await this.avaliar(
      ctx,
      pessoas.map((p) => p.id),
      requisitos,
    );
    return {
      funcaoId,
      requisitos,
      linhas: pessoas.map((p) => {
        const r = avaliados.get(p.id) ?? [];
        return {
          funcionarioId: p.id,
          nome: p.nome,
          matricula: p.matricula,
          situacoes: Object.fromEntries(
            r.map((x) => [chaveDoRequisito(x), x.situacao]),
          ),
          pendentes: r.filter((x) => pendente(x.situacao)).length,
        };
      }),
    };
  }

  // ---------------------------------------------------------------- apoio

  async conferirFuncao(ctx: Contexto, funcaoId: string) {
    const funcoes = await pedir<Funcao[]>(
      this.codex,
      PATTERNS.funcoes.listar,
      { situacao: 'todos' },
      ctx,
      CADASTROS,
    );
    if (!funcoes.some((f) => f.id === funcaoId))
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Função não encontrada.');
  }

  /** Ativos da função, todas as páginas do cadastro. */
  async pessoasDaFuncao(
    ctx: Contexto,
    funcaoId: string,
  ): Promise<FuncionarioResumo[]> {
    const todos: FuncionarioResumo[] = [];
    for (let pagina = 1; pagina <= 50; pagina++) {
      const p = await pedir<Pagina<FuncionarioResumo>>(
        this.codex,
        PATTERNS.funcionarios.listar,
        { funcaoId, situacao: 'ativos', porPagina: 100, pagina },
        ctx,
        CADASTROS,
      );
      todos.push(...p.itens);
      if (todos.length >= p.total || p.itens.length === 0) break;
    }
    return todos;
  }

  private async requisitos(
    ctx: Contexto,
    funcaoId: string,
  ): Promise<RequisitoDaFuncao[]> {
    const linhas = await this.db
      .select({
        id: epis.id,
        nome: epis.nome,
        ca: epis.ca,
        riscoId: funcaoEpis.riscoId,
        perigo: riscos.perigo,
      })
      .from(funcaoEpis)
      .innerJoin(epis, eq(epis.id, funcaoEpis.epiId))
      .leftJoin(riscos, eq(riscos.id, funcaoEpis.riscoId))
      .where(
        and(
          eq(funcaoEpis.empresaId, ctx.empresaId),
          eq(funcaoEpis.funcaoId, funcaoId),
        ),
      )
      .orderBy(asc(epis.nome));
    return linhas.map((l) => ({
      tipo: 'epi' as const,
      id: l.id,
      nome: l.nome,
      referencia: `CA ${l.ca}`,
      motivo: l.perigo,
      riscoId: l.riscoId,
    }));
  }

  /** A entrega em uso mais recente de cada EPI exigido, por pessoa. */
  private async avaliar(
    ctx: Contexto,
    pessoas: string[],
    requisitos: RequisitoDaFuncao[],
  ): Promise<Map<string, RequisitoAtendido[]>> {
    const saida = new Map<string, RequisitoAtendido[]>();
    if (!pessoas.length) return saida;
    const hoje = hojeEmBrasilia();
    const ids = requisitos.map((r) => r.id);
    const emUso = ids.length
      ? await this.db
          .selectDistinctOn([entregasEpi.funcionarioId, entregasEpi.epiId], {
            funcionarioId: entregasEpi.funcionarioId,
            epiId: entregasEpi.epiId,
            proximaTroca: entregasEpi.proximaTroca,
          })
          .from(entregasEpi)
          .where(
            and(
              eq(entregasEpi.empresaId, ctx.empresaId),
              inArray(entregasEpi.funcionarioId, pessoas),
              inArray(entregasEpi.epiId, ids),
              isNull(entregasEpi.devolvidoEm),
              isNull(entregasEpi.motivoAnulacao),
            ),
          )
          .orderBy(
            entregasEpi.funcionarioId,
            entregasEpi.epiId,
            desc(entregasEpi.data),
            desc(entregasEpi.criadoEm),
          )
      : [];
    const mapa = new Map(
      emUso.map((e) => [`${e.funcionarioId}|${e.epiId}`, e]),
    );
    for (const p of pessoas)
      saida.set(
        p,
        requisitos.map((r) => {
          const e = mapa.get(`${p}|${r.id}`);
          return {
            ...r,
            situacao: situacaoDoEpi(e, hoje),
            validade: e?.proximaTroca ?? null,
          };
        }),
      );
    return saida;
  }
}

const invalido = (campo: string, mensagem: string) =>
  new ErroDeNegocio('DADOS_INVALIDOS', mensagem, [{ campo, mensagem }]);
