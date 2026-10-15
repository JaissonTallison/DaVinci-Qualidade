import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DATABASE, type Database, ordemAlfabetica } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  somarMeses,
  validar,
} from '@davinci/shared';
import {
  aspectoSignificativo,
  atualizarAspectoSchema,
  atualizarRequisitoSchema,
  atualizarResiduoSchema,
  avaliarRequisitoSchema,
  cumprirCondicionanteSchema,
  DIAS_PARA_CDF,
  filtroAspectosSchema,
  filtroRequisitosSchema,
  filtroSaidasSchema,
  isUuid,
  MESES_ENTRE_AVALIACOES,
  novaCondicionanteSchema,
  novaLicencaSchema,
  novoAspectoSchema,
  novoRequisitoSchema,
  novoResiduoSchema,
  registrarCdfSchema,
  registrarSaidaSchema,
  renovacaoSolicitadaSchema,
  significanciaDoAspecto,
  situacaoDoAspectoSchema,
  type AspectoAmbiental,
  type Atendimento,
  type ClasseResiduo,
  type Condicionante,
  type Contexto,
  type Esfera,
  type Incidencia,
  type Licenca,
  type RequisitoLegal,
  type Residuo,
  type ResumoAmbiental,
  type SaidaDeResiduo,
  type SituacaoLicenca,
  type SituacaoOperacional,
  type TipoLicenca,
  type UnidadeResiduo,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  aspectos,
  condicionantes,
  licencas,
  requisitos,
  residuos,
  saidas,
} from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const CONFLITO =
  'Este registro foi alterado por outra pessoa ou não existe. Recarregue a página.';

/** Situação da licença: vencida após a validade; protocolada não pede mais renovação; dentro da janela, renovar. */
export function situacaoDaLicenca(
  validade: string,
  renovarAte: string,
  protocolada: boolean,
  hoje: string,
): SituacaoLicenca {
  if (validade < hoje) return 'vencida';
  if (protocolada) return 'em_renovacao';
  return hoje >= renovarAte ? 'renovar' : 'vigente';
}

