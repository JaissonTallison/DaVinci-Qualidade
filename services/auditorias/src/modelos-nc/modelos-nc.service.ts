import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  filtroModelosNcSchema,
  filtroPromptsSchema,
  isUuid,
  NORMAS,
  noPack,
  novoModeloNcSchema,
  PACKS_ANTI_NC,
  type Contexto,
  type ModeloDeNc,
  type Norma,
  type PackAntiNc,
  type PromptDeIa,
  type TipoDeDesvio,
} from '@davinci/types';
import { BANCO_DE_MODELOS_NC } from '../conteudo/modelos-nc.js';
import { BANCO_DE_PROMPTS } from '../conteudo/prompts.js';
import * as schema from '../db/schema.js';
import { modelosNcProprios } from '../db/schema.js';
import {
  casaClausula,
  compararClausulas,
} from '../evidencias/evidencias.service.js';

type Db = Database<typeof schema>;
const ORDEM_NORMA = Object.keys(NORMAS);
const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Banco de modelos de NC (do sistema e próprios) e a biblioteca de prompts de IA. */
@Injectable()
export class ModelosNcService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<ModeloDeNc[]> {
    const f = validar(filtroModelosNcSchema, dados ?? {});
    const proprios = (
      await this.db
        .select()
        .from(modelosNcProprios)
        .where(eq(modelosNcProprios.empresaId, ctx.empresaId))
    ).map(proprio);
    const termo = f.busca ? normalizar(f.busca) : null;
    return [...BANCO_DE_MODELOS_NC, ...proprios]
      .filter(
        (m) =>
          (!f.pack ||
            !(f.pack in PACKS_ANTI_NC) ||
            noPack(f.pack as PackAntiNc, m.norma, m.clausula)) &&
          (!f.norma || m.norma === f.norma) &&
          (!f.clausula || casaClausula(m.clausula, f.clausula)) &&
          (!f.tipo || m.tipo === f.tipo) &&
          (!f.controle || m.controle === f.controle) &&
          (!termo ||
            normalizar(
              `${m.titulo} ${m.descricao} ${m.causaRaiz} ${m.acaoCorretiva} ${m.clausula}`,
            ).includes(termo)),
      )
      .sort(
        (a, b) =>
          ORDEM_NORMA.indexOf(a.norma) - ORDEM_NORMA.indexOf(b.norma) ||
          compararClausulas(a.clausula, b.clausula),
      );
  }

  async criarProprio(ctx: Contexto, dados: unknown): Promise<ModeloDeNc> {
    const n = validar(novoModeloNcSchema, dados);
    const [l] = await this.db
      .insert(modelosNcProprios)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return proprio(l!);
  }

  async excluirProprio(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<{ ok: true }> {
    const id = dados?.id;
    const [l] = isUuid(id)
      ? await this.db
          .delete(modelosNcProprios)
          .where(
            and(
              eq(modelosNcProprios.id, id),
              eq(modelosNcProprios.empresaId, ctx.empresaId),
            ),
          )
          .returning()
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Modelo de NC não encontrado.');
    return { ok: true };
  }

  listarPrompts(dados: unknown): PromptDeIa[] {
    const f = validar(filtroPromptsSchema, dados ?? {});
    const termo = f.busca ? normalizar(f.busca) : null;
    return BANCO_DE_PROMPTS.filter(
      (p) =>
        (!f.norma || p.norma === f.norma) &&
        (!f.categoria || p.categoria === f.categoria) &&
        (!f.processo || p.processo === f.processo) &&
        (!termo ||
          normalizar(
            `${p.titulo} ${p.objetivo} ${p.prompt} ${p.categoria}`,
          ).includes(termo)),
    );
  }
}

function proprio(l: typeof modelosNcProprios.$inferSelect): ModeloDeNc {
  return {
    codigo: l.id,
    origem: 'propria',
    norma: l.norma as Norma,
    clausula: l.clausula,
    tipo: l.tipo as TipoDeDesvio,
    titulo: l.titulo,
    descricao: l.descricao,
    causaRaiz: l.causaRaiz,
    acaoCorretiva: l.acaoCorretiva,
    evidenciaFechamento: l.evidenciaFechamento,
  };
}
