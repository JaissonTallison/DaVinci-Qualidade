import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { and, asc, desc, eq, gte, like, lt, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  pedir,
  somarDias,
  validar,
} from '@davinci/shared';
import {
  atualizarDestinadorSchema,
  atualizarObrigacaoSchema,
  atualizarProgramaSchema,
  comunicacaoObrigatoria,
  comunicarOcorrenciaSchema,
  cumprirObrigacaoSchema,
  encerrarOcorrenciaSchema,
  INDICADORES_DO_PROGRAMA,
  isUuid,
  medirProgramaSchema,
  ncDaOcorrenciaSchema,
  novaObrigacaoSchema,
  novaOcorrenciaSchema,
  novoDestinadorSchema,
  novoProgramaSchema,
  PATTERNS,
  progressoDaMeta,
  registrarProducaoSchema,
  SERVICES,
  TIPOS_DE_OCORRENCIA,
  type Contexto,
  type Destinador,
  type Ecoeficiencia,
  type EcoeficienciaDoMes,
  type IndicadorDoPrograma,
  type InventarioDeResiduos,
  type MeioAfetado,
  type NaoConformidade,
  type ObrigacaoLegal,
  type OcorrenciaAmbiental,
  type Periodicidade,
  type ProducaoDoMes,
  type ProgramaAmbiental,
  type SeveridadeAmbiental,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  consumos,
  destinadores,
  fatores,
  obrigacoes,
  ocorrencias,
  producao,
  programas,
  residuos,
  saidas,
  sequencias,
} from '../db/schema.js';
import {
  emKg,
  porUnidade,
  proximoVencimento,
  situacaoDaObrigacao,
} from './regras.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const CONFLITO =
  'Este registro foi alterado por outra pessoa. Recarregue a página.';
const DIAS_DA_NC = 30;

