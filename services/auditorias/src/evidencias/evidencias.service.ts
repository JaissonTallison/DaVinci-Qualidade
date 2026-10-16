import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  filtroEvidenciasSchema,
  isUuid,
  noPack,
  NORMAS,
  PACKS_ANTI_NC,
  type PackAntiNc,
  novaEvidenciaPropriaSchema,
  type Contexto,
  type EvidenciaDaBiblioteca,
  type Norma,
  type RiscoDaEvidencia,
  type TipoDeEvidencia,
} from '@davinci/types';
import { BIBLIOTECA_DE_EVIDENCIAS } from '../conteudo/evidencias/index.js';
import * as schema from '../db/schema.js';
import { evidenciasProprias } from '../db/schema.js';

type Db = Database<typeof schema>;
const ORDEM_NORMA = Object.keys(NORMAS);

/** "4.10" depois de "4.9"; o Anexo A (A.5.1…) depois do capítulo 10. */
export function compararClausulas(a: string, b: string): number {
  const partes = (c: string) =>
    c.startsWith('A.')
      ? [100, ...c.slice(2).split('.').map(Number)]
      : c.split('.').map(Number);
  const x = partes(a);
  const y = partes(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? -1) - (y[i] ?? -1);
    if (d) return d;
  }
  return 0;
}

/** A cláusula pedida casa com a exata, com as filhas (8.4 → 8.4.1) e com o capítulo (8 → 8.x); "A" = Anexo A. */
export function casaClausula(clausula: string, filtro: string): boolean {
  if (filtro === 'A') return clausula.startsWith('A.');
  return clausula === filtro || clausula.startsWith(`${filtro}.`);
}

/** Biblioteca de evidências: banco do sistema + evidências próprias da empresa. */
@Injectable()
export class EvidenciasService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(
    ctx: Contexto,
    dados: unknown,
  ): Promise<EvidenciaDaBiblioteca[]> {
    const f = validar(filtroEvidenciasSchema, dados ?? {});
    const proprias = (
      await this.db
        .select()
        .from(evidenciasProprias)
        .where(eq(evidenciasProprias.empresaId, ctx.empresaId))
    ).map(propria);
    const termo = f.busca ? normalizar(f.busca) : null;
    return [...BIBLIOTECA_DE_EVIDENCIAS, ...proprias]
      .filter(
        (e) =>
          (!f.pack ||
            !(f.pack in PACKS_ANTI_NC) ||
            noPack(f.pack as PackAntiNc, e.norma, e.clausula)) &&
          (!f.norma || e.norma === f.norma) &&
          (!f.clausula || casaClausula(e.clausula, f.clausula)) &&
          (!f.tema || e.tema === f.tema) &&
          (!f.controle || e.controle === f.controle) &&
          (!termo ||
            normalizar(
              `${e.titulo} ${e.oQuePedir} ${e.exemplo} ${e.clausula}`,
            ).includes(termo)),
      )
      .sort(
        (a, b) =>
          ORDEM_NORMA.indexOf(a.norma) - ORDEM_NORMA.indexOf(b.norma) ||
          compararClausulas(a.clausula, b.clausula),
      );
  }

  async criarPropria(
    ctx: Contexto,
    dados: unknown,
  ): Promise<EvidenciaDaBiblioteca> {
    const n = validar(novaEvidenciaPropriaSchema, dados);
    const [l] = await this.db
      .insert(evidenciasProprias)
      .values({
        ...n,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return propria(l!);
  }

  async excluirPropria(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<{ ok: true }> {
    const id = dados?.id;
    const [l] = isUuid(id)
      ? await this.db
          .delete(evidenciasProprias)
          .where(
            and(
              eq(evidenciasProprias.id, id),
              eq(evidenciasProprias.empresaId, ctx.empresaId),
            ),
          )
          .returning()
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Evidência não encontrada.');
    return { ok: true };
  }
}

const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function propria(
  l: typeof evidenciasProprias.$inferSelect,
): EvidenciaDaBiblioteca {
  return {
    codigo: l.id,
    origem: 'propria',
    norma: l.norma as Norma,
    clausula: l.clausula,
    titulo: l.titulo,
    tipo: l.tipo as TipoDeEvidencia,
    risco: l.risco as RiscoDaEvidencia,
    oQuePedir: l.oQuePedir,
    exemplo: l.exemplo,
  };
}
