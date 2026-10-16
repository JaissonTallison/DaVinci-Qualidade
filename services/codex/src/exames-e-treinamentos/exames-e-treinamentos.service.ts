import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  sql,
  type SQL,
} from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  ordemAlfabetica,
  violacaoUnica,
} from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarMeses,
  validar,
} from '@davinci/shared';
import {
  anularRegistroSchema,
  atualizarTreinamentoSchema,
  filtroCadastroSimplesSchema,
  filtroAsosParaEsocialSchema,
  filtroDoFuncionarioSchema,
  filtroTurmaSchema,
  type AsoParaEsocial,
  type ResumoDaTurma,
  type Turma,
  filtroVencimentosSchema,
  isUuid,
  novoTreinamentoSchema,
  registrarAsoSchema,
  registrarTurmaSchema,
  situacaoDoTreinamentoSchema,
  TIPOS_ASO,
  type Aso,
  type Contexto,
  type ResultadoAso,
  type ResumoVencimentos,
  type TipoAso,
  type Treinamento,
  type TreinamentoRealizado,
  type Vencimento,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  asos,
  funcionarios,
  funcoes,
  treinamentos,
  treinamentosRealizados,
} from '../db/schema.js';
import { situacaoDoVencimento } from './regras.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const REPETIDO = 'Já existe um treinamento com este nome.';