@Injectable()
export class AmbientalService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  // ---------------------------------------------------------------- aspectos e impactos

  async listarAspectos(
    ctx: Contexto,
    dados: unknown,
  ): Promise<AspectoAmbiental[]> {
    const f = validar(filtroAspectosSchema, dados ?? {});
    const c: SQL[] = [eq(aspectos.empresaId, ctx.empresaId)];
    if (f.situacao !== 'todos')
      c.push(eq(aspectos.ativo, f.situacao === 'ativos'));
    const hoje = hojeEmBrasilia();
    const ORDEM = { alta: 0, media: 1, baixa: 2 } as const;
    return (
      await this.db
        .select()
        .from(aspectos)
        .where(and(...c))
        .orderBy(ordemAlfabetica(aspectos.atividade))
    )
      .map((l) => montarAspecto(l, hoje))
      .filter(
        (a) =>
          !f.significativos || a.significativo === (f.significativos === 'sim'),
      )
      .sort(
        (a, b) =>
          Number(b.significativo) - Number(a.significativo) ||
          ORDEM[a.significancia] - ORDEM[b.significancia],
      );
  }

  async obterAspecto(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<AspectoAmbiental> {
    return montarAspecto(await this.aspecto(ctx, dados?.id), hojeEmBrasilia());
  }

  async criarAspecto(ctx: Contexto, dados: unknown): Promise<AspectoAmbiental> {
    const n = validar(novoAspectoSchema, dados);
    const [l] = await this.db
      .insert(aspectos)
      .values({ ...n, ...autoria(ctx) })
      .returning();
    return montarAspecto(l!, hojeEmBrasilia());
  }

  async atualizarAspecto(
    ctx: Contexto,
    dados: ComId,
  ): Promise<AspectoAmbiental> {
    const { versao, ...campos } = validar(
      atualizarAspectoSchema,
      dados?.alteracoes,
    );
    const a = await this.aspecto(ctx, dados?.id);
    const [l] = await this.db
      .update(aspectos)
      .set({ ...campos, atualizadoPor: ctx.usuarioId })
      .where(
        and(eq(aspectos.id, a.id), eq(aspectos.atualizadoEm, new Date(versao))),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarAspecto(l, hojeEmBrasilia());
  }

  async situacaoAspecto(
    ctx: Contexto,
    dados: ComId,
  ): Promise<AspectoAmbiental> {
    const { versao, ativo } = validar(
      situacaoDoAspectoSchema,
      dados?.alteracoes,
    );
    const a = await this.aspecto(ctx, dados?.id);
    const [l] = await this.db
      .update(aspectos)
      .set({ ativo, atualizadoPor: ctx.usuarioId })
      .where(
        and(eq(aspectos.id, a.id), eq(aspectos.atualizadoEm, new Date(versao))),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarAspecto(l, hojeEmBrasilia());
  }

  // ---------------------------------------------------------------- requisitos legais

  async listarRequisitos(
    ctx: Contexto,
    dados: unknown,
  ): Promise<RequisitoLegal[]> {
    const f = validar(filtroRequisitosSchema, dados ?? {});
    const c: SQL[] = [eq(requisitos.empresaId, ctx.empresaId)];
    if (f.atendimento) c.push(eq(requisitos.atendimento, f.atendimento));
    const hoje = hojeEmBrasilia();
    return (
      await this.db
        .select()
        .from(requisitos)
        .where(and(...c))
        .orderBy(asc(requisitos.esfera), ordemAlfabetica(requisitos.norma))
    ).map((l) => montarRequisito(l, hoje));
  }

  async obterRequisito(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<RequisitoLegal> {
    return montarRequisito(
      await this.requisito(ctx, dados?.id),
      hojeEmBrasilia(),
    );
  }

  async criarRequisito(ctx: Contexto, dados: unknown): Promise<RequisitoLegal> {
    const n = validar(novoRequisitoSchema, dados);
    const [l] = await this.db
      .insert(requisitos)
      .values({ ...n, ...autoria(ctx) })
      .returning();
    return montarRequisito(l!, hojeEmBrasilia());
  }

  async atualizarRequisito(
    ctx: Contexto,
    dados: ComId,
  ): Promise<RequisitoLegal> {
    const { versao, ...campos } = validar(
      atualizarRequisitoSchema,
      dados?.alteracoes,
    );
    const r = await this.requisito(ctx, dados?.id);
    return this.gravarRequisito(ctx, r.id, versao, campos);
  }

  async avaliarRequisito(ctx: Contexto, dados: ComId): Promise<RequisitoLegal> {
    const { versao, data, atendimento, evidencia, acao } = validar(
      avaliarRequisitoSchema,
      dados?.alteracoes,
    );
    if (data > hojeEmBrasilia())
      throw invalido('data', 'A avaliação não pode estar no futuro.');
    const r = await this.requisito(ctx, dados?.id);
    return this.gravarRequisito(ctx, r.id, versao, {
      atendimento,
      ultimaAvaliacao: data,
      evidencia,
      acao: atendimento === 'atende' ? null : acao,
    });
  }

  // ---------------------------------------------------------------- licenças

  async listarLicencas(ctx: Contexto): Promise<Licenca[]> {
    const ls = await this.db
      .select()
      .from(licencas)
      .where(eq(licencas.empresaId, ctx.empresaId))
      .orderBy(asc(licencas.validade));
    const cs = ls.length
      ? await this.db
          .select()
          .from(condicionantes)
          .where(
            inArray(
              condicionantes.licencaId,
              ls.map((l) => l.id),
            ),
          )
          .orderBy(asc(condicionantes.prazo))
      : [];
    const hoje = hojeEmBrasilia();
    return ls.map((l) =>
      montarLicenca(
        l,
        cs.filter((c) => c.licencaId === l.id),
        hoje,
      ),
    );
  }

  async obterLicenca(ctx: Contexto, dados: { id?: unknown }): Promise<Licenca> {
    const l = await this.licenca(ctx, dados?.id);
    const cs = await this.db
      .select()
      .from(condicionantes)
      .where(eq(condicionantes.licencaId, l.id))
      .orderBy(asc(condicionantes.prazo));
    return montarLicenca(l, cs, hojeEmBrasilia());
  }

  async criarLicenca(ctx: Contexto, dados: unknown): Promise<Licenca> {
    const n = validar(novaLicencaSchema, dados);
    const [l] = await this.db
      .insert(licencas)
      .values({ ...n, ...autoria(ctx) })
      .returning();
    return montarLicenca(l!, [], hojeEmBrasilia());
  }

  /** Protocolo de renovação: a licença sai do alerta "pedir renovação" e fica "renovação protocolada". */
  async renovacaoSolicitada(ctx: Contexto, dados: ComId): Promise<Licenca> {
    const { versao, data, protocolo } = validar(
      renovacaoSolicitadaSchema,
      dados?.alteracoes,
    );
    if (data > hojeEmBrasilia())
      throw invalido('data', 'A data do protocolo não pode estar no futuro.');
    const atual = await this.licenca(ctx, dados?.id);
    const [l] = await this.db
      .update(licencas)
      .set({
        renovacaoData: data,
        renovacaoProtocolo: protocolo,
        atualizadoPor: ctx.usuarioId,
      })
      .where(
        and(
          eq(licencas.id, atual.id),
          eq(licencas.atualizadoEm, new Date(versao)),
        ),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return this.obterLicenca(ctx, { id: l.id });
  }

  async criarCondicionante(ctx: Contexto, dados: ComId): Promise<Licenca> {
    const n = validar(novaCondicionanteSchema, dados?.alteracoes);
    const l = await this.licenca(ctx, dados?.id);
    await this.db
      .insert(condicionantes)
      .values({ ...n, licencaId: l.id, ...autoria(ctx) });
    return this.obterLicenca(ctx, { id: l.id });
  }

  /** Cumprir: guarda a evidência; se for periódica, abre a próxima com o prazo somado à periodicidade. */
  async cumprirCondicionante(ctx: Contexto, dados: ComId): Promise<Licenca> {
    const { data, evidencia } = validar(
      cumprirCondicionanteSchema,
      dados?.alteracoes,
    );
    if (data > hojeEmBrasilia())
      throw invalido('data', 'A data não pode estar no futuro.');
    const [c] = isUuid(dados?.id)
      ? await this.db
          .select()
          .from(condicionantes)
          .where(
            and(
              eq(condicionantes.id, dados.id),
              eq(condicionantes.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!c)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Condicionante não encontrada.',
      );
    if (c.cumpridaEm)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Esta condicionante já foi cumprida.',
      );
    await this.db.transaction(async (tx) => {
      await tx
        .update(condicionantes)
        .set({ cumpridaEm: data, evidencia, atualizadoPor: ctx.usuarioId })
        .where(eq(condicionantes.id, c.id));
      if (c.periodicidadeMeses)
        await tx.insert(condicionantes).values({
          licencaId: c.licencaId,
          descricao: c.descricao,
          periodicidadeMeses: c.periodicidadeMeses,
          prazo: somarMeses(c.prazo ?? data, c.periodicidadeMeses),
          ...autoria(ctx),
        });
    });
    return this.obterLicenca(ctx, { id: c.licencaId });
  }

  // ---------------------------------------------------------------- resíduos

  async listarResiduos(ctx: Contexto): Promise<Residuo[]> {
    const inicioDoAno = `${hojeEmBrasilia().slice(0, 4)}-01-01`;
    const [ls, totais] = await Promise.all([
      this.db
        .select()
        .from(residuos)
        .where(eq(residuos.empresaId, ctx.empresaId))
        .orderBy(ordemAlfabetica(residuos.nome)),
      this.db
        .select({
          residuoId: saidas.residuoId,
          total: sql<number>`sum(${saidas.quantidade})`,
        })
        .from(saidas)
        .where(
          and(
            eq(saidas.empresaId, ctx.empresaId),
            gte(saidas.data, inicioDoAno),
          ),
        )
        .groupBy(saidas.residuoId),
    ]);
    return ls.map((l) => ({
      id: l.id,
      nome: l.nome,
      classe: l.classe as ClasseResiduo,
      origem: l.origem,
      acondicionamento: l.acondicionamento,
      destinacao: l.destinacao,
      unidade: l.unidade as UnidadeResiduo,
      quantidadeNoAno: Number(
        totais.find((t) => t.residuoId === l.id)?.total ?? 0,
      ),
      versao: l.atualizadoEm.toISOString(),
    }));
  }

  async criarResiduo(ctx: Contexto, dados: unknown): Promise<Residuo> {
    const n = validar(novoResiduoSchema, dados);
    const [l] = await this.db
      .insert(residuos)
      .values({ ...n, ...autoria(ctx) })
      .returning();
    return (await this.listarResiduos(ctx)).find((r) => r.id === l!.id)!;
  }

  async atualizarResiduo(ctx: Contexto, dados: ComId): Promise<Residuo> {
    const { versao, ...campos } = validar(
      atualizarResiduoSchema,
      dados?.alteracoes,
    );
    const [l] = isUuid(dados?.id)
      ? await this.db
          .update(residuos)
          .set({ ...campos, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(residuos.id, dados.id),
              eq(residuos.empresaId, ctx.empresaId),
              eq(residuos.atualizadoEm, new Date(versao)),
            ),
          )
          .returning()
      : [];
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return (await this.listarResiduos(ctx)).find((r) => r.id === l.id)!;
  }

  async listarSaidas(ctx: Contexto, dados: unknown): Promise<SaidaDeResiduo[]> {
    const f = validar(filtroSaidasSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const c: SQL[] = [eq(saidas.empresaId, ctx.empresaId)];
    if (f.residuoId) c.push(eq(saidas.residuoId, f.residuoId));
    if (f.semCdf) c.push(isNull(saidas.cdfNumero));
    if (f.ano)
      c.push(
        gte(saidas.data, `${f.ano}-01-01`),
        lt(saidas.data, `${f.ano + 1}-01-01`),
      );
    const ls = await this.db
      .select({
        s: saidas,
        nome: residuos.nome,
        classe: residuos.classe,
        unidade: residuos.unidade,
      })
      .from(saidas)
      .innerJoin(residuos, eq(residuos.id, saidas.residuoId))
      .where(and(...c))
      .orderBy(desc(saidas.data), desc(saidas.criadoEm))
      .limit(200);
    return ls.map((l) => montarSaida(l, hoje));
  }

  async registrarSaida(
    ctx: Contexto,
    dados: unknown,
  ): Promise<SaidaDeResiduo[]> {
    const n = validar(registrarSaidaSchema, dados);
    if (n.data > hojeEmBrasilia())
      throw invalido('data', 'A saída não pode estar no futuro.');
    const [r] = await this.db
      .select()
      .from(residuos)
      .where(
        and(
          eq(residuos.id, n.residuoId),
          eq(residuos.empresaId, ctx.empresaId),
        ),
      );
    if (!r) throw invalido('residuoId', 'Resíduo não encontrado.');
    await this.db.insert(saidas).values({ ...n, ...autoria(ctx) });
    return this.listarSaidas(ctx, {});
  }

  async registrarCdf(ctx: Contexto, dados: ComId): Promise<SaidaDeResiduo[]> {
    const { numero, data } = validar(registrarCdfSchema, dados?.alteracoes);
    const [s] = isUuid(dados?.id)
      ? await this.db
          .select()
          .from(saidas)
          .where(
            and(eq(saidas.id, dados.id), eq(saidas.empresaId, ctx.empresaId)),
          )
      : [];
    if (!s) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Saída não encontrada.');
    if (s.cdfNumero)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Esta saída já tem o CDF registrado.',
      );
    if (data < s.data)
      throw invalido('data', 'O CDF não pode ser anterior à saída do resíduo.');
    await this.db
      .update(saidas)
      .set({
        cdfNumero: numero,
        cdfData: data,
        cdfRegistradoEm: new Date(),
        atualizadoPor: ctx.usuarioId,
      })
      .where(eq(saidas.id, s.id));
    return this.listarSaidas(ctx, {});
  }

  // ---------------------------------------------------------------- resumo

  async resumo(ctx: Contexto): Promise<ResumoAmbiental> {
    const [as, rs, ls, ss] = await Promise.all([
      this.listarAspectos(ctx, {}),
      this.listarRequisitos(ctx, {}),
      this.listarLicencas(ctx),
      this.listarSaidas(ctx, { semCdf: 'sim' }),
    ]);
    return {
      licencas: ls.length,
      aspectosSignificativos: as.filter((a) => a.significativo).length,
      acoesVencidas: as.filter((a) => a.prazoVencido).length,
      requisitosNaoAtendidos: rs.filter(
        (r) => r.atendimento === 'nao_atende' || r.atendimento === 'parcial',
      ).length,
      avaliacoesVencidas: rs.filter((r) => r.avaliacaoVencida).length,
      licencasVencidas: ls.filter((l) => l.situacao === 'vencida').length,
      licencasParaRenovar: ls.filter((l) => l.situacao === 'renovar').length,
      condicionantesVencidas: ls
        .flatMap((l) => l.condicionantes)
        .filter((c) => c.vencida).length,
      cdfsAtrasados: ss.filter((s) => s.cdfAtrasado).length,
    };
  }

  // ---------------------------------------------------------------- apoio

  private async aspecto(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(aspectos)
          .where(
            and(eq(aspectos.id, id), eq(aspectos.empresaId, ctx.empresaId)),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Aspecto não encontrado.');
    return l;
  }

  private async requisito(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(requisitos)
          .where(
            and(eq(requisitos.id, id), eq(requisitos.empresaId, ctx.empresaId)),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Requisito não encontrado.');
    return l;
  }

  private async gravarRequisito(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof requisitos.$inferInsert>,
  ): Promise<RequisitoLegal> {
    const [l] = await this.db
      .update(requisitos)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(
          eq(requisitos.id, id),
          eq(requisitos.atualizadoEm, new Date(versao)),
        ),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarRequisito(l, hojeEmBrasilia());
  }

  private async licenca(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(licencas)
          .where(
            and(eq(licencas.id, id), eq(licencas.empresaId, ctx.empresaId)),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Licença não encontrada.');
    return l;
  }
}

const autoria = (ctx: Contexto) => ({
  empresaId: ctx.empresaId,
  criadoPor: ctx.usuarioId,
  atualizadoPor: ctx.usuarioId,
});
const invalido = (campo: string, mensagem: string) =>
  new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique os campos destacados.', [
    { campo, mensagem },
  ]);

function montarAspecto(
  l: typeof aspectos.$inferSelect,
  hoje: string,
): AspectoAmbiental {
  const significativo = aspectoSignificativo(
    l.severidade,
    l.frequencia,
    l.requisitoLegal,
  );
  return {
    id: l.id,
    atividade: l.atividade,
    aspecto: l.aspecto,
    impacto: l.impacto,
    situacao: l.situacao as SituacaoOperacional,
    incidencia: l.incidencia as Incidencia,
    severidade: l.severidade,
    frequencia: l.frequencia,
    requisitoLegal: l.requisitoLegal,
    significancia: significanciaDoAspecto(l.severidade, l.frequencia),
    significativo,
    controles: l.controles,
    acoes: l.acoes,
    responsavel: l.responsavel,
    prazo: l.prazo,
    prazoVencido:
      l.ativo && significativo && Boolean(l.prazo && l.prazo < hoje),
    ativo: l.ativo,
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarRequisito(
  l: typeof requisitos.$inferSelect,
  hoje: string,
): RequisitoLegal {
  const proxima = l.ultimaAvaliacao
    ? somarMeses(l.ultimaAvaliacao, MESES_ENTRE_AVALIACOES)
    : null;
  return {
    id: l.id,
    norma: l.norma,
    esfera: l.esfera as Esfera,
    tema: l.tema,
    requisito: l.requisito,
    atendimento: l.atendimento as Atendimento,
    ultimaAvaliacao: l.ultimaAvaliacao,
    proximaAvaliacao: proxima,
    avaliacaoVencida: !proxima || proxima < hoje,
    evidencia: l.evidencia,
    acao: l.acao,
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarLicenca(
  l: typeof licencas.$inferSelect,
  cs: (typeof condicionantes.$inferSelect)[],
  hoje: string,
): Licenca {
  const renovarAte = somarDias(l.validade, -l.diasParaRenovar);
  return {
    id: l.id,
    tipo: l.tipo as TipoLicenca,
    numero: l.numero,
    orgao: l.orgao,
    descricao: l.descricao,
    emissao: l.emissao,
    validade: l.validade,
    diasParaRenovar: l.diasParaRenovar,
    renovarAte,
    renovacaoProtocolo: l.renovacaoProtocolo,
    renovacaoData: l.renovacaoData,
    situacao: situacaoDaLicenca(
      l.validade,
      renovarAte,
      Boolean(l.renovacaoProtocolo),
      hoje,
    ),
    condicionantes: cs.map((c): Condicionante => ({
      id: c.id,
      descricao: c.descricao,
      prazo: c.prazo,
      periodicidadeMeses: c.periodicidadeMeses,
      cumpridaEm: c.cumpridaEm,
      evidencia: c.evidencia,
      vencida: !c.cumpridaEm && Boolean(c.prazo && c.prazo < hoje),
    })),
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarSaida(
  l: {
    s: typeof saidas.$inferSelect;
    nome: string;
    classe: string;
    unidade: string;
  },
  hoje: string,
): SaidaDeResiduo {
  return {
    id: l.s.id,
    residuoId: l.s.residuoId,
    residuoNome: l.nome,
    classe: l.classe as ClasseResiduo,
    data: l.s.data,
    quantidade: l.s.quantidade,
    unidade: l.unidade as UnidadeResiduo,
    mtr: l.s.mtr,
    transportador: l.s.transportador,
    destinador: l.s.destinador,
    cdfNumero: l.s.cdfNumero,
    cdfData: l.s.cdfData,
    cdfAtrasado: !l.s.cdfNumero && somarDias(l.s.data, DIAS_PARA_CDF) < hoje,
  };
}
