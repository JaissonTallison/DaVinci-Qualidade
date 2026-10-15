import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DATABASE, type Database, ordemAlfabetica } from '@davinci/database';
import { ErroDeNegocio, hojeEmBrasilia, validar } from '@davinci/shared';
import {
  atualizarObjetivoSchema,
  atualizarRoSchema,
  classeDoRo,
  decidirMudancaSchema,
  encerrarRoSchema,
  filtroMudancasSchema,
  filtroRosSchema,
  implementarMudancaSchema,
  isUuid,
  novaAnaliseCriticaSchema,
  novaMudancaSchema,
  novoObjetivoSchema,
  novoRoSchema,
  registrarMedicaoSchema,
  situacaoDoObjetivoSchema,
  type AnaliseCritica,
  type Contexto,
  type Medicao,
  type Mudanca,
  type Objetivo,
  type ResumoSgi,
  type RiscoOuOportunidade,
  type SentidoMeta,
  type StatusMudanca,
  type TipoRo,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  analisesCriticas,
  medicoes,
  mudancas,
  objetivos,
  riscosOportunidades as ros,
  sequencias,
} from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const ORDEM = { alta: 0, media: 1, baixa: 2 } as const;
const CONFLITO =
  'Este registro foi alterado por outra pessoa ou não existe. Recarregue a página.';

/** Regra de meta: atingiu se o valor está do lado certo da meta. */
export function atingiu(
  valor: number,
  meta: number,
  sentido: SentidoMeta,
): boolean {
  return sentido === 'maior' ? valor >= meta : valor <= meta;
}

