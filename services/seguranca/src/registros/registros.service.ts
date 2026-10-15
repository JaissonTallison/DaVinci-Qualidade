import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, isNull, sql, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarMeses,
  validar,
} from '@davinci/shared';
import {
  anularRegistroSstSchema,
  filtroRegistrosSstSchema,
  isUuid,
  novoRegistroSstSchema,
  type Contexto,
  type Pagina,
  type RegistroSst,
  type ResumoRegistrosSst,
  type TipoRegistroSst,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { registrosSst as reg } from '../db/schema.js';

type Db = Database<typeof schema>;
type Linha = typeof reg.$inferSelect;

@Injectable()
export class RegistrosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<Pagina<RegistroSst>> {
    const f = validar(filtroRegistrosSstSchema, dados ?? {});
    const condicoes: SQL[] = [eq(reg.empresaId, ctx.empresaId)];
    if (f.tipo) condicoes.push(eq(reg.tipo, f.tipo));
    const onde = and(...condicoes);
    const [linhas, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(reg)
        .where(onde)
        .orderBy(desc(reg.data), desc(reg.criadoEm))
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db.select({ total: count() }).from(reg).where(onde),
    ]);
    return {
      itens: linhas.map(montar),
      total: total!,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<RegistroSst> {
    const id = dados?.id;
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(reg)
          .where(and(eq(reg.id, id), eq(reg.empresaId, ctx.empresaId)))
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Registro não encontrado.');
    return montar(l);
  }

  async criar(ctx: Contexto, dados: unknown): Promise<RegistroSst> {
    const novo = validar(novoRegistroSstSchema, dados);
    if (novo.data > hojeEmBrasilia())
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [
          {
            campo: 'data',
            mensagem:
              'Registre depois de acontecer: a data não pode estar no futuro.',
          },
        ],
      );
    const [l] = await this.db
      .insert(reg)
      .values({
        ...novo,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montar(l!);
  }

  async anular(
    ctx: Contexto,
    dados: { id?: unknown; alteracoes?: unknown },
  ): Promise<RegistroSst> {
    const { motivo } = validar(anularRegistroSstSchema, dados?.alteracoes);
    const [l] = isUuid(dados?.id)
      ? await this.db
          .update(reg)
          .set({ motivoAnulacao: motivo, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(reg.id, dados.id),
              eq(reg.empresaId, ctx.empresaId),
              isNull(reg.motivoAnulacao),
            ),
          )
          .returning()
      : [];
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Registro não encontrado ou já anulado.',
      );
    return montar(l);
  }

  /** CIPA em dia: reunião no mês atual ou no anterior. Simulado em dia: nos últimos 12 meses. */
  async resumo(ctx: Contexto): Promise<ResumoRegistrosSst> {
    const hoje = hojeEmBrasilia();
    const validos = and(
      eq(reg.empresaId, ctx.empresaId),
      isNull(reg.motivoAnulacao),
    );
    const ultima = (tipo: TipoRegistroSst) =>
      this.db
        .select({ data: sql<string | null>`max(${reg.data})` })
        .from(reg)
        .where(and(validos, eq(reg.tipo, tipo)));
    const [[dds], [cipa], [simulado]] = await Promise.all([
      this.db
        .select({ total: count() })
        .from(reg)
        .where(
          and(
            validos,
            eq(reg.tipo, 'dds'),
            gte(reg.data, `${hoje.slice(0, 7)}-01`),
          ),
        ),
      ultima('reuniao_cipa'),
      ultima('simulado'),
    ]);
    const mesAnterior = somarMeses(`${hoje.slice(0, 7)}-01`, -1);
    return {
      ddsNoMes: dds!.total,
      ultimaReuniaoCipa: cipa?.data ?? null,
      cipaEmDia: Boolean(cipa?.data && cipa.data >= mesAnterior),
      ultimoSimulado: simulado?.data ?? null,
      simuladoEmDia: Boolean(
        simulado?.data && simulado.data > somarMeses(hoje, -12),
      ),
    };
  }
}

function montar(l: Linha): RegistroSst {
  return {
    id: l.id,
    tipo: l.tipo as TipoRegistroSst,
    data: l.data,
    tema: l.tema,
    local: l.local,
    responsavel: l.responsavel,
    participantes: l.participantes,
    conteudo: l.conteudo,
    motivoAnulacao: l.motivoAnulacao,
  };
}
