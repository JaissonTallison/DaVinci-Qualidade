import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, type SQL } from 'drizzle-orm';
import { DATABASE, type Database, ordemAlfabetica } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarMeses,
  validar,
} from '@davinci/shared';
import {
  atualizarRequisitoSstSchema,
  avaliarRequisitoSstSchema,
  filtroRequisitosSstSchema,
  isUuid,
  MESES_ENTRE_AVALIACOES_SST,
  novoRequisitoSstSchema,
  type Atendimento,
  type Contexto,
  type Esfera,
  type RequisitoLegalSst,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { requisitosLegaisSst as reqs } from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const CONFLITO =
  'Este requisito foi alterado por outra pessoa ou não existe. Recarregue a página.';

/** Requisitos legais de SST e a avaliação de atendimento (ISO 45001 6.1.3 / 9.1.2). */
@Injectable()
export class RequisitosLegaisSstService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<RequisitoLegalSst[]> {
    const f = validar(filtroRequisitosSstSchema, dados ?? {});
    const c: SQL[] = [eq(reqs.empresaId, ctx.empresaId)];
    if (f.atendimento) c.push(eq(reqs.atendimento, f.atendimento));
    const hoje = hojeEmBrasilia();
    return (
      await this.db
        .select()
        .from(reqs)
        .where(and(...c))
        .orderBy(asc(reqs.esfera), ordemAlfabetica(reqs.norma))
    ).map((l) => montar(l, hoje));
  }

  async obter(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<RequisitoLegalSst> {
    return montar(await this.buscar(ctx, dados?.id), hojeEmBrasilia());
  }

  async criar(ctx: Contexto, dados: unknown): Promise<RequisitoLegalSst> {
    const n = validar(novoRequisitoSstSchema, dados);
    const [l] = await this.db
      .insert(reqs)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montar(l!, hojeEmBrasilia());
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<RequisitoLegalSst> {
    const { versao, ...campos } = validar(
      atualizarRequisitoSstSchema,
      dados?.alteracoes,
    );
    const r = await this.buscar(ctx, dados?.id);
    return this.gravar(ctx, r.id, versao, campos);
  }

  async avaliar(ctx: Contexto, dados: ComId): Promise<RequisitoLegalSst> {
    const { versao, data, atendimento, evidencia, acao } = validar(
      avaliarRequisitoSstSchema,
      dados?.alteracoes,
    );
    if (data > hojeEmBrasilia())
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [{ campo: 'data', mensagem: 'A avaliação não pode estar no futuro.' }],
      );
    const r = await this.buscar(ctx, dados?.id);
    return this.gravar(ctx, r.id, versao, {
      atendimento,
      ultimaAvaliacao: data,
      evidencia,
      acao: atendimento === 'atende' ? null : acao,
    });
  }

  private async buscar(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(reqs)
          .where(and(eq(reqs.id, id), eq(reqs.empresaId, ctx.empresaId)))
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Requisito não encontrado.');
    return l;
  }

  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof reqs.$inferInsert>,
  ): Promise<RequisitoLegalSst> {
    const [l] = await this.db
      .update(reqs)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(and(eq(reqs.id, id), eq(reqs.atualizadoEm, new Date(versao))))
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montar(l, hojeEmBrasilia());
  }
}

function montar(
  l: typeof reqs.$inferSelect,
  hoje: string,
): RequisitoLegalSst {
  const proxima = l.ultimaAvaliacao
    ? somarMeses(l.ultimaAvaliacao, MESES_ENTRE_AVALIACOES_SST)
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