@Injectable()
export class SgiService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  // ---------------------------------------------------------------- riscos e oportunidades

  async listarRos(
    ctx: Contexto,
    dados: unknown,
  ): Promise<RiscoOuOportunidade[]> {
    const f = validar(filtroRosSchema, dados ?? {});
    const c: SQL[] = [eq(ros.empresaId, ctx.empresaId)];
    if (f.tipo) c.push(eq(ros.tipo, f.tipo));
    if (f.situacao === 'abertos') c.push(isNull(ros.encerradoEm));
    if (f.situacao === 'encerrados') c.push(isNotNull(ros.encerradoEm));
    const hoje = hojeEmBrasilia();
    return (
      await this.db
        .select()
        .from(ros)
        .where(and(...c))
        .orderBy(ordemAlfabetica(ros.processo))
    )
      .map((l) => montarRo(l, hoje))
      .filter((r) => !f.classe || r.classe === f.classe)
      .sort((a, b) => ORDEM[a.classe] - ORDEM[b.classe]);
  }

  async obterRo(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<RiscoOuOportunidade> {
    const [l] = isUuid(dados?.id)
      ? await this.db
          .select()
          .from(ros)
          .where(and(eq(ros.id, dados.id), eq(ros.empresaId, ctx.empresaId)))
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Registro não encontrado.');
    return montarRo(l, hojeEmBrasilia());
  }

  async criarRo(ctx: Contexto, dados: unknown): Promise<RiscoOuOportunidade> {
    const novo = validar(novoRoSchema, dados);
    const [l] = await this.db
      .insert(ros)
      .values({ ...novo, ...autoria(ctx) })
      .returning();
    return montarRo(l!, hojeEmBrasilia());
  }

  async atualizarRo(ctx: Contexto, dados: ComId): Promise<RiscoOuOportunidade> {
    const { versao, ...campos } = validar(atualizarRoSchema, dados?.alteracoes);
    const atual = await this.obterRo(ctx, { id: dados?.id });
    if (atual.encerradoEm) throw regra('Registro encerrado não se altera.');
    const [l] = await this.db
      .update(ros)
      .set({ ...campos, atualizadoPor: ctx.usuarioId })
      .where(and(eq(ros.id, atual.id), eq(ros.atualizadoEm, new Date(versao))))
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarRo(l, hojeEmBrasilia());
  }

  async encerrarRo(ctx: Contexto, dados: ComId): Promise<RiscoOuOportunidade> {
    const { versao, resultado } = validar(encerrarRoSchema, dados?.alteracoes);
    const atual = await this.obterRo(ctx, { id: dados?.id });
    if (atual.encerradoEm) throw regra('Este registro já está encerrado.');
    const [l] = await this.db
      .update(ros)
      .set({ resultado, encerradoEm: new Date(), atualizadoPor: ctx.usuarioId })
      .where(and(eq(ros.id, atual.id), eq(ros.atualizadoEm, new Date(versao))))
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarRo(l, hojeEmBrasilia());
  }

  // ---------------------------------------------------------------- objetivos

  async listarObjetivos(ctx: Contexto): Promise<Objetivo[]> {
    const lista = await this.db
      .select()
      .from(objetivos)
      .where(eq(objetivos.empresaId, ctx.empresaId))
      .orderBy(desc(objetivos.ativo), ordemAlfabetica(objetivos.nome));
    const ms = lista.length
      ? await this.db
          .select()
          .from(medicoes)
          .where(
            inArray(
              medicoes.objetivoId,
              lista.map((o) => o.id),
            ),
          )
          .orderBy(desc(medicoes.competencia))
      : [];
    return lista.map((o) =>
      montarObjetivo(
        o,
        ms.filter((m) => m.objetivoId === o.id),
      ),
    );
  }

  async criarObjetivo(ctx: Contexto, dados: unknown): Promise<Objetivo> {
    const novo = validar(novoObjetivoSchema, dados);
    const [l] = await this.db
      .insert(objetivos)
      .values({ ...novo, ...autoria(ctx) })
      .returning();
    return montarObjetivo(l!, []);
  }

  async atualizarObjetivo(ctx: Contexto, dados: ComId): Promise<Objetivo> {
    const { versao, ...campos } = validar(
      atualizarObjetivoSchema,
      dados?.alteracoes,
    );
    return this.gravarObjetivo(ctx, dados?.id, versao, campos);
  }

  async situacaoObjetivo(ctx: Contexto, dados: ComId): Promise<Objetivo> {
    const { versao, ativo } = validar(
      situacaoDoObjetivoSchema,
      dados?.alteracoes,
    );
    return this.gravarObjetivo(ctx, dados?.id, versao, { ativo });
  }

  /** Mesma competência de novo: corrige o valor (upsert). Mês futuro não. */
  async registrarMedicao(ctx: Contexto, dados: ComId): Promise<Objetivo> {
    const m = validar(registrarMedicaoSchema, dados?.alteracoes);
    if (m.competencia > hojeEmBrasilia().slice(0, 7))
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [
          {
            campo: 'competencia',
            mensagem: 'Mês futuro ainda não tem medição.',
          },
        ],
      );
    const o = await this.objetivo(ctx, dados?.id);
    if (!o.ativo) throw regra('Objetivo inativo não recebe medição.');
    await this.db
      .insert(medicoes)
      .values({ ...m, objetivoId: o.id, ...autoria(ctx) })
      .onConflictDoUpdate({
        target: [medicoes.objetivoId, medicoes.competencia],
        set: {
          valor: m.valor,
          analise: m.analise,
          atualizadoPor: ctx.usuarioId,
          atualizadoEm: new Date(),
        },
      });
    return (await this.listarObjetivos(ctx)).find((x) => x.id === o.id)!;
  }

  // ---------------------------------------------------------------- análise crítica

  async listarAnalises(ctx: Contexto): Promise<AnaliseCritica[]> {
    return (
      await this.db
        .select()
        .from(analisesCriticas)
        .where(eq(analisesCriticas.empresaId, ctx.empresaId))
        .orderBy(desc(analisesCriticas.data))
    ).map(montarAnalise);
  }

  async obterAnalise(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<AnaliseCritica> {
    const [l] = isUuid(dados?.id)
      ? await this.db
          .select()
          .from(analisesCriticas)
          .where(
            and(
              eq(analisesCriticas.id, dados.id),
              eq(analisesCriticas.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Análise crítica não encontrada.',
      );
    return montarAnalise(l);
  }

  async criarAnalise(ctx: Contexto, dados: unknown): Promise<AnaliseCritica> {
    const a = validar(novaAnaliseCriticaSchema, dados);
    if (a.data > hojeEmBrasilia())
      throw invalido(
        'data',
        'Registre a análise depois da reunião: a data não pode estar no futuro.',
      );
    if (a.proximaAnalise <= a.data)
      throw invalido('proximaAnalise', 'A próxima análise vem depois desta.');
    const [l] = await this.db
      .insert(analisesCriticas)
      .values({ ...a, ...autoria(ctx) })
      .returning();
    return montarAnalise(l!);
  }

  // ---------------------------------------------------------------- mudanças

  async listarMudancas(ctx: Contexto, dados: unknown): Promise<Mudanca[]> {
    const f = validar(filtroMudancasSchema, dados ?? {});
    const c: SQL[] = [eq(mudancas.empresaId, ctx.empresaId)];
    if (f.status) c.push(eq(mudancas.status, f.status));
    return (
      await this.db
        .select()
        .from(mudancas)
        .where(and(...c))
        .orderBy(desc(mudancas.criadoEm))
    ).map((l) => montarMudanca(l, ctx));
  }

  async obterMudanca(ctx: Contexto, dados: { id?: unknown }): Promise<Mudanca> {
    return montarMudanca(await this.mudanca(ctx, dados?.id), ctx);
  }

  async criarMudanca(ctx: Contexto, dados: unknown): Promise<Mudanca> {
    const m = validar(novaMudancaSchema, dados);
    const ano = hojeEmBrasilia().slice(0, 4);
    return this.db.transaction(async (tx) => {
      const [{ ultimo }] = await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `MUD-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo });
      const [l] = await tx
        .insert(mudancas)
        .values({
          ...m,
          numero: `MUD-${ano}-${String(ultimo).padStart(3, '0')}`,
          ...autoria(ctx),
        })
        .returning();
      return montarMudanca(l!, ctx);
    });
  }

  /** Quem propôs não decide sobre a própria mudança. */
  async decidirMudanca(ctx: Contexto, dados: ComId): Promise<Mudanca> {
    const { versao, aprovar, parecer } = validar(
      decidirMudancaSchema,
      dados?.alteracoes,
    );
    const atual = await this.mudanca(ctx, dados?.id);
    if (atual.status !== 'proposta')
      throw regra('Só mudança proposta recebe decisão.');
    if (atual.criadoPor === ctx.usuarioId)
      throw regra(
        'Quem propôs a mudança não decide sobre ela: peça a outro gestor.',
      );
    return this.gravarMudanca(ctx, atual.id, versao, {
      status: aprovar ? 'aprovada' : 'rejeitada',
      parecer,
      decididaPor: ctx.usuarioId,
      decididaEm: new Date(),
    });
  }

  async implementarMudanca(ctx: Contexto, dados: ComId): Promise<Mudanca> {
    const { versao, verificacao } = validar(
      implementarMudancaSchema,
      dados?.alteracoes,
    );
    const atual = await this.mudanca(ctx, dados?.id);
    if (atual.status !== 'aprovada')
      throw regra('Só mudança aprovada é implementada.');
    return this.gravarMudanca(ctx, atual.id, versao, {
      status: 'implementada',
      verificacao,
      implementadaEm: new Date(),
    });
  }

  // ---------------------------------------------------------------- resumo

  async resumo(ctx: Contexto): Promise<ResumoSgi> {
    const hoje = hojeEmBrasilia();
    const [lista, objs, [ultima], aguardando] = await Promise.all([
      this.listarRos(ctx, {}),
      this.listarObjetivos(ctx),
      this.db
        .select()
        .from(analisesCriticas)
        .where(eq(analisesCriticas.empresaId, ctx.empresaId))
        .orderBy(desc(analisesCriticas.data))
        .limit(1),
      this.db
        .select({ id: mudancas.id })
        .from(mudancas)
        .where(
          and(
            eq(mudancas.empresaId, ctx.empresaId),
            eq(mudancas.status, 'proposta'),
          ),
        ),
    ]);
    const ativos = objs.filter((o) => o.ativo);
    return {
      rosAltosAbertos: lista.filter((r) => r.classe === 'alta').length,
      rosComPrazoVencido: lista.filter((r) => r.prazoVencido).length,
      objetivosFora: ativos.filter(
        (o) => o.medicoes[0] && !o.medicoes[0].atingiu,
      ).length,
      objetivosMedidos: ativos.filter((o) => o.medicoes.length > 0).length,
      objetivosSemMedicao: ativos.filter((o) => !o.medicoes.length).length,
      ultimaAnaliseCritica: ultima?.data ?? null,
      proximaAnaliseCritica: ultima?.proximaAnalise ?? null,
      analiseCriticaAtrasada: !ultima || ultima.proximaAnalise < hoje,
      mudancasAguardandoDecisao: aguardando.length,
    };
  }

  // ---------------------------------------------------------------- apoio

  private async objetivo(ctx: Contexto, id: unknown) {
    const [o] = isUuid(id)
      ? await this.db
          .select()
          .from(objetivos)
          .where(
            and(eq(objetivos.id, id), eq(objetivos.empresaId, ctx.empresaId)),
          )
      : [];
    if (!o)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Objetivo não encontrado.');
    return o;
  }

  private async gravarObjetivo(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof objetivos.$inferInsert>,
  ): Promise<Objetivo> {
    const o = await this.objetivo(ctx, id);
    const [l] = await this.db
      .update(objetivos)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(
          eq(objetivos.id, o.id),
          eq(objetivos.atualizadoEm, new Date(versao)),
        ),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return (await this.listarObjetivos(ctx)).find((x) => x.id === o.id)!;
  }

  private async mudanca(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(mudancas)
          .where(
            and(eq(mudancas.id, id), eq(mudancas.empresaId, ctx.empresaId)),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Mudança não encontrada.');
    return l;
  }

  private async gravarMudanca(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof mudancas.$inferInsert>,
  ): Promise<Mudanca> {
    const [l] = await this.db
      .update(mudancas)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(eq(mudancas.id, id), eq(mudancas.atualizadoEm, new Date(versao))),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarMudanca(l, ctx);
  }
}

const autoria = (ctx: Contexto) => ({
  empresaId: ctx.empresaId,
  criadoPor: ctx.usuarioId,
  atualizadoPor: ctx.usuarioId,
});
const regra = (m: string) => new ErroDeNegocio('REGRA_DE_NEGOCIO', m);
const invalido = (campo: string, mensagem: string) =>
  new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique os campos destacados.', [
    { campo, mensagem },
  ]);

function montarRo(
  l: typeof ros.$inferSelect,
  hoje: string,
): RiscoOuOportunidade {
  return {
    id: l.id,
    tipo: l.tipo as TipoRo,
    processo: l.processo,
    descricao: l.descricao,
    contexto: l.contexto,
    probabilidade: l.probabilidade,
    impacto: l.impacto,
    classe: classeDoRo(l.probabilidade, l.impacto),
    acao: l.acao,
    responsavel: l.responsavel,
    prazo: l.prazo,
    prazoVencido: !l.encerradoEm && Boolean(l.prazo && l.prazo < hoje),
    resultado: l.resultado,
    encerradoEm: l.encerradoEm?.toISOString() ?? null,
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarObjetivo(
  o: typeof objetivos.$inferSelect,
  ms: (typeof medicoes.$inferSelect)[],
): Objetivo {
  const sentido = o.sentido as SentidoMeta;
  return {
    id: o.id,
    nome: o.nome,
    indicador: o.indicador,
    unidade: o.unidade,
    meta: o.meta,
    sentido,
    responsavel: o.responsavel,
    ativo: o.ativo,
    medicoes: ms.map((m): Medicao => ({
      competencia: m.competencia,
      valor: m.valor,
      atingiu: atingiu(m.valor, o.meta, sentido),
      analise: m.analise,
    })),
    versao: o.atualizadoEm.toISOString(),
  };
}

function montarAnalise(
  l: typeof analisesCriticas.$inferSelect,
): AnaliseCritica {
  return {
    id: l.id,
    data: l.data,
    participantes: l.participantes,
    entradas: l.entradas,
    decisoes: l.decisoes,
    proximaAnalise: l.proximaAnalise,
  };
}

function montarMudanca(
  l: typeof mudancas.$inferSelect,
  ctx: Contexto,
): Mudanca {
  return {
    id: l.id,
    numero: l.numero,
    titulo: l.titulo,
    descricao: l.descricao,
    motivo: l.motivo,
    impactos: l.impactos,
    responsavel: l.responsavel,
    dataPrevista: l.dataPrevista,
    status: l.status as StatusMudanca,
    parecer: l.parecer,
    decididaEm: l.decididaEm?.toISOString() ?? null,
    verificacao: l.verificacao,
    implementadaEm: l.implementadaEm?.toISOString() ?? null,
    propostaPorMim: l.criadoPor === ctx.usuarioId,
    versao: l.atualizadoEm.toISOString(),
  };
}