@Injectable()
export class ExamesETreinamentosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  // ---------------------------------------------------------------- ASO

  async listarAsos(ctx: Contexto, dados: unknown): Promise<Aso[]> {
    const { funcionarioId } = validar(filtroDoFuncionarioSchema, dados);
    const linhas = await this.db
      .select()
      .from(asos)
      .where(
        and(
          eq(asos.empresaId, ctx.empresaId),
          eq(asos.funcionarioId, funcionarioId),
        ),
      )
      .orderBy(desc(asos.data), desc(asos.criadoEm));
    return linhas.map(montarAso);
  }

  /** Demissional vale também para quem já foi desligado; os outros, só para ativo. */
  async registrarAso(ctx: Contexto, dados: unknown): Promise<Aso> {
    const a = validar(registrarAsoSchema, dados);
    const f = await this.funcionario(ctx, a.funcionarioId);
    if (!f.ativo && a.tipo !== 'demissional')
      throw invalido(
        'funcionarioId',
        `${f.nome} está desligado: registre só o exame demissional.`,
      );
    if (a.data > hojeEmBrasilia())
      throw invalido('data', 'A data do exame não pode estar no futuro.');
    if (a.data < f.admissao && a.tipo !== 'admissional')
      throw invalido('data', 'Só o admissional pode ser anterior à admissão.');
    const [l] = await this.db
      .insert(asos)
      .values({
        ...a,
        proximoExame: a.tipo === 'demissional' ? null : a.proximoExame,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montarAso(l!);
  }

  /** ASOs não anulados desde a data, com CPF e matrícula: o que o S-2220 precisa. */
  async asosParaEsocial(
    ctx: Contexto,
    dados: unknown,
  ): Promise<AsoParaEsocial[]> {
    const { desde } = validar(filtroAsosParaEsocialSchema, dados);
    const linhas = await this.db
      .select({
        a: asos,
        nome: funcionarios.nome,
        cpf: funcionarios.cpf,
        matricula: funcionarios.matricula,
      })
      .from(asos)
      .innerJoin(funcionarios, eq(funcionarios.id, asos.funcionarioId))
      .where(
        and(
          eq(asos.empresaId, ctx.empresaId),
          isNull(asos.motivoAnulacao),
          gte(asos.data, desde),
        ),
      )
      .orderBy(desc(asos.data));
    return linhas.map((l) => ({
      ...montarAso(l.a),
      funcionarioNome: l.nome,
      cpf: l.cpf,
      matricula: l.matricula,
    }));
  }

  async anularAso(ctx: Contexto, dados: ComId): Promise<Aso> {
    const { motivo } = validar(anularRegistroSchema, dados?.alteracoes);
    const [l] = isUuid(dados?.id)
      ? await this.db
          .update(asos)
          .set({ motivoAnulacao: motivo, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(asos.id, dados.id),
              eq(asos.empresaId, ctx.empresaId),
              isNull(asos.motivoAnulacao),
            ),
          )
          .returning()
      : [];
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Exame não encontrado ou já anulado.',
      );
    return montarAso(l);
  }

  // ---------------------------------------------------------------- treinamentos

  async listarTreinamentos(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Treinamento[]> {
    const { situacao } = validar(filtroCadastroSimplesSchema, dados ?? {});
    const condicoes: SQL[] = [eq(treinamentos.empresaId, ctx.empresaId)];
    if (situacao !== 'todos')
      condicoes.push(eq(treinamentos.ativo, situacao === 'ativos'));
    return (
      await this.db
        .select()
        .from(treinamentos)
        .where(and(...condicoes))
        .orderBy(ordemAlfabetica(treinamentos.nome))
    ).map(montarTreinamento);
  }

  async criarTreinamento(ctx: Contexto, dados: unknown): Promise<Treinamento> {
    const novo = validar(novoTreinamentoSchema, dados);
    try {
      const [l] = await this.db
        .insert(treinamentos)
        .values({
          ...novo,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montarTreinamento(l!);
    } catch (erro) {
      throw repetido(erro) ?? erro;
    }
  }

  /** Mudar a validade vale para as próximas turmas; as já registradas guardam a validade do dia. */
  async atualizarTreinamento(
    ctx: Contexto,
    dados: ComId,
  ): Promise<Treinamento> {
    const { versao, ...campos } = validar(
      atualizarTreinamentoSchema,
      dados?.alteracoes,
    );
    try {
      return await this.gravarTreinamento(ctx, dados?.id, versao, campos);
    } catch (erro) {
      throw repetido(erro) ?? erro;
    }
  }

  async mudarSituacaoDoTreinamento(
    ctx: Contexto,
    dados: ComId,
  ): Promise<Treinamento> {
    const { versao, ativo } = validar(
      situacaoDoTreinamentoSchema,
      dados?.alteracoes,
    );
    return this.gravarTreinamento(ctx, dados?.id, versao, { ativo });
  }

  async realizados(
    ctx: Contexto,
    dados: unknown,
  ): Promise<TreinamentoRealizado[]> {
    const { funcionarioId } = validar(filtroDoFuncionarioSchema, dados);
    const linhas = await this.consultaRealizados()
      .where(
        and(
          eq(treinamentosRealizados.empresaId, ctx.empresaId),
          eq(treinamentosRealizados.funcionarioId, funcionarioId),
        ),
      )
      .orderBy(desc(treinamentosRealizados.data), asc(treinamentos.nome));
    return linhas.map(montarRealizado);
  }

  /** Turmas recentes: treinamento e data, com quantos participaram (não anulados). */
  async turmas(ctx: Contexto): Promise<ResumoDaTurma[]> {
    const linhas = await this.db
      .select({
        treinamentoId: treinamentosRealizados.treinamentoId,
        treinamentoNome: treinamentos.nome,
        data: treinamentosRealizados.data,
        participantes: sql<number>`count(*)::int`,
      })
      .from(treinamentosRealizados)
      .innerJoin(
        treinamentos,
        eq(treinamentos.id, treinamentosRealizados.treinamentoId),
      )
      .where(
        and(
          eq(treinamentosRealizados.empresaId, ctx.empresaId),
          isNull(treinamentosRealizados.motivoAnulacao),
        ),
      )
      .groupBy(
        treinamentosRealizados.treinamentoId,
        treinamentos.nome,
        treinamentosRealizados.data,
      )
      .orderBy(desc(treinamentosRealizados.data))
      .limit(100);
    return linhas;
  }

  /** Participantes de uma turma: base da lista de presença e dos certificados. */
  async turma(ctx: Contexto, dados: unknown): Promise<Turma> {
    const { treinamentoId, data } = validar(filtroTurmaSchema, dados);
    const [t] = await this.db
      .select()
      .from(treinamentos)
      .where(
        and(
          eq(treinamentos.id, treinamentoId),
          eq(treinamentos.empresaId, ctx.empresaId),
        ),
      );
    if (!t)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Treinamento não encontrado.');
    const linhas = await this.db
      .select({
        r: treinamentosRealizados,
        nome: funcionarios.nome,
        matricula: funcionarios.matricula,
        cpf: funcionarios.cpf,
        funcaoNome: funcoes.nome,
      })
      .from(treinamentosRealizados)
      .innerJoin(
        funcionarios,
        eq(funcionarios.id, treinamentosRealizados.funcionarioId),
      )
      .innerJoin(funcoes, eq(funcoes.id, funcionarios.funcaoId))
      .where(
        and(
          eq(treinamentosRealizados.empresaId, ctx.empresaId),
          eq(treinamentosRealizados.treinamentoId, treinamentoId),
          eq(treinamentosRealizados.data, data),
          isNull(treinamentosRealizados.motivoAnulacao),
        ),
      )
      .orderBy(asc(funcionarios.nome));
    if (!linhas.length)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Turma não encontrada.');
    return {
      treinamento: montarTreinamento(t),
      data,
      instrutor: linhas[0]!.r.instrutor,
      participantes: linhas.map((l) => ({
        funcionarioId: l.r.funcionarioId,
        nome: l.nome,
        matricula: l.matricula,
        cpf: l.cpf,
        funcaoNome: l.funcaoNome,
        validade: l.r.validade,
      })),
    };
  }

  /** Turma: todos ativos e admitidos até a data; se alguém não puder, ninguém é gravado. */
  async registrarTurma(
    ctx: Contexto,
    dados: unknown,
  ): Promise<TreinamentoRealizado[]> {
    const t = validar(registrarTurmaSchema, dados);
    if (t.data > hojeEmBrasilia())
      throw invalido('data', 'A data do treinamento não pode estar no futuro.');
    const [treinamento] = await this.db
      .select()
      .from(treinamentos)
      .where(
        and(
          eq(treinamentos.id, t.treinamentoId),
          eq(treinamentos.empresaId, ctx.empresaId),
        ),
      );
    if (!treinamento?.ativo)
      throw invalido('treinamentoId', 'Treinamento não encontrado ou inativo.');
    const ids = [...new Set(t.funcionarioIds)];
    const pessoas = await this.db
      .select()
      .from(funcionarios)
      .where(
        and(
          eq(funcionarios.empresaId, ctx.empresaId),
          inArray(funcionarios.id, ids),
        ),
      );
    if (pessoas.length !== ids.length)
      throw invalido(
        'funcionarioIds',
        'Algum funcionário marcado não foi encontrado. Recarregue a página.',
      );
    const desligados = pessoas.filter((p) => !p.ativo).map((p) => p.nome);
    if (desligados.length)
      throw invalido(
        'funcionarioIds',
        `Desligado não entra em turma: ${desligados.join(', ')}.`,
      );
    const antes = pessoas.filter((p) => p.admissao > t.data).map((p) => p.nome);
    if (antes.length)
      throw invalido(
        'data',
        `Admitido depois desta data: ${antes.join(', ')}.`,
      );
    const validade = treinamento.validadeMeses
      ? somarMeses(t.data, treinamento.validadeMeses)
      : null;
    const gravados = await this.db
      .insert(treinamentosRealizados)
      .values(
        ids.map((funcionarioId) => ({
          funcionarioId,
          treinamentoId: treinamento.id,
          data: t.data,
          validade,
          instrutor: t.instrutor,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })),
      )
      .returning({ id: treinamentosRealizados.id });
    const linhas = await this.consultaRealizados().where(
      inArray(
        treinamentosRealizados.id,
        gravados.map((g) => g.id),
      ),
    );
    return linhas.map(montarRealizado);
  }

  async anularRealizado(
    ctx: Contexto,
    dados: ComId,
  ): Promise<TreinamentoRealizado> {
    const { motivo } = validar(anularRegistroSchema, dados?.alteracoes);
    const [l] = isUuid(dados?.id)
      ? await this.db
          .update(treinamentosRealizados)
          .set({ motivoAnulacao: motivo, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(treinamentosRealizados.id, dados.id),
              eq(treinamentosRealizados.empresaId, ctx.empresaId),
              isNull(treinamentosRealizados.motivoAnulacao),
            ),
          )
          .returning({ id: treinamentosRealizados.id })
      : [];
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Registro não encontrado ou já anulado.',
      );
    const [r] = await this.consultaRealizados().where(
      eq(treinamentosRealizados.id, l.id),
    );
    return montarRealizado(r!);
  }

  // ---------------------------------------------------------------- vencimentos

  /**
   * Só pessoas ativas. ASO: o mais recente de cada pessoa vale (demissional ou sem próximo exame não vence).
   * Treinamento: o mais recente de cada pessoa em cada treinamento.
   */
  async vencimentos(ctx: Contexto, dados: unknown): Promise<Vencimento[]> {
    const f = validar(filtroVencimentosSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const ativos = and(
      eq(funcionarios.empresaId, ctx.empresaId),
      eq(funcionarios.ativo, true),
    );
    const lista: Vencimento[] = [];
    if (f.tipo !== 'treinamento') {
      const vigentes = await this.db
        .selectDistinctOn([asos.funcionarioId], {
          a: asos,
          nome: funcionarios.nome,
          matricula: funcionarios.matricula,
        })
        .from(asos)
        .innerJoin(funcionarios, eq(funcionarios.id, asos.funcionarioId))
        .where(and(ativos, isNull(asos.motivoAnulacao)))
        .orderBy(asos.funcionarioId, desc(asos.data), desc(asos.criadoEm));
      for (const v of vigentes)
        if (v.a.proximoExame)
          lista.push({
            tipo: 'aso',
            funcionarioId: v.a.funcionarioId,
            funcionarioNome: v.nome,
            matricula: v.matricula,
            descricao: `ASO ${TIPOS_ASO[v.a.tipo as TipoAso].toLowerCase()}`,
            data: v.a.data,
            validade: v.a.proximoExame,
            situacao: situacaoDoVencimento(v.a.proximoExame, hoje),
          });
    }
    if (f.tipo !== 'aso') {
      const ultimos = await this.db
        .selectDistinctOn(
          [
            treinamentosRealizados.funcionarioId,
            treinamentosRealizados.treinamentoId,
          ],
          {
            r: treinamentosRealizados,
            treinamento: treinamentos.nome,
            nome: funcionarios.nome,
            matricula: funcionarios.matricula,
          },
        )
        .from(treinamentosRealizados)
        .innerJoin(
          funcionarios,
          eq(funcionarios.id, treinamentosRealizados.funcionarioId),
        )
        .innerJoin(
          treinamentos,
          eq(treinamentos.id, treinamentosRealizados.treinamentoId),
        )
        .where(and(ativos, isNull(treinamentosRealizados.motivoAnulacao)))
        .orderBy(
          treinamentosRealizados.funcionarioId,
          treinamentosRealizados.treinamentoId,
          desc(treinamentosRealizados.data),
          desc(treinamentosRealizados.criadoEm),
        );
      for (const u of ultimos)
        if (u.r.validade)
          lista.push({
            tipo: 'treinamento',
            funcionarioId: u.r.funcionarioId,
            funcionarioNome: u.nome,
            matricula: u.matricula,
            descricao: u.treinamento,
            data: u.r.data,
            validade: u.r.validade,
            situacao: situacaoDoVencimento(u.r.validade, hoje),
          });
    }
    return lista
      .filter((v) => !f.situacao || v.situacao === f.situacao)
      .sort(
        (a, b) =>
          a.validade.localeCompare(b.validade) ||
          a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR'),
      );
  }

  async resumo(ctx: Contexto): Promise<ResumoVencimentos> {
    const [lista, semAso] = await Promise.all([
      this.vencimentos(ctx, {}),
      this.db
        .select({ id: funcionarios.id })
        .from(funcionarios)
        .leftJoin(
          asos,
          and(
            eq(asos.funcionarioId, funcionarios.id),
            isNull(asos.motivoAnulacao),
          ),
        )
        .where(
          and(
            eq(funcionarios.empresaId, ctx.empresaId),
            eq(funcionarios.ativo, true),
            isNull(asos.id),
          ),
        ),
    ]);
    return {
      total: lista.length,
      vencidos: lista.filter((v) => v.situacao === 'vencido').length,
      vencemEmBreve: lista.filter((v) => v.situacao === 'vence_em_breve')
        .length,
      semAso: semAso.length,
    };
  }

  // ---------------------------------------------------------------- apoio

  private async funcionario(ctx: Contexto, id: string) {
    const [f] = await this.db
      .select()
      .from(funcionarios)
      .where(
        and(eq(funcionarios.id, id), eq(funcionarios.empresaId, ctx.empresaId)),
      );
    if (!f) throw invalido('funcionarioId', 'Funcionário não encontrado.');
    return f;
  }

  private consultaRealizados() {
    return this.db
      .select({
        r: treinamentosRealizados,
        nome: treinamentos.nome,
        norma: treinamentos.norma,
        cargaHoraria: treinamentos.cargaHoraria,
      })
      .from(treinamentosRealizados)
      .innerJoin(
        treinamentos,
        eq(treinamentos.id, treinamentosRealizados.treinamentoId),
      )
      .$dynamic();
  }

  private async gravarTreinamento(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof treinamentos.$inferInsert>,
  ): Promise<Treinamento> {
    const lida = new Date(versao);
    const [l] =
      isUuid(id) && !Number.isNaN(lida.getTime())
        ? await this.db
            .update(treinamentos)
            .set({ ...valores, atualizadoPor: ctx.usuarioId })
            .where(
              and(
                eq(treinamentos.id, id),
                eq(treinamentos.empresaId, ctx.empresaId),
                eq(treinamentos.atualizadoEm, lida),
              ),
            )
            .returning()
        : [];
    if (!l)
      throw new ErroDeNegocio(
        'CONFLITO',
        'Este treinamento foi alterado por outra pessoa ou não existe. Recarregue a página.',
      );
    return montarTreinamento(l);
  }
}

function repetido(erro: unknown): ErroDeNegocio | null {
  return violacaoUnica(erro) === 'treinamentos_nome_por_empresa'
    ? new ErroDeNegocio('CONFLITO', REPETIDO, [
        { campo: 'nome', mensagem: REPETIDO },
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

function montarAso(l: typeof asos.$inferSelect): Aso {
  return {
    id: l.id,
    funcionarioId: l.funcionarioId,
    tipo: l.tipo as TipoAso,
    data: l.data,
    resultado: l.resultado as ResultadoAso,
    proximoExame: l.proximoExame,
    medico: l.medico,
    crm: l.crm,
    ufCrm: l.ufCrm,
    observacao: l.observacao,
    exames: l.exames as Aso['exames'],
    motivoAnulacao: l.motivoAnulacao,
  };
}

function montarTreinamento(l: typeof treinamentos.$inferSelect): Treinamento {
  return {
    id: l.id,
    nome: l.nome,
    norma: l.norma,
    cargaHoraria: l.cargaHoraria,
    validadeMeses: l.validadeMeses,
    ativo: l.ativo,
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarRealizado(l: {
  r: typeof treinamentosRealizados.$inferSelect;
  nome: string;
  norma: string | null;
  cargaHoraria: number;
}): TreinamentoRealizado {
  return {
    id: l.r.id,
    funcionarioId: l.r.funcionarioId,
    treinamentoId: l.r.treinamentoId,
    treinamentoNome: l.nome,
    norma: l.norma,
    cargaHoraria: l.cargaHoraria,
    data: l.r.data,
    validade: l.r.validade,
    instrutor: l.r.instrutor,
    motivoAnulacao: l.r.motivoAnulacao,
  };
}
