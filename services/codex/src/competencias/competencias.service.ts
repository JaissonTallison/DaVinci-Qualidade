import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, hojeEmBrasilia, validar } from '@davinci/shared';
import {
  chaveDoRequisito,
  definirTreinamentosDaFuncaoSchema,
  filtroDaFuncaoSchema,
  filtroDoFuncionarioSchema,
  pendente,
  type ConformidadeDoFuncionario,
  type Contexto,
  type MatrizDaFuncao,
  type RequisitoAtendido,
  type RequisitoDaFuncao,
  type SituacaoDoRequisito,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  asos,
  funcaoTreinamentos,
  funcionarios,
  funcoes,
  treinamentos,
  treinamentosRealizados,
} from '../db/schema.js';
import { situacaoDoVencimento } from '../exames-e-treinamentos/regras.js';

type Db = Database<typeof schema>;

/** ASO em dia é exigido de toda função (NR-7, PCMSO). */
const ASO: RequisitoDaFuncao = {
  tipo: 'aso',
  id: 'aso',
  nome: 'ASO periódico em dia',
  referencia: 'NR-7',
  motivo: null,
  riscoId: null,
};

/** Validade → situação; sem validade (não vence), em dia; sem registro, ausente. */
export function situacaoDoRegistro(
  registro: { validade: string | null } | undefined,
  hoje: string,
): SituacaoDoRequisito {
  if (!registro) return 'ausente';
  return registro.validade
    ? situacaoDoVencimento(registro.validade, hoje)
    : 'em_dia';
}

