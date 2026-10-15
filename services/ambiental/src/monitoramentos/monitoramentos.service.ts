import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { DATABASE, type Database, ordemAlfabetica } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarMeses,
  validar,
} from '@davinci/shared';
import {
  atualizarMonitoramentoSchema,
  isUuid,
  novoMonitoramentoSchema,
  registrarResultadoSchema,
  resultadoConforme,
  situacaoDoMonitoramentoSchema,
  type Contexto,
  type Monitoramento,
  type ResultadoDeMonitoramento,
  type TipoMonitoramento,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { monitoramentos, resultados } from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const CONFLITO =
  'Este registro foi alterado por outra pessoa ou não existe. Recarregue a página.';

/** Plano de monitoramento (efluentes, emissões, ruído...) e os resultados de cada coleta. */
@Injectable()
export class MonitoramentosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(
    ctx: Contexto,
    dados?: { situacao?: unknown },
  ): Promise<Monitoramento[]> {
    const c: SQL[] = [eq(monitoramentos.empresaId, ctx.empresaId)];
    if (dados?.situacao !== 'todos')
      c.push(eq(monitoramentos.ativo, dados?.situacao !== 'inativos'));
    const ms = await this.db
      .select()
      .from(monitoramentos)
      .where(and(...c))
      .orderBy(ordemAlfabetica(monitoramentos.ponto));
    const rs = ms.length
      ? await this.db
          .select()
          .from(resultados)
          .where(
            inArray(
              resultados.monitoramentoId,
              ms.map((m) => m.id),
            ),
          )
          .orderBy(desc(resultados.data), desc(resultados.criadoEm))
      : [];
    const hoje = hojeEmBrasilia();
    return ms.map((m) =>
      montar(
        m,
        rs.filter((r) => r.monitoramentoId === m.id),
        hoje,
        false,
      ),
    );
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Monitoramento> {
    const m = await this.monitoramento(ctx, dados?.id);
    const rs = await this.db
      .select()
      .from(resultados)
      .where(eq(resultados.monitoramentoId, m.id))
      .orderBy(desc(resultados.data), desc(resultados.criadoEm));
    return montar(m, rs, hojeEmBrasilia(), true);
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Monitoramento> {
    const n = validar(novoMonitoramentoSchema, dados);
    const [l] = await this.db
      .insert(monitoramentos)
      .values({ ...n, ...autoria(ctx) })
      .returning();
    return montar(l!, [], hojeEmBrasilia(), true);
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<Monitoramento> {
    const { versao, ...campos } = validar(
      atualizarMonitoramentoSchema,
      dados?.alteracoes,
    );
    const m = await this.monitoramento(ctx, dados?.id);
    return this.gravar(ctx, m.id, versao, campos);
  }

  async situacao(ctx: Contexto, dados: ComId): Promise<Monitoramento> {
    const { versao, ativo } = validar(
      situacaoDoMonitoramentoSchema,
      dados?.alteracoes,
    );
    const m = await this.monitoramento(ctx, dados?.id);
    return this.gravar(ctx, m.id, versao, { ativo });
  }

  async registrarResultado(
    ctx: Contexto,
    dados: ComId,
  ): Promise<Monitoramento> {
    const n = validar(registrarResultadoSchema, dados?.alteracoes);
    if (n.data > hojeEmBrasilia())
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [{ campo: 'data', mensagem: 'A coleta não pode estar no futuro.' }],
      );
    const m = await this.monitoramento(ctx, dados?.id);
    if (!m.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Monitoramento inativo: reative antes de registrar resultados.',
      );
    await this.db
      .insert(resultados)
      .values({ ...n, monitoramentoId: m.id, ...autoria(ctx) });
    return this.obter(ctx, { id: m.id });
  }

  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof monitoramentos.$inferInsert>,
  ) {
    const [l] = await this.db
      .update(monitoramentos)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(
          eq(monitoramentos.id, id),
          eq(monitoramentos.atualizadoEm, new Date(versao)),
        ),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return this.obter(ctx, { id: l.id });
  }

  private async monitoramento(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(monitoramentos)
          .where(
            and(
              eq(monitoramentos.id, id),
              eq(monitoramentos.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Monitoramento não encontrado.',
      );
    return l;
  }
}

const autoria = (ctx: Contexto) => ({
  empresaId: ctx.empresaId,
  criadoPor: ctx.usuarioId,
  atualizadoPor: ctx.usuarioId,
});

function montar(
  m: typeof monitoramentos.$inferSelect,
  rs: (typeof resultados.$inferSelect)[],
  hoje: string,
  comResultados: boolean,
): Monitoramento {
  const lista = rs.map((r): ResultadoDeMonitoramento => ({
    id: r.id,
    data: r.data,
    valor: r.valor,
    laudo: r.laudo,
    conforme: resultadoConforme(r.valor, m.limiteMinimo, m.limiteMaximo),
  }));
  const ultimo = lista[0] ?? null;
  const proximaColeta = ultimo
    ? somarMeses(ultimo.data, m.periodicidadeMeses)
    : hoje;
  return {
    id: m.id,
    tipo: m.tipo as TipoMonitoramento,
    ponto: m.ponto,
    parametro: m.parametro,
    unidade: m.unidade,
    limiteMinimo: m.limiteMinimo,
    limiteMaximo: m.limiteMaximo,
    referencia: m.referencia,
    periodicidadeMeses: m.periodicidadeMeses,
    ultimo,
    proximaColeta,
    coletaVencida: m.ativo && proximaColeta < hoje,
    ativo: m.ativo,
    versao: m.atualizadoEm.toISOString(),
    ...(comResultados ? { resultados: lista } : {}),
  };
}
