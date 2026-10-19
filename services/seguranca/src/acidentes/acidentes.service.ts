import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import {
  and,
  count,
  asc,
  desc,
  eq,
  ilike,
  like,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, hojeEmBrasilia, pedir, validar } from '@davinci/shared';
import {
  atualizarAcidenteSchema,
  dadosDaCatSchema,
  PATTERNS,
  registrarInvestigacaoSchema,
  SERVICES,
  type Funcionario,
  cancelarAcidenteSchema,
  concluirInvestigacaoSchema,
  ehAcidenteComLesao,
  filtroAcidentesSchema,
  indicadoresSchema,
  iniciarInvestigacaoSchema,
  isUuid,
  novoAcidenteSchema,
  registrarCatSchema,
  registrarHorasSchema,
  type Acidente,
  type AcidenteResumo,
  type Contexto,
  type IndicadorDoMes,
  type IndicadoresSst,
  type Pagina,
  type ResumoAcidentes,
  type StatusAcidente,
  type TipoAcidente,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { acidentes, horasTrabalhadas, sequencias } from '../db/schema.js';
import {
  diasEntre,
  formatarNumeroAcidente,
  proximoDiaUtil,
  recusaDaAcao,
  taxaPorMilhaoDeHoras,
  type AcaoAcidente,
} from './regras.js';

type Db = Database<typeof schema>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Linha = typeof acidentes.$inferSelect;
type ComId = { id?: unknown; alteracoes?: unknown };

const ALTERADO_POR_OUTRA_PESSOA =
  'Este registro foi alterado por outra pessoa. Recarregue a página para ver a versão atual.';

@Injectable()
export class AcidentesService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    /** Cadastro de funcionários: o acidentado do S-2210 vem de lá. */
    @Inject(SERVICES.CODEX) private readonly codex: Pick<ClientProxy, 'send'>,
  ) {}

  async listar(ctx: Contexto, dados: unknown): Promise<Pagina<AcidenteResumo>> {
    const f = validar(filtroAcidentesSchema, dados ?? {});
    const condicoes: SQL[] = [eq(acidentes.empresaId, ctx.empresaId)];
    if (f.tipo) condicoes.push(eq(acidentes.tipo, f.tipo));
    if (f.status) condicoes.push(eq(acidentes.status, f.status));
    if (f.busca) {
      const termo = `%${f.busca}%`;
      condicoes.push(
        or(
          ilike(acidentes.numero, termo),
          ilike(acidentes.acidentado, termo),
          ilike(acidentes.local, termo),
          ilike(acidentes.descricao, termo),
        )!,
      );
    }
    const onde = and(...condicoes);
    const hoje = hojeEmBrasilia();
    const colunas = {
      numero: acidentes.numero,
      data: acidentes.data,
      tipo: acidentes.tipo,
      status: acidentes.status,
    } as const;
    const ordenacao = f.ordenar
      ? [f.ordem === 'asc' ? asc(colunas[f.ordenar]) : desc(colunas[f.ordenar])]
      : [desc(acidentes.data), desc(acidentes.numero)];
    const [linhas, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(acidentes)
        .where(onde)
        .orderBy(...ordenacao)
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db.select({ total: count() }).from(acidentes).where(onde),
    ]);
    return {
      itens: linhas.map((l) => {
        const a = montar(l, hoje);
        return {
          id: a.id,
          numero: a.numero,
          tipo: a.tipo,
          data: a.data,
          local: a.local,
          acidentado: a.acidentado,
          diasPerdidos: a.diasPerdidos,
          status: a.status,
          catAtrasada: a.catAtrasada,
        };
      }),
      total: total!,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  async resumo(ctx: Contexto): Promise<ResumoAcidentes> {
    const hoje = hojeEmBrasilia();
    const [abertos, semCat, ultimo] = await Promise.all([
      this.db
        .select({ total: count() })
        .from(acidentes)
        .where(
          and(
            eq(acidentes.empresaId, ctx.empresaId),
            sql`${acidentes.status} IN ('registrado', 'em_investigacao')`,
          ),
        ),
      this.db
        .select({ data: acidentes.data })
        .from(acidentes)
        .where(
          and(
            eq(acidentes.empresaId, ctx.empresaId),
            ne(acidentes.status, 'cancelado'),
            sql`${acidentes.tipo} IN ('com_afastamento', 'sem_afastamento')`,
            sql`${acidentes.catNumero} IS NULL`,
          ),
        ),
      this.ultimoComAfastamento(ctx),
    ]);
    return {
      emAberto: abertos[0]!.total,
      catsAtrasadas: semCat.filter((a) => proximoDiaUtil(a.data) < hoje).length,
      diasSemAcidente: ultimo ? diasEntre(ultimo, hoje) : null,
    };
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Acidente> {
    return montar(await this.buscar(ctx, this.db, dados?.id), hojeEmBrasilia());
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Acidente> {
    const novo = validar(novoAcidenteSchema, dados);
    if (novo.data > hojeEmBrasilia())
      throw invalido('data', 'A data do acidente não pode estar no futuro.');
    const ano = Number(novo.data.slice(0, 4));
    return this.db.transaction(async (tx) => {
      const [{ ultimo }] = await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `ACI-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo });
      const [linha] = await tx
        .insert(acidentes)
        .values({
          ...novo,
          empresaId: ctx.empresaId,
          numero: formatarNumeroAcidente(ano, ultimo!),
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montar(linha!, hojeEmBrasilia());
    });
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<Acidente> {
    const { versao, ...campos } = validar(
      atualizarAcidenteSchema,
      dados?.alteracoes,
    );
    if (campos.data > hojeEmBrasilia())
      throw invalido('data', 'A data do acidente não pode estar no futuro.');
    return this.alterar(ctx, dados?.id, versao, 'editar', (tx, l) =>
      tx.update(acidentes).set(campos).where(eq(acidentes.id, l.id)),
    );
  }

  /** A CAT vale até depois de concluído: a emissão pode chegar com atraso, e o registro precisa dela. */
  async registrarCat(ctx: Contexto, dados: ComId): Promise<Acidente> {
    const { versao, numero, data } = validar(
      registrarCatSchema,
      dados?.alteracoes,
    );
    return this.alterar(ctx, dados?.id, versao, 'cat', async (tx, l) => {
      if (!ehAcidenteComLesao(l.tipo as TipoAcidente))
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Só acidente com lesão tem CAT.',
        );
      if (data < l.data)
        throw invalido('data', 'A CAT não pode ser anterior ao acidente.');
      if (data > hojeEmBrasilia())
        throw invalido('data', 'A data da CAT não pode estar no futuro.');
      await tx
        .update(acidentes)
        .set({ catNumero: numero, catData: data })
        .where(eq(acidentes.id, l.id));
    });
  }

  async iniciarInvestigacao(ctx: Contexto, dados: ComId): Promise<Acidente> {
    const { versao } = validar(iniciarInvestigacaoSchema, dados?.alteracoes);
    return this.alterar(ctx, dados?.id, versao, 'iniciar', (tx, l) =>
      tx
        .update(acidentes)
        .set({ status: 'em_investigacao' })
        .where(eq(acidentes.id, l.id)),
    );
  }

  /** Testemunhas, 5 porquês e árvore de causas, enquanto a investigação está aberta. */
  async registrarInvestigacao(ctx: Contexto, dados: ComId): Promise<Acidente> {
    const { versao, ...investigacao } = validar(
      registrarInvestigacaoSchema,
      dados?.alteracoes,
    );
    return this.alterar(ctx, dados?.id, versao, 'investigar', (tx, l) =>
      tx.update(acidentes).set({ investigacao }).where(eq(acidentes.id, l.id)),
    );
  }

  /** Complemento do S-2210: só acidente com lesão; o acidentado é conferido no cadastro (ativo ou não). */
  async registrarDadosCat(ctx: Contexto, dados: ComId): Promise<Acidente> {
    const alteracoes = (dados?.alteracoes ?? {}) as { versao?: unknown };
    const versao = String(alteracoes.versao ?? '');
    const cat = validar(dadosDaCatSchema, dados?.alteracoes);
    const pessoa = await pedir<Funcionario>(
      this.codex,
      PATTERNS.funcionarios.obter,
      { id: cat.acidentadoId },
      ctx,
      'Cadastros',
    ).catch((erro: unknown) => {
      if (
        erro instanceof ErroDeNegocio &&
        (erro.getError() as { codigo?: string }).codigo === 'NAO_ENCONTRADO'
      )
        throw invalido('acidentadoId', 'Funcionário não encontrado.');
      throw erro;
    });
    return this.alterar(ctx, dados?.id, versao, 'cat', async (tx, l) => {
      if (!ehAcidenteComLesao(l.tipo as TipoAcidente))
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Só acidente com lesão gera CAT no eSocial.',
        );
      if (cat.indCatObito === 'S' && !cat.dtObito)
        throw invalido('dtObito', 'Informe a data do óbito.');
      if (cat.dtAtendimento < l.data)
        throw invalido(
          'dtAtendimento',
          'O atendimento não pode ser anterior ao acidente.',
        );
      await tx
        .update(acidentes)
        .set({
          dadosCat: cat,
          acidentado: pessoa.nome,
          funcao: pessoa.funcaoNome,
        })
        .where(eq(acidentes.id, l.id));
    });
  }

  async concluirInvestigacao(ctx: Contexto, dados: ComId): Promise<Acidente> {
    const { versao, causas, medidas } = validar(
      concluirInvestigacaoSchema,
      dados?.alteracoes,
    );
    return this.alterar(ctx, dados?.id, versao, 'concluir', async (tx, l) => {
      if (ehAcidenteComLesao(l.tipo as TipoAcidente) && !l.catNumero)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Registre a CAT antes de concluir: todo acidente com lesão gera CAT (Lei 8.213, art. 22).',
        );
      await tx
        .update(acidentes)
        .set({ status: 'concluido', causas, medidas })
        .where(eq(acidentes.id, l.id));
    });
  }

  async cancelar(ctx: Contexto, dados: ComId): Promise<Acidente> {
    const { versao, motivo } = validar(
      cancelarAcidenteSchema,
      dados?.alteracoes,
    );
    return this.alterar(ctx, dados?.id, versao, 'cancelar', (tx, l) =>
      tx
        .update(acidentes)
        .set({ status: 'cancelado', motivoCancelamento: motivo })
        .where(eq(acidentes.id, l.id)),
    );
  }

  /** Lança (ou corrige) as horas-homem de um mês. */
  async registrarHoras(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ competencia: string; horas: number }> {
    const { competencia, horas } = validar(registrarHorasSchema, dados);
    if (competencia > hojeEmBrasilia().slice(0, 7))
      throw invalido('competencia', 'O mês não pode estar no futuro.');
    await this.db
      .insert(horasTrabalhadas)
      .values({
        empresaId: ctx.empresaId,
        competencia,
        horas,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .onConflictDoUpdate({
        target: [horasTrabalhadas.empresaId, horasTrabalhadas.competencia],
        set: { horas, atualizadoPor: ctx.usuarioId },
      });
    return { competencia, horas };
  }

  /** TF, TG e dias sem acidente do ano, mês a mês (NBR 14280). Mês sem horas lançadas fica sem taxa. */
  async indicadores(ctx: Contexto, dados: unknown): Promise<IndicadoresSst> {
    const { ano } = validar(indicadoresSchema, dados ?? {});
    const [horas, doAno, ultimo] = await Promise.all([
      this.db
        .select()
        .from(horasTrabalhadas)
        .where(
          and(
            eq(horasTrabalhadas.empresaId, ctx.empresaId),
            like(horasTrabalhadas.competencia, `${ano}-%`),
          ),
        ),
      this.db
        .select({
          data: acidentes.data,
          diasPerdidos: acidentes.diasPerdidos,
          diasDebitados: acidentes.diasDebitados,
        })
        .from(acidentes)
        .where(
          and(
            eq(acidentes.empresaId, ctx.empresaId),
            eq(acidentes.tipo, 'com_afastamento'),
            ne(acidentes.status, 'cancelado'),
            like(sql`${acidentes.data}::text`, `${ano}-%`),
          ),
        ),
      this.ultimoComAfastamento(ctx),
    ]);
    const meses: IndicadorDoMes[] = Array.from({ length: 12 }, (_, i) => {
      const competencia = `${ano}-${String(i + 1).padStart(2, '0')}`;
      const doMes = doAno.filter((a) => a.data.startsWith(competencia));
      const h = horas.find((x) => x.competencia === competencia)?.horas ?? null;
      const dias = doMes.reduce(
        (s, a) => s + a.diasPerdidos + a.diasDebitados,
        0,
      );
      return {
        competencia,
        horas: h,
        acidentesComAfastamento: doMes.length,
        diasPerdidosEDebitados: dias,
        tf: taxaPorMilhaoDeHoras(doMes.length, h),
        tg: taxaPorMilhaoDeHoras(dias, h),
      };
    });
    // O total usa só os meses com horas lançadas: um acidente num mês sem horas inflaria a taxa
    const comHoras = meses.filter((m) => m.horas !== null);
    const horasDoAno = comHoras.length
      ? comHoras.reduce((s, m) => s + m.horas!, 0)
      : null;
    const acidentesDoAno = comHoras.reduce(
      (s, m) => s + m.acidentesComAfastamento,
      0,
    );
    const diasDoAno = comHoras.reduce(
      (s, m) => s + m.diasPerdidosEDebitados,
      0,
    );
    return {
      ano,
      meses,
      total: {
        horas: horasDoAno,
        acidentesComAfastamento: acidentesDoAno,
        diasPerdidosEDebitados: diasDoAno,
        tf: taxaPorMilhaoDeHoras(acidentesDoAno, horasDoAno),
        tg: taxaPorMilhaoDeHoras(diasDoAno, horasDoAno),
      },
      diasSemAcidente: ultimo ? diasEntre(ultimo, hojeEmBrasilia()) : null,
      ultimoAcidenteComAfastamento: ultimo,
    };
  }

  private async ultimoComAfastamento(ctx: Contexto): Promise<string | null> {
    const [l] = await this.db
      .select({ data: acidentes.data })
      .from(acidentes)
      .where(
        and(
          eq(acidentes.empresaId, ctx.empresaId),
          eq(acidentes.tipo, 'com_afastamento'),
          ne(acidentes.status, 'cancelado'),
        ),
      )
      .orderBy(desc(acidentes.data))
      .limit(1);
    return l?.data ?? null;
  }

  private async alterar(
    ctx: Contexto,
    id: unknown,
    versao: string,
    acao: AcaoAcidente,
    mudanca: (tx: Tx, linha: Linha) => Promise<unknown>,
  ): Promise<Acidente> {
    const lida = new Date(versao);
    if (Number.isNaN(lida.getTime()))
      throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    return this.db.transaction(async (tx) => {
      const atual = await this.buscar(ctx, tx, id);
      const recusa = recusaDaAcao(acao, atual.status as StatusAcidente);
      if (recusa) throw new ErroDeNegocio('REGRA_DE_NEGOCIO', recusa);
      const [travado] = await tx
        .update(acidentes)
        .set({ atualizadoPor: ctx.usuarioId })
        .where(
          and(eq(acidentes.id, atual.id), eq(acidentes.atualizadoEm, lida)),
        )
        .returning();
      if (!travado)
        throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
      await mudanca(tx, travado);
      const [final] = await tx
        .select()
        .from(acidentes)
        .where(eq(acidentes.id, travado.id));
      return montar(final!, hojeEmBrasilia());
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
          .from(acidentes)
          .where(
            and(eq(acidentes.id, id), eq(acidentes.empresaId, ctx.empresaId)),
          )
      : [];
    if (!linha)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Registro de acidente não encontrado.',
      );
    return linha;
  }
}

function invalido(campo: string, mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio(
    'DADOS_INVALIDOS',
    'Verifique os campos destacados.',
    [{ campo, mensagem }],
  );
}

function montar(l: Linha, hoje: string): Acidente {
  const tipo = l.tipo as TipoAcidente;
  const status = l.status as StatusAcidente;
  const prazoCat = ehAcidenteComLesao(tipo) ? proximoDiaUtil(l.data) : null;
  return {
    id: l.id,
    numero: l.numero,
    tipo,
    data: l.data,
    hora: l.hora,
    local: l.local,
    setor: l.setor,
    acidentado: l.acidentado,
    funcao: l.funcao,
    descricao: l.descricao,
    lesao: l.lesao,
    parteDoCorpo: l.parteDoCorpo,
    agenteCausador: l.agenteCausador,
    diasPerdidos: l.diasPerdidos,
    diasDebitados: l.diasDebitados,
    medidasImediatas: l.medidasImediatas,
    testemunhas: l.testemunhas,
    catNumero: l.catNumero,
    catData: l.catData,
    prazoCat,
    catAtrasada: Boolean(
      prazoCat && !l.catNumero && status !== 'cancelado' && prazoCat < hoje,
    ),
    status,
    causas: l.causas,
    medidas: l.medidas,
    motivoCancelamento: l.motivoCancelamento,
    investigacao: l.investigacao as Acidente['investigacao'],
    dadosCat: (l.dadosCat as Acidente['dadosCat']) ?? null,
    versao: l.atualizadoEm.toISOString(),
  };
}
