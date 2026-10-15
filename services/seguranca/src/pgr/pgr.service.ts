import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { DATABASE, type Database, ordemAlfabetica } from '@davinci/database';
import { ErroDeNegocio, hojeEmBrasilia, validar } from '@davinci/shared';
import {
  atualizarRiscoSchema,
  filtroRiscosSchema,
  isUuid,
  nivelDoRisco,
  novoRiscoSchema,
  situacaoDoRiscoSchema,
  type Contexto,
  type GrupoDeRisco,
  type ResumoPgr,
  type Risco,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { riscos } from '../db/schema.js';

type Db = Database<typeof schema>;
type Linha = typeof riscos.$inferSelect;
type ComId = { id?: unknown; alteracoes?: unknown };
const ORDEM_DO_NIVEL = { critico: 0, alto: 1, moderado: 2, baixo: 3 } as const;

@Injectable()
export class PgrService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  /** Mais graves primeiro; o nível é calculado, então o filtro por nível é feito aqui. */
  async listar(ctx: Contexto, dados: unknown): Promise<Risco[]> {
    const f = validar(filtroRiscosSchema, dados ?? {});
    const condicoes: SQL[] = [eq(riscos.empresaId, ctx.empresaId)];
    if (f.situacao !== 'todos')
      condicoes.push(eq(riscos.ativo, f.situacao === 'ativos'));
    if (f.grupo) condicoes.push(eq(riscos.grupo, f.grupo));
    if (f.busca)
      condicoes.push(
        or(
          ilike(riscos.local, `%${f.busca}%`),
          ilike(riscos.perigo, `%${f.busca}%`),
        )!,
      );
    const hoje = hojeEmBrasilia();
    const lista = (
      await this.db
        .select()
        .from(riscos)
        .where(and(...condicoes))
        .orderBy(ordemAlfabetica(riscos.local), asc(riscos.criadoEm))
    ).map((l) => montar(l, hoje));
    return lista
      .filter((r) => !f.nivel || r.nivel === f.nivel)
      .sort((a, b) => ORDEM_DO_NIVEL[a.nivel] - ORDEM_DO_NIVEL[b.nivel]);
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Risco> {
    const id = dados?.id;
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(riscos)
          .where(and(eq(riscos.id, id), eq(riscos.empresaId, ctx.empresaId)))
      : [];
    if (!l) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Risco não encontrado.');
    return montar(l, hojeEmBrasilia());
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Risco> {
    const novo = validar(novoRiscoSchema, dados);
    const [l] = await this.db
      .insert(riscos)
      .values({
        ...novo,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montar(l!, hojeEmBrasilia());
  }

  /** Reavaliar (depois de uma medida implantada, por exemplo) é atualizar severidade e probabilidade. */
  async atualizar(ctx: Contexto, dados: ComId): Promise<Risco> {
    const { versao, ...campos } = validar(
      atualizarRiscoSchema,
      dados?.alteracoes,
    );
    return this.gravar(ctx, dados?.id, versao, campos);
  }

  async mudarSituacao(ctx: Contexto, dados: ComId): Promise<Risco> {
    const { versao, ativo } = validar(situacaoDoRiscoSchema, dados?.alteracoes);
    return this.gravar(ctx, dados?.id, versao, { ativo });
  }

  async resumo(ctx: Contexto): Promise<ResumoPgr> {
    const lista = await this.listar(ctx, {});
    return {
      criticos: lista.filter((r) => r.nivel === 'critico').length,
      altos: lista.filter((r) => r.nivel === 'alto').length,
      acoesVencidas: lista.filter((r) => r.acaoVencida).length,
    };
  }

  private async gravar(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof riscos.$inferInsert>,
  ): Promise<Risco> {
    const lida = new Date(versao);
    const [l] =
      isUuid(id) && !Number.isNaN(lida.getTime())
        ? await this.db
            .update(riscos)
            .set({ ...valores, atualizadoPor: ctx.usuarioId })
            .where(
              and(
                eq(riscos.id, id),
                eq(riscos.empresaId, ctx.empresaId),
                eq(riscos.atualizadoEm, lida),
              ),
            )
            .returning()
        : [];
    if (!l)
      throw new ErroDeNegocio(
        'CONFLITO',
        'Este risco foi alterado por outra pessoa ou não existe. Recarregue a página.',
      );
    return montar(l, hojeEmBrasilia());
  }
}

function montar(l: Linha, hoje: string): Risco {
  const nivel = nivelDoRisco(l.severidade, l.probabilidade);
  return {
    id: l.id,
    grupo: l.grupo as GrupoDeRisco,
    local: l.local,
    perigo: l.perigo,
    danos: l.danos,
    severidade: l.severidade,
    probabilidade: l.probabilidade,
    nivel,
    controles: l.controles,
    acoes: l.acoes,
    responsavel: l.responsavel,
    prazo: l.prazo,
    acaoVencida:
      l.ativo &&
      (nivel === 'alto' || nivel === 'critico') &&
      Boolean(l.prazo && l.prazo < hoje),
    ativo: l.ativo,
    revisadoEm: l.atualizadoEm.toISOString(),
    versao: l.atualizadoEm.toISOString(),
  };
}
