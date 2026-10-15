import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, hojeEmBrasilia, validar } from '@davinci/shared';
import {
  definirFatorSchema,
  ESCOPO_DA_FONTE,
  filtroConsumoSchema,
  FONTES_DE_CONSUMO,
  registrarConsumoSchema,
  UNIDADE_DA_FONTE,
  type ConsumoDoMes,
  type Contexto,
  type FonteDeConsumo,
  type InventarioGee,
  type LinhaDoInventario,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { consumos, fatores } from '../db/schema.js';

type Db = Database<typeof schema>;

/** Consumo mensal de água, energia e combustíveis, e o inventário de GEE calculado a partir dele. */
@Injectable()
export class ConsumoService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<ConsumoDoMes[]> {
    const { ano } = validar(filtroConsumoSchema, dados);
    const ls = await this.db
      .select()
      .from(consumos)
      .where(
        and(
          eq(consumos.empresaId, ctx.empresaId),
          gte(consumos.competencia, `${ano}-01`),
          lt(consumos.competencia, `${ano + 1}-01`),
        ),
      )
      .orderBy(asc(consumos.competencia));
    return ls.map((l) => ({
      fonte: l.fonte as FonteDeConsumo,
      competencia: l.competencia,
      quantidade: l.quantidade,
      custo: l.custo,
    }));
  }

  /** Registrar o mesmo mês de novo substitui o valor (correção de leitura). */
  async registrar(ctx: Contexto, dados: unknown): Promise<ConsumoDoMes[]> {
    const n = validar(registrarConsumoSchema, dados);
    if (n.competencia > hojeEmBrasilia().slice(0, 7))
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [{ campo: 'competencia', mensagem: 'O mês ainda não chegou.' }],
      );
    await this.db
      .insert(consumos)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .onConflictDoUpdate({
        target: [consumos.empresaId, consumos.fonte, consumos.competencia],
        set: {
          quantidade: n.quantidade,
          custo: n.custo,
          atualizadoPor: ctx.usuarioId,
          atualizadoEm: new Date(),
        },
      });
    return this.listar(ctx, { ano: Number(n.competencia.slice(0, 4)) });
  }

  async definirFator(ctx: Contexto, dados: unknown): Promise<InventarioGee> {
    const n = validar(definirFatorSchema, dados);
    await this.db
      .insert(fatores)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .onConflictDoUpdate({
        target: [fatores.empresaId, fatores.fonte, fatores.ano],
        set: {
          fator: n.fator,
          referencia: n.referencia,
          atualizadoPor: ctx.usuarioId,
          atualizadoEm: new Date(),
        },
      });
    return this.inventario(ctx, { ano: n.ano });
  }

  /** Emissão (t CO₂e) = consumo do ano × fator (kg CO₂e por unidade) ÷ 1000, por fonte; somada por escopo. */
  async inventario(ctx: Contexto, dados: unknown): Promise<InventarioGee> {
    const { ano } = validar(filtroConsumoSchema, dados);
    const [cs, fs] = await Promise.all([
      this.listar(ctx, { ano }),
      this.db
        .select()
        .from(fatores)
        .where(and(eq(fatores.empresaId, ctx.empresaId), eq(fatores.ano, ano))),
    ]);
    const linhas: LinhaDoInventario[] = [];
    for (const fonte of Object.keys(FONTES_DE_CONSUMO) as FonteDeConsumo[]) {
      const escopo = ESCOPO_DA_FONTE[fonte];
      if (!escopo) continue;
      const consumo = cs
        .filter((c) => c.fonte === fonte)
        .reduce((t, c) => t + c.quantidade, 0);
      const f = fs.find((x) => x.fonte === fonte);
      if (!consumo && !f) continue;
      linhas.push({
        fonte,
        escopo,
        consumo,
        unidade: UNIDADE_DA_FONTE[fonte],
        fator: f?.fator ?? null,
        referencia: f?.referencia ?? null,
        emissao: f ? arredondar((consumo * f.fator) / 1000) : null,
      });
    }
    const soma = (e: 1 | 2) =>
      arredondar(
        linhas
          .filter((l) => l.escopo === e)
          .reduce((t, l) => t + (l.emissao ?? 0), 0),
      );
    const escopo1 = soma(1);
    const escopo2 = soma(2);
    return {
      ano,
      linhas,
      escopo1,
      escopo2,
      total: arredondar(escopo1 + escopo2),
      semFator: linhas
        .filter((l) => l.consumo > 0 && l.fator === null)
        .map((l) => l.fonte),
    };
  }
}

const arredondar = (n: number) => Math.round(n * 1000) / 1000;
