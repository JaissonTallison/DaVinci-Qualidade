import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  lt,
  notInArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, somarMeses, validar } from '@davinci/shared';
import {
  atribuirResponsavelNcEmLoteSchema,
  atualizarNcSchema,
  cancelarNcSchema,
  enviarParaVerificacaoSchema,
  filtroNcsSchema,
  registrarTratamentoSchema,
  isUuid,
  novaNcSchema,
  STATUS_FINAIS_NC,
  verificarEficaciaSchema,
  type Contexto,
  type NaoConformidade,
  type NaoConformidadeResumo,
  type Pagina,
  ncsPorMesSchema,
  type NcsDoMes,
  type ResumoNcs,
  type StatusNc,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { naoConformidades, sequencias } from '../db/schema.js';
import {
  estaVencida,
  formatarNumeroNc,
  hojeEmBrasilia,
  recusaDaTransicao,
  statusAposVerificacao,
  type AcaoNc,
} from './regras.js';

type Db = Database<typeof schema>;
type Linha = typeof naoConformidades.$inferSelect;

const ALTERADA_POR_OUTRA_PESSOA =
  'Esta NC foi alterada por outra pessoa. Recarregue a página para ver a versão atual.';

@Injectable()
export class NaoConformidadesService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Pagina<NaoConformidadeResumo>> {
    const f = validar(filtroNcsSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const condicoes: SQL[] = [eq(naoConformidades.empresaId, ctx.empresaId)];
    if (f.status) condicoes.push(eq(naoConformidades.status, f.status));
    if (f.gravidade)
      condicoes.push(eq(naoConformidades.gravidade, f.gravidade));
    if (f.origem) condicoes.push(eq(naoConformidades.origem, f.origem));
    if (f.origemRef)
      condicoes.push(eq(naoConformidades.origemRef, f.origemRef));
    if (f.vencidas)
      condicoes.push(
        lt(naoConformidades.prazo, hoje),
        notInArray(naoConformidades.status, [...STATUS_FINAIS_NC]),
      );
    if (f.busca) {
      const termo = `%${f.busca}%`;
      condicoes.push(
        or(
          ilike(naoConformidades.numero, termo),
          sql`unaccent(${naoConformidades.titulo}) ILIKE unaccent(${termo})`,
        )!,
      );
    }
    const onde = and(...condicoes);
    // As que ainda pedem trabalho primeiro, pelo prazo mais próximo; depois as terminadas, mais recentes primeiro
    const terminada = sql`${naoConformidades.status} IN ('encerrada', 'cancelada')`;
    const colunas = {
      numero: naoConformidades.numero,
      titulo: naoConformidades.titulo,
      prazo: naoConformidades.prazo,
      status: naoConformidades.status,
      origem: naoConformidades.origem,
    } as const;
    const ordenacao = f.ordenar
      ? [f.ordem === 'asc' ? asc(colunas[f.ordenar]) : desc(colunas[f.ordenar])]
      : [terminada, asc(naoConformidades.prazo), desc(naoConformidades.numero)];
    const [linhas, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(naoConformidades)
        .where(onde)
        .orderBy(...ordenacao)
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db.select({ total: count() }).from(naoConformidades).where(onde),
    ]);
    return {
      itens: linhas.map((l) => resumir(l, hoje)),
      total: total!,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  /** Troca o responsável de várias NCs de uma vez (seleção em massa). Só as NCs da empresa. */
  async atribuirResponsavelEmLote(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ atualizadas: number }> {
    const { ids, responsavel } = validar(
      atribuirResponsavelNcEmLoteSchema,
      dados,
    );
    const linhas = await this.db
      .update(naoConformidades)
      .set({ responsavel, atualizadoPor: ctx.usuarioId })
      .where(
        and(
          eq(naoConformidades.empresaId, ctx.empresaId),
          inArray(naoConformidades.id, ids),
        ),
      )
      .returning({ id: naoConformidades.id });
    return { atualizadas: linhas.length };
  }

  /** NCs abertas (data de abertura) e encerradas (dia do encerramento em Brasília) por mês, para o gráfico do início. */
  async porMes(ctx: Contexto, dados: unknown): Promise<NcsDoMes[]> {
    const { meses } = validar(ncsPorMesSchema, dados ?? {});
    const inicio = somarMeses(
      `${hojeEmBrasilia().slice(0, 7)}-01`,
      -(meses - 1),
    );
    const mesAbertura = sql<string>`to_char(${naoConformidades.dataAbertura}, 'YYYY-MM')`;
    const mesEncerramento = sql<string>`to_char(${naoConformidades.encerradaEm} AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')`;
    const [abertas, encerradas] = await Promise.all([
      this.db
        .select({ mes: mesAbertura, total: count() })
        .from(naoConformidades)
        .where(
          and(
            eq(naoConformidades.empresaId, ctx.empresaId),
            sql`${naoConformidades.dataAbertura} >= ${inicio}`,
          ),
        )
        .groupBy(mesAbertura),
      this.db
        .select({ mes: mesEncerramento, total: count() })
        .from(naoConformidades)
        .where(
          and(
            eq(naoConformidades.empresaId, ctx.empresaId),
            sql`(${naoConformidades.encerradaEm} AT TIME ZONE 'America/Sao_Paulo')::date >= ${inicio}`,
          ),
        )
        .groupBy(mesEncerramento),
    ]);
    return Array.from({ length: meses }, (_, i) => {
      const mes = somarMeses(inicio, i).slice(0, 7);
      return {
        mes,
        abertas: abertas.find((a) => a.mes === mes)?.total ?? 0,
        encerradas: encerradas.find((e) => e.mes === mes)?.total ?? 0,
      };
    });
  }

  async resumo(ctx: Contexto): Promise<ResumoNcs> {
    const hoje = hojeEmBrasilia();
    const [r] = await this.db
      .select({
        abertas: count(),
        vencidas: sql<number>`count(*) FILTER (WHERE ${naoConformidades.prazo} < ${hoje})::int`,
        graves: sql<number>`count(*) FILTER (WHERE ${naoConformidades.gravidade} IN ('alta', 'critica'))::int`,
      })
      .from(naoConformidades)
      .where(
        and(
          eq(naoConformidades.empresaId, ctx.empresaId),
          notInArray(naoConformidades.status, [...STATUS_FINAIS_NC]),
        ),
      );
    return { abertas: r!.abertas, vencidas: r!.vencidas, graves: r!.graves };
  }

  async obter(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<NaoConformidade> {
    return montar(await this.buscar(ctx, dados?.id));
  }

  async criar(ctx: Contexto, dados: unknown): Promise<NaoConformidade> {
    const nova = validar(novaNcSchema, dados);
    const hoje = hojeEmBrasilia();
    if (nova.prazo < hoje)
      throw invalido(
        'prazo',
        'O prazo não pode ser anterior à data de abertura.',
      );
    const ano = Number(hoje.slice(0, 4));
    return this.db.transaction(async (tx) => {
      const [{ ultimo }] = await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `NC-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo });
      const [linha] = await tx
        .insert(naoConformidades)
        .values({
          ...nova,
          empresaId: ctx.empresaId,
          numero: formatarNumeroNc(ano, ultimo!),
          dataAbertura: hoje,
          status: 'aberta',
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montar(linha!);
    });
  }

  /** Corrige campos descritivos. O prazo pode ser renegociado, mas não para antes da abertura. */
  async atualizar(
    ctx: Contexto,
    dados: { id?: unknown; alteracoes?: unknown },
  ): Promise<NaoConformidade> {
    const { versao, ...campos } = validar(atualizarNcSchema, dados?.alteracoes);
    const atual = await this.buscar(ctx, dados?.id);
    exigirTransicao('editar', atual.status as StatusNc);
    if (campos.prazo < atual.dataAbertura)
      throw invalido(
        'prazo',
        'O prazo não pode ser anterior à data de abertura.',
      );
    return montar(await this.gravar(ctx, atual.id, versao, campos));
  }

  /** Aberta: inicia o tratamento (ciclo 1). Em tratamento: revisa a análise, sem contar novo ciclo. */
  async registrarTratamento(
    ctx: Contexto,
    dados: { id?: unknown; alteracoes?: unknown },
  ): Promise<NaoConformidade> {
    const { versao, ...analise } = validar(
      registrarTratamentoSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    exigirTransicao('registrarTratamento', atual.status as StatusNc);
    const iniciando = atual.status === 'aberta';
    return montar(
      await this.gravar(ctx, atual.id, versao, {
        ...analise,
        status: 'em_tratamento',
        ...(iniciando ? { ciclos: 1 } : {}),
      }),
    );
  }

  async enviarParaVerificacao(
    ctx: Contexto,
    dados: { id?: unknown; alteracoes?: unknown },
  ): Promise<NaoConformidade> {
    const { versao, dataImplantacao } = validar(
      enviarParaVerificacaoSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    exigirTransicao('enviarParaVerificacao', atual.status as StatusNc);
    if (dataImplantacao < atual.dataAbertura)
      throw invalido(
        'dataImplantacao',
        'A implantação não pode ser anterior à abertura da NC.',
      );
    if (dataImplantacao > hojeEmBrasilia())
      throw invalido(
        'dataImplantacao',
        'A implantação não pode estar no futuro: envie para verificação depois de implantar.',
      );
    return montar(
      await this.gravar(ctx, atual.id, versao, {
        dataImplantacao,
        status: 'em_verificacao',
      }),
    );
  }

  /** Eficaz encerra. Ineficaz volta para tratamento e abre um novo ciclo: a ação corretiva precisa ser revista. */
  async verificarEficacia(
    ctx: Contexto,
    dados: { id?: unknown; alteracoes?: unknown },
  ): Promise<NaoConformidade> {
    const { versao, eficaz, parecer } = validar(
      verificarEficaciaSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    exigirTransicao('verificarEficacia', atual.status as StatusNc);
    const agora = new Date();
    return montar(
      await this.gravar(ctx, atual.id, versao, {
        eficaz,
        parecerEficacia: parecer,
        verificadoPor: ctx.usuarioId,
        verificadoEm: agora,
        status: statusAposVerificacao(eficaz),
        ...(eficaz
          ? { encerradaEm: agora }
          : { ciclos: atual.ciclos + 1, dataImplantacao: null }),
      }),
    );
  }

  async cancelar(
    ctx: Contexto,
    dados: { id?: unknown; alteracoes?: unknown },
  ): Promise<NaoConformidade> {
    const { versao, motivo } = validar(cancelarNcSchema, dados?.alteracoes);
    const atual = await this.buscar(ctx, dados?.id);
    exigirTransicao('cancelar', atual.status as StatusNc);
    return montar(
      await this.gravar(ctx, atual.id, versao, {
        status: 'cancelada',
        motivoCancelamento: motivo,
        canceladaEm: new Date(),
        canceladaPor: ctx.usuarioId,
      }),
    );
  }

  private async buscar(ctx: Contexto, id: unknown): Promise<Linha> {
    const [linha] = isUuid(id)
      ? await this.db
          .select()
          .from(naoConformidades)
          .where(
            and(
              eq(naoConformidades.id, id),
              eq(naoConformidades.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!linha)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Não conformidade não encontrada.',
      );
    return linha;
  }

  /** Grava só se a versão (atualizadoEm) for a que a tela leu: protege contra edição simultânea. */
  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof naoConformidades.$inferInsert>,
  ): Promise<Linha> {
    const lida = new Date(versao);
    if (Number.isNaN(lida.getTime()))
      throw new ErroDeNegocio('CONFLITO', ALTERADA_POR_OUTRA_PESSOA);
    const [linha] = await this.db
      .update(naoConformidades)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(
          eq(naoConformidades.id, id),
          eq(naoConformidades.empresaId, ctx.empresaId),
          eq(naoConformidades.atualizadoEm, lida),
        ),
      )
      .returning();
    if (!linha) throw new ErroDeNegocio('CONFLITO', ALTERADA_POR_OUTRA_PESSOA);
    return linha;
  }
}

function exigirTransicao(acao: AcaoNc, status: StatusNc): void {
  const recusa = recusaDaTransicao(acao, status);
  if (recusa) throw new ErroDeNegocio('REGRA_DE_NEGOCIO', recusa);
}

function invalido(campo: string, mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio(
    'DADOS_INVALIDOS',
    'Verifique os campos destacados.',
    [{ campo, mensagem }],
  );
}

function resumir(l: Linha, hoje: string): NaoConformidadeResumo {
  const status = l.status as StatusNc;
  return {
    id: l.id,
    numero: l.numero,
    titulo: l.titulo,
    origem: l.origem as NaoConformidadeResumo['origem'],
    gravidade: l.gravidade as NaoConformidadeResumo['gravidade'],
    responsavel: l.responsavel,
    prazo: l.prazo,
    status,
    ciclos: l.ciclos,
    vencida: estaVencida(l.prazo, status, hoje),
  };
}

function montar(l: Linha): NaoConformidade {
  return {
    ...resumir(l, hojeEmBrasilia()),
    descricao: l.descricao,
    origemRef: l.origemRef,
    tipo: l.tipo as NaoConformidade['tipo'],
    setor: l.setor,
    processo: l.processo,
    produto: l.produto,
    lote: l.lote,
    dataAbertura: l.dataAbertura,
    contencao: l.contencao,
    custoEstimado: l.custoEstimado,
    metodoAnalise: l.metodoAnalise as NaoConformidade['metodoAnalise'],
    categoria6m: l.categoria6m as NaoConformidade['categoria6m'],
    causaTipo: l.causaTipo,
    porques: l.porques,
    causaRaiz: l.causaRaiz,
    acaoCorretiva: l.acaoCorretiva,
    dataImplantacao: l.dataImplantacao,
    eficaz: l.eficaz,
    parecerEficacia: l.parecerEficacia,
    verificadoPor: l.verificadoPor,
    verificadoEm: l.verificadoEm?.toISOString() ?? null,
    encerradaEm: l.encerradaEm?.toISOString() ?? null,
    motivoCancelamento: l.motivoCancelamento,
    canceladaEm: l.canceladaEm?.toISOString() ?? null,
    criadoEm: l.criadoEm.toISOString(),
    versao: l.atualizadoEm.toISOString(),
  };
}