/** Gestão ambiental: ocorrências, obrigações legais, destinadores, inventário, produção, ecoeficiência e programas. */
@Injectable()
export class GestaoAmbientalService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    @Inject(SERVICES.QUALIDADE)
    private readonly qualidade: Pick<ClientProxy, 'send'>,
  ) {}

  // ---------------------------------------------------------------- ocorrências

  async listarOcorrencias(ctx: Contexto): Promise<OcorrenciaAmbiental[]> {
    const linhas = await this.db
      .select()
      .from(ocorrencias)
      .where(eq(ocorrencias.empresaId, ctx.empresaId))
      .orderBy(desc(ocorrencias.data), desc(ocorrencias.numero));
    const hoje = hojeEmBrasilia();
    return linhas.map((l) => montarOcorrencia(l, hoje));
  }

  async obterOcorrencia(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<OcorrenciaAmbiental> {
    return montarOcorrencia(
      await this.ocorrencia(ctx, dados?.id),
      hojeEmBrasilia(),
    );
  }

  async criarOcorrencia(
    ctx: Contexto,
    dados: unknown,
  ): Promise<OcorrenciaAmbiental> {
    const n = validar(novaOcorrenciaSchema, dados);
    if (n.data > hojeEmBrasilia())
      throw invalido('data', 'A data não pode estar no futuro.');
    const ano = n.data.slice(0, 4);
    const l = await this.db.transaction(async (tx) => {
      const [{ ultimo }] = (await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `OCA-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo })) as [{ ultimo: number }];
      const [nova] = await tx
        .insert(ocorrencias)
        .values({
          ...n,
          numero: `OCA-${ano}-${String(ultimo).padStart(3, '0')}`,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return nova!;
    });
    return montarOcorrencia(l, hojeEmBrasilia());
  }

  async comunicarOcorrencia(
    ctx: Contexto,
    dados: ComId,
  ): Promise<OcorrenciaAmbiental> {
    const { versao, ...c } = validar(
      comunicarOcorrenciaSchema,
      dados?.alteracoes,
    );
    const atual = await this.ocorrencia(ctx, dados?.id);
    if (c.data < atual.data)
      throw invalido(
        'data',
        'A comunicação não pode ser anterior à ocorrência.',
      );
    if (c.data > hojeEmBrasilia())
      throw invalido('data', 'A data não pode estar no futuro.');
    return this.gravarOcorrencia(ctx, atual.id, versao, { comunicacao: c });
  }

  /** Abre a NC na Qualidade (origem Ocorrência ambiental) com o relato e a contenção. */
  async ncDaOcorrencia(
    ctx: Contexto,
    dados: ComId,
  ): Promise<OcorrenciaAmbiental> {
    const { versao, responsavel } = validar(
      ncDaOcorrenciaSchema,
      dados?.alteracoes,
    );
    const atual = await this.ocorrencia(ctx, dados?.id);
    if (atual.ncId)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        `Esta ocorrência já tem a NC ${atual.ncNumero}.`,
      );
    const nc = await pedir<NaoConformidade>(
      this.qualidade,
      PATTERNS.naoConformidades.criar,
      {
        titulo:
          `${TIPOS_DE_OCORRENCIA[atual.tipo as keyof typeof TIPOS_DE_OCORRENCIA]}: ${atual.substancia}`.slice(
            0,
            150,
          ),
        descricao: `${atual.descricao}\n\nContenção: ${atual.contencao}\n\nOcorrência ${atual.numero} em ${atual.local}.`,
        origem: 'ambiental',
        origemRef: atual.numero,
        tipo: 'processo',
        gravidade: atual.severidade,
        setor: atual.local.slice(0, 100),
        responsavel,
        prazo: somarDias(hojeEmBrasilia(), DIAS_DA_NC),
      },
      ctx,
      'Qualidade',
    );
    return this.gravarOcorrencia(ctx, atual.id, versao, {
      ncId: nc.id,
      ncNumero: nc.numero,
    });
  }

  /** Encerrar exige causas e ações e, quando obrigatória, a comunicação ao órgão registrada. */
  async encerrarOcorrencia(
    ctx: Contexto,
    dados: ComId,
  ): Promise<OcorrenciaAmbiental> {
    const { versao, ...e } = validar(
      encerrarOcorrenciaSchema,
      dados?.alteracoes,
    );
    const atual = await this.ocorrencia(ctx, dados?.id);
    if (atual.status === 'encerrada')
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'A ocorrência já está encerrada.',
      );
    const o = montarOcorrencia(atual, hojeEmBrasilia());
    if (o.comunicacaoObrigatoria && !o.comunicacao)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Registre a comunicação ao órgão ambiental antes de encerrar.',
      );
    return this.gravarOcorrencia(ctx, atual.id, versao, {
      ...e,
      status: 'encerrada',
    });
  }

  // ---------------------------------------------------------------- obrigações

  async listarObrigacoes(ctx: Contexto): Promise<ObrigacaoLegal[]> {
    const linhas = await this.db
      .select()
      .from(obrigacoes)
      .where(eq(obrigacoes.empresaId, ctx.empresaId))
      .orderBy(asc(obrigacoes.proximoVencimento), asc(obrigacoes.nome));
    const hoje = hojeEmBrasilia();
    return linhas.map((l) => montarObrigacao(l, hoje));
  }

  async criarObrigacao(ctx: Contexto, dados: unknown): Promise<ObrigacaoLegal> {
    const n = validar(novaObrigacaoSchema, dados);
    const [l] = await this.db
      .insert(obrigacoes)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montarObrigacao(l!, hojeEmBrasilia());
  }

  async atualizarObrigacao(
    ctx: Contexto,
    dados: ComId,
  ): Promise<ObrigacaoLegal> {
    const { versao, ...n } = validar(
      atualizarObrigacaoSchema,
      dados?.alteracoes,
    );
    return this.gravarObrigacao(ctx, dados?.id, versao, n);
  }

  /** Entrega registrada com o comprovante; a próxima vence pela periodicidade a partir do vencimento atendido. */
  async cumprirObrigacao(ctx: Contexto, dados: ComId): Promise<ObrigacaoLegal> {
    const c = validar(cumprirObrigacaoSchema, dados?.alteracoes);
    if (c.data > hojeEmBrasilia())
      throw invalido('data', 'A entrega não pode estar no futuro.');
    const atual = await this.obrigacao(ctx, dados?.id);
    if (!atual.proximoVencimento)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Esta obrigação única já foi cumprida.',
      );
    const registro = {
      vencimento: atual.proximoVencimento,
      data: c.data,
      comprovante: c.comprovante,
      observacao: c.observacao,
      noPrazo: c.data <= atual.proximoVencimento,
    };
    return this.gravarObrigacao(ctx, atual.id, c.versao, {
      proximoVencimento: proximoVencimento(
        atual.proximoVencimento,
        atual.periodicidade as Periodicidade,
      ),
      historico: [
        registro,
        ...(atual.historico as ObrigacaoLegal['historico']),
      ].slice(0, 100),
    });
  }

  async excluirObrigacao(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<{ ok: true }> {
    const atual = await this.obrigacao(ctx, dados?.id);
    if ((atual.historico as unknown[]).length)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Obrigação com entregas registradas não se exclui: o histórico é evidência.',
      );
    await this.db.delete(obrigacoes).where(eq(obrigacoes.id, atual.id));
    return { ok: true };
  }

  // ---------------------------------------------------------------- destinadores e inventário

  async listarDestinadores(ctx: Contexto): Promise<Destinador[]> {
    const linhas = await this.db
      .select()
      .from(destinadores)
      .where(eq(destinadores.empresaId, ctx.empresaId))
      .orderBy(asc(destinadores.nome));
    const hoje = hojeEmBrasilia();
    return linhas.map((l) => montarDestinador(l, hoje));
  }

  async criarDestinador(ctx: Contexto, dados: unknown): Promise<Destinador> {
    const n = validar(novoDestinadorSchema, dados);
    const [l] = await this.db
      .insert(destinadores)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montarDestinador(l!, hojeEmBrasilia());
  }

  async atualizarDestinador(ctx: Contexto, dados: ComId): Promise<Destinador> {
    const { versao, ...n } = validar(
      atualizarDestinadorSchema,
      dados?.alteracoes,
    );
    const [l] = isUuid(dados?.id)
      ? await this.db
          .update(destinadores)
          .set({ ...n, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(destinadores.id, dados.id),
              eq(destinadores.empresaId, ctx.empresaId),
              eq(destinadores.atualizadoEm, new Date(versao)),
            ),
          )
          .returning()
      : [];
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarDestinador(l, hojeEmBrasilia());
  }

  /** Por resíduo: saídas, quantidade, custo e CDFs pendentes do ano. */
  async inventario(
    ctx: Contexto,
    dados: unknown,
  ): Promise<InventarioDeResiduos> {
    const ano = anoDe(dados);
    const linhas = await this.db
      .select({
        residuoId: residuos.id,
        nome: residuos.nome,
        classe: residuos.classe,
        unidade: residuos.unidade,
        destinacao: residuos.destinacao,
        saidas: sql<number>`count(${saidas.id})::int`,
        quantidade: sql<number>`coalesce(sum(${saidas.quantidade}), 0)::float`,
        custo: sql<number>`coalesce(sum(${saidas.custo}), 0)::float`,
        semCdf: sql<number>`count(${saidas.id}) filter (where ${saidas.cdfNumero} is null)::int`,
      })
      .from(saidas)
      .innerJoin(residuos, eq(residuos.id, saidas.residuoId))
      .where(
        and(
          eq(saidas.empresaId, ctx.empresaId),
          gte(saidas.data, `${ano}-01-01`),
          lt(saidas.data, `${ano + 1}-01-01`),
        ),
      )
      .groupBy(
        residuos.id,
        residuos.nome,
        residuos.classe,
        residuos.unidade,
        residuos.destinacao,
      )
      .orderBy(asc(residuos.classe), asc(residuos.nome));
    return {
      ano,
      linhas,
      custoTotal:
        Math.round(linhas.reduce((t, l) => t + l.custo, 0) * 100) / 100,
    };
  }

  // ---------------------------------------------------------------- produção e ecoeficiência

  async listarProducao(
    ctx: Contexto,
    dados: unknown,
  ): Promise<ProducaoDoMes[]> {
    const ano = anoDe(dados);
    const linhas = await this.db
      .select()
      .from(producao)
      .where(
        and(
          eq(producao.empresaId, ctx.empresaId),
          like(producao.competencia, `${ano}-%`),
        ),
      )
      .orderBy(asc(producao.competencia));
    return linhas.map((l) => ({
      competencia: l.competencia,
      quantidade: l.quantidade,
      unidade: l.unidade,
    }));
  }

  /** Um registro por mês; registrar de novo substitui. */
  async registrarProducao(
    ctx: Contexto,
    dados: unknown,
  ): Promise<ProducaoDoMes[]> {
    const n = validar(registrarProducaoSchema, dados);
    if (n.competencia > hojeEmBrasilia().slice(0, 7))
      throw invalido('competencia', 'O mês não pode estar no futuro.');
    await this.db
      .insert(producao)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .onConflictDoUpdate({
        target: [producao.empresaId, producao.competencia],
        set: {
          quantidade: n.quantidade,
          unidade: n.unidade,
          atualizadoPor: ctx.usuarioId,
          atualizadoEm: new Date(),
        },
      });
    return this.listarProducao(ctx, { ano: Number(n.competencia.slice(0, 4)) });
  }

  /** Água, energia, resíduos (kg) e emissões (kg CO₂e) de cada mês, e o total do ano por unidade produzida. */
  async ecoeficiencia(ctx: Contexto, dados: unknown): Promise<Ecoeficiencia> {
    const ano = anoDe(dados);
    const [prod, cons, fats, sais] = await Promise.all([
      this.listarProducao(ctx, { ano }),
      this.db
        .select()
        .from(consumos)
        .where(
          and(
            eq(consumos.empresaId, ctx.empresaId),
            like(consumos.competencia, `${ano}-%`),
          ),
        ),
      this.db
        .select()
        .from(fatores)
        .where(and(eq(fatores.empresaId, ctx.empresaId), eq(fatores.ano, ano))),
      this.db
        .select({
          data: saidas.data,
          quantidade: saidas.quantidade,
          unidade: residuos.unidade,
        })
        .from(saidas)
        .innerJoin(residuos, eq(residuos.id, saidas.residuoId))
        .where(
          and(
            eq(saidas.empresaId, ctx.empresaId),
            gte(saidas.data, `${ano}-01-01`),
            lt(saidas.data, `${ano + 1}-01-01`),
          ),
        ),
    ]);
    const fator = new Map(fats.map((f) => [f.fonte, f.fator]));
    const meses: EcoeficienciaDoMes[] = Array.from({ length: 12 }, (_, i) => {
      const c = `${ano}-${String(i + 1).padStart(2, '0')}`;
      const doMes = cons.filter((x) => x.competencia === c);
      const soma = (fonte: string) => {
        const l = doMes.find((x) => x.fonte === fonte);
        return l ? l.quantidade : null;
      };
      const emissoes = doMes.filter(
        (x) => x.fonte !== 'agua' && fator.has(x.fonte),
      );
      const massa = sais
        .filter((s) => s.data.startsWith(c))
        .map((s) => emKg(s.quantidade, s.unidade))
        .filter((x): x is number => x !== null);
      return {
        competencia: c,
        producao: prod.find((p) => p.competencia === c)?.quantidade ?? null,
        agua: soma('agua'),
        energia: soma('energia'),
        residuos: massa.length ? massa.reduce((t, x) => t + x, 0) : null,
        gee: emissoes.length
          ? Math.round(
              emissoes.reduce(
                (t, x) => t + x.quantidade * fator.get(x.fonte)!,
                0,
              ) * 100,
            ) / 100
          : null,
      };
    });
    const total = (k: 'producao' | 'agua' | 'energia' | 'residuos' | 'gee') => {
      const v = meses.map((m) => m[k]).filter((x): x is number => x !== null);
      return v.length ? v.reduce((t, x) => t + x, 0) : null;
    };
    const p = total('producao');
    return {
      ano,
      unidadeDeProducao: prod.at(-1)?.unidade ?? null,
      meses,
      porUnidade: {
        agua: porUnidade(total('agua'), p),
        energia: porUnidade(total('energia'), p),
        residuos: porUnidade(total('residuos'), p),
        gee: porUnidade(total('gee'), p),
      },
    };
  }

  // ---------------------------------------------------------------- programas

  async listarProgramas(ctx: Contexto): Promise<ProgramaAmbiental[]> {
    const linhas = await this.db
      .select()
      .from(programas)
      .where(eq(programas.empresaId, ctx.empresaId))
      .orderBy(asc(programas.encerrado), asc(programas.prazo));
    const eco = await this.ecoeficiencia(ctx, {
      ano: Number(hojeEmBrasilia().slice(0, 4)),
    });
    return linhas.map((l) => montarPrograma(l, eco));
  }

  async obterPrograma(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<ProgramaAmbiental> {
    const l = await this.programa(ctx, dados?.id);
    return montarPrograma(
      l,
      await this.ecoeficiencia(ctx, {
        ano: Number(hojeEmBrasilia().slice(0, 4)),
      }),
    );
  }

  async criarPrograma(
    ctx: Contexto,
    dados: unknown,
  ): Promise<ProgramaAmbiental> {
    const n = validar(novoProgramaSchema, dados);
    const [l] = await this.db
      .insert(programas)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return this.obterPrograma(ctx, { id: l!.id });
  }

  async atualizarPrograma(
    ctx: Contexto,
    dados: ComId,
  ): Promise<ProgramaAmbiental> {
    const { versao, ...n } = validar(
      atualizarProgramaSchema,
      dados?.alteracoes,
    );
    await this.gravarPrograma(ctx, dados?.id, versao, n);
    return this.obterPrograma(ctx, { id: dados?.id });
  }

  /** Medição mensal do indicador próprio; o mesmo mês substitui. */
  async medirPrograma(ctx: Contexto, dados: ComId): Promise<ProgramaAmbiental> {
    const { versao, competencia, valor } = validar(
      medirProgramaSchema,
      dados?.alteracoes,
    );
    const atual = await this.programa(ctx, dados?.id);
    if (atual.indicador !== 'manual')
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Este programa é medido pelos dados do sistema (consumo, resíduos, produção).',
      );
    const medicoes = [
      ...(atual.medicoes as ProgramaAmbiental['medicoes']).filter(
        (m) => m.competencia !== competencia,
      ),
      { competencia, valor },
    ].sort((a, b) => a.competencia.localeCompare(b.competencia));
    await this.gravarPrograma(ctx, atual.id, versao, { medicoes });
    return this.obterPrograma(ctx, { id: atual.id });
  }

  // ---------------------------------------------------------------- apoio

  private async ocorrencia(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(ocorrencias)
          .where(
            and(
              eq(ocorrencias.id, id),
              eq(ocorrencias.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Ocorrência não encontrada.');
    return l;
  }

  private async gravarOcorrencia(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof ocorrencias.$inferInsert>,
  ) {
    const [l] = await this.db
      .update(ocorrencias)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(
          eq(ocorrencias.id, id),
          eq(ocorrencias.atualizadoEm, new Date(versao)),
        ),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarOcorrencia(l, hojeEmBrasilia());
  }

  private async obrigacao(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(obrigacoes)
          .where(
            and(eq(obrigacoes.id, id), eq(obrigacoes.empresaId, ctx.empresaId)),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Obrigação não encontrada.');
    return l;
  }

  private async gravarObrigacao(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof obrigacoes.$inferInsert>,
  ) {
    const [l] = isUuid(id)
      ? await this.db
          .update(obrigacoes)
          .set({ ...valores, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(obrigacoes.id, id),
              eq(obrigacoes.empresaId, ctx.empresaId),
              eq(obrigacoes.atualizadoEm, new Date(versao)),
            ),
          )
          .returning()
      : [];
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarObrigacao(l, hojeEmBrasilia());
  }

  private async programa(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(programas)
          .where(
            and(eq(programas.id, id), eq(programas.empresaId, ctx.empresaId)),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Programa não encontrado.');
    return l;
  }

  private async gravarPrograma(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof programas.$inferInsert>,
  ) {
    const [l] = isUuid(id)
      ? await this.db
          .update(programas)
          .set({ ...valores, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(programas.id, id),
              eq(programas.empresaId, ctx.empresaId),
              eq(programas.atualizadoEm, new Date(versao)),
            ),
          )
          .returning()
      : [];
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return l;
  }
}

function anoDe(dados: unknown): number {
  const ano = Number(
    (dados as { ano?: unknown })?.ano ?? hojeEmBrasilia().slice(0, 4),
  );
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100)
    throw invalido('ano', 'Ano inválido.');
  return ano;
}

function montarOcorrencia(
  l: typeof ocorrencias.$inferSelect,
  hoje: string,
): OcorrenciaAmbiental {
  const meios = l.meios as MeioAfetado[];
  const severidade = l.severidade as SeveridadeAmbiental;
  const obrigatoria = comunicacaoObrigatoria({ severidade, meios });
  const prazo = obrigatoria ? somarDias(l.data, 1) : null;
  const comunicacao =
    (l.comunicacao as OcorrenciaAmbiental['comunicacao']) ?? null;
  return {
    id: l.id,
    numero: l.numero,
    tipo: l.tipo as OcorrenciaAmbiental['tipo'],
    data: l.data,
    hora: l.hora,
    local: l.local,
    substancia: l.substancia,
    quantidade: l.quantidade,
    unidade: l.unidade,
    meios,
    severidade,
    descricao: l.descricao,
    contencao: l.contencao,
    comunicacaoObrigatoria: obrigatoria,
    prazoComunicacao: prazo,
    comunicacao,
    comunicacaoAtrasada: Boolean(
      prazo && (comunicacao ? comunicacao.data > prazo : prazo < hoje),
    ),
    ncId: l.ncId,
    ncNumero: l.ncNumero,
    status: l.status as OcorrenciaAmbiental['status'],
    causas: l.causas,
    acoes: l.acoes,
    remediacao: l.remediacao,
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarObrigacao(
  l: typeof obrigacoes.$inferSelect,
  hoje: string,
): ObrigacaoLegal {
  return {
    id: l.id,
    nome: l.nome,
    orgao: l.orgao,
    periodicidade: l.periodicidade as Periodicidade,
    proximoVencimento: l.proximoVencimento,
    responsavel: l.responsavel,
    descricao: l.descricao,
    situacao: situacaoDaObrigacao(l.proximoVencimento, hoje),
    historico: l.historico as ObrigacaoLegal['historico'],
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarDestinador(
  l: typeof destinadores.$inferSelect,
  hoje: string,
): Destinador {
  return {
    id: l.id,
    nome: l.nome,
    cnpj: l.cnpj,
    tipo: l.tipo as Destinador['tipo'],
    licencaNumero: l.licencaNumero,
    licencaOrgao: l.licencaOrgao,
    licencaValidade: l.licencaValidade,
    licencaVencida: l.licencaValidade < hoje,
    licencaVenceEmBreve:
      l.licencaValidade >= hoje && l.licencaValidade <= somarDias(hoje, 60),
    atividades: l.atividades,
    versao: l.atualizadoEm.toISOString(),
  };
}

const UNIDADE: Record<IndicadorDoPrograma, string> = {
  agua_por_unidade: 'm³/unid.',
  energia_por_unidade: 'kWh/unid.',
  residuos_por_unidade: 'kg/unid.',
  gee_por_unidade: 'kg CO₂e/unid.',
  agua: 'm³',
  energia: 'kWh',
  residuos: 'kg',
  gee: 'kg CO₂e',
  manual: '',
};

/** O valor atual vem do ano corrente (ecoeficiência) ou da última medição (indicador próprio). */
function montarPrograma(
  l: typeof programas.$inferSelect,
  eco: Ecoeficiencia,
): ProgramaAmbiental {
  const indicador = l.indicador as IndicadorDoPrograma;
  const medicoes = l.medicoes as ProgramaAmbiental['medicoes'];
  const total = (k: 'agua' | 'energia' | 'residuos' | 'gee') => {
    const v = eco.meses.map((m) => m[k]).filter((x): x is number => x !== null);
    return v.length
      ? Math.round(v.reduce((t, x) => t + x, 0) * 100) / 100
      : null;
  };
  const atual =
    indicador === 'manual'
      ? (medicoes.at(-1)?.valor ?? null)
      : indicador.endsWith('_por_unidade')
        ? eco.porUnidade[
            indicador.replace('_por_unidade', '') as
              'agua' | 'energia' | 'residuos' | 'gee'
          ]
        : total(indicador as 'agua' | 'energia' | 'residuos' | 'gee');
  return {
    id: l.id,
    nome: l.nome,
    objetivo: l.objetivo,
    indicador,
    unidade:
      indicador === 'manual'
        ? (l.unidadeManual ?? '')
        : UNIDADE[indicador] || INDICADORES_DO_PROGRAMA[indicador],
    linhaDeBase: l.linhaDeBase,
    anoBase: l.anoBase,
    meta: l.meta,
    prazo: l.prazo,
    responsavel: l.responsavel,
    acoes: l.acoes as ProgramaAmbiental['acoes'],
    medicoes,
    atual,
    progresso: progressoDaMeta(l.linhaDeBase, l.meta, atual),
    encerrado: l.encerrado,
    versao: l.atualizadoEm.toISOString(),
  };
}

const invalido = (campo: string, mensagem: string) =>
  new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique os campos destacados.', [
    { campo, mensagem },
  ]);