/** Treinamentos e ASO exigidos por função e a conformidade de cada pessoa (lado do codex). */
@Injectable()
export class CompetenciasService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async treinamentosDaFuncao(
    ctx: Contexto,
    dados: unknown,
  ): Promise<RequisitoDaFuncao[]> {
    const { funcaoId } = validar(filtroDaFuncaoSchema, dados);
    await this.funcao(ctx, funcaoId);
    return this.requisitos(ctx, funcaoId);
  }

  async definirTreinamentos(
    ctx: Contexto,
    dados: unknown,
  ): Promise<RequisitoDaFuncao[]> {
    const { funcaoId, treinamentoIds } = validar(
      definirTreinamentosDaFuncaoSchema,
      dados,
    );
    await this.funcao(ctx, funcaoId);
    const ids = [...new Set(treinamentoIds)];
    if (ids.length) {
      const achados = await this.db
        .select({ id: treinamentos.id })
        .from(treinamentos)
        .where(
          and(
            eq(treinamentos.empresaId, ctx.empresaId),
            inArray(treinamentos.id, ids),
          ),
        );
      if (achados.length !== ids.length)
        throw new ErroDeNegocio(
          'DADOS_INVALIDOS',
          'Treinamento não encontrado.',
          [
            {
              campo: 'treinamentoIds',
              mensagem: 'Treinamento não encontrado.',
            },
          ],
        );
    }
    await this.db.transaction(async (tx) => {
      await tx
        .delete(funcaoTreinamentos)
        .where(
          and(
            eq(funcaoTreinamentos.empresaId, ctx.empresaId),
            eq(funcaoTreinamentos.funcaoId, funcaoId),
          ),
        );
      if (ids.length)
        await tx.insert(funcaoTreinamentos).values(
          ids.map((treinamentoId) => ({
            empresaId: ctx.empresaId,
            funcaoId,
            treinamentoId,
            criadoPor: ctx.usuarioId,
            atualizadoPor: ctx.usuarioId,
          })),
        );
    });
    return this.requisitos(ctx, funcaoId);
  }

  async conformidade(
    ctx: Contexto,
    dados: unknown,
  ): Promise<ConformidadeDoFuncionario> {
    const { funcionarioId } = validar(filtroDoFuncionarioSchema, dados);
    const [f] = await this.db
      .select({ id: funcionarios.id, funcaoId: funcionarios.funcaoId })
      .from(funcionarios)
      .where(
        and(
          eq(funcionarios.id, funcionarioId),
          eq(funcionarios.empresaId, ctx.empresaId),
        ),
      );
    if (!f)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Funcionário não encontrado.');
    const requisitos = await this.requisitos(ctx, f.funcaoId);
    const atendidos = (await this.avaliar(ctx, [f.id], requisitos)).get(f.id)!;
    return {
      funcionarioId: f.id,
      requisitos: atendidos,
      pendentes: atendidos.filter((r) => pendente(r.situacao)).length,
    };
  }

  async matriz(ctx: Contexto, dados: unknown): Promise<MatrizDaFuncao> {
    const { funcaoId } = validar(filtroDaFuncaoSchema, dados);
    await this.funcao(ctx, funcaoId);
    const [requisitos, pessoas] = await Promise.all([
      this.requisitos(ctx, funcaoId),
      this.db
        .select({
          id: funcionarios.id,
          nome: funcionarios.nome,
          matricula: funcionarios.matricula,
        })
        .from(funcionarios)
        .where(
          and(
            eq(funcionarios.empresaId, ctx.empresaId),
            eq(funcionarios.funcaoId, funcaoId),
            eq(funcionarios.ativo, true),
          ),
        )
        .orderBy(asc(funcionarios.nome)),
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

  private async funcao(ctx: Contexto, id: string) {
    const [f] = await this.db
      .select({ id: funcoes.id })
      .from(funcoes)
      .where(and(eq(funcoes.id, id), eq(funcoes.empresaId, ctx.empresaId)));
    if (!f) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Função não encontrada.');
  }

  private async requisitos(
    ctx: Contexto,
    funcaoId: string,
  ): Promise<RequisitoDaFuncao[]> {
    const linhas = await this.db
      .select({
        id: treinamentos.id,
        nome: treinamentos.nome,
        norma: treinamentos.norma,
      })
      .from(funcaoTreinamentos)
      .innerJoin(
        treinamentos,
        eq(treinamentos.id, funcaoTreinamentos.treinamentoId),
      )
      .where(
        and(
          eq(funcaoTreinamentos.empresaId, ctx.empresaId),
          eq(funcaoTreinamentos.funcaoId, funcaoId),
        ),
      )
      .orderBy(asc(treinamentos.nome));
    return [
      ASO,
      ...linhas.map((l) => ({
        tipo: 'treinamento' as const,
        id: l.id,
        nome: l.nome,
        referencia: l.norma,
        motivo: null,
        riscoId: null,
      })),
    ];
  }

  /** O ASO mais recente e o último registro de cada treinamento exigido, por pessoa. */
  private async avaliar(
    ctx: Contexto,
    pessoas: string[],
    requisitos: RequisitoDaFuncao[],
  ): Promise<Map<string, RequisitoAtendido[]>> {
    const saida = new Map<string, RequisitoAtendido[]>();
    if (!pessoas.length) return saida;
    const hoje = hojeEmBrasilia();
    const ids = requisitos
      .filter((r) => r.tipo === 'treinamento')
      .map((r) => r.id);
    const [ultimosAsos, ultimosTreinos] = await Promise.all([
      this.db
        .selectDistinctOn([asos.funcionarioId], {
          funcionarioId: asos.funcionarioId,
          validade: asos.proximoExame,
        })
        .from(asos)
        .where(
          and(
            eq(asos.empresaId, ctx.empresaId),
            inArray(asos.funcionarioId, pessoas),
            isNull(asos.motivoAnulacao),
          ),
        )
        .orderBy(asos.funcionarioId, desc(asos.data), desc(asos.criadoEm)),
      ids.length
        ? this.db
            .selectDistinctOn(
              [
                treinamentosRealizados.funcionarioId,
                treinamentosRealizados.treinamentoId,
              ],
              {
                funcionarioId: treinamentosRealizados.funcionarioId,
                treinamentoId: treinamentosRealizados.treinamentoId,
                validade: treinamentosRealizados.validade,
              },
            )
            .from(treinamentosRealizados)
            .where(
              and(
                eq(treinamentosRealizados.empresaId, ctx.empresaId),
                inArray(treinamentosRealizados.funcionarioId, pessoas),
                inArray(treinamentosRealizados.treinamentoId, ids),
                isNull(treinamentosRealizados.motivoAnulacao),
              ),
            )
            .orderBy(
              treinamentosRealizados.funcionarioId,
              treinamentosRealizados.treinamentoId,
              desc(treinamentosRealizados.data),
              desc(treinamentosRealizados.criadoEm),
            )
        : Promise.resolve([]),
    ]);
    const aso = new Map(ultimosAsos.map((a) => [a.funcionarioId, a]));
    const treino = new Map(
      ultimosTreinos.map((t) => [`${t.funcionarioId}|${t.treinamentoId}`, t]),
    );
    for (const p of pessoas)
      saida.set(
        p,
        requisitos.map((r) => {
          const reg =
            r.tipo === 'aso' ? aso.get(p) : treino.get(`${p}|${r.id}`);
          return {
            ...r,
            situacao: situacaoDoRegistro(reg, hoje),
            validade: reg?.validade ?? null,
          };
        }),
      );
    return saida;
  }
}
