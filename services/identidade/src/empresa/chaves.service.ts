import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  isUuid,
  novaChaveSchema,
  recursosEfetivos,
  type ChaveCriada,
  type ChaveDeApi,
  type Contexto,
  type Recurso,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { chavesApi, empresas } from '../db/schema.js';

const hash = (chave: string) =>
  createHash('sha256').update(chave).digest('hex');

/** Chaves de API da empresa (I4, A137). */
@Injectable()
export class ChavesService {
  constructor(@Inject(DATABASE) private readonly db: Database<typeof schema>) {}

  async listar(ctx: Contexto): Promise<ChaveDeApi[]> {
    const ls = await this.db
      .select()
      .from(chavesApi)
      .where(eq(chavesApi.empresaId, ctx.empresaId))
      .orderBy(desc(chavesApi.criadaEm));
    return ls.map((l) => ({
      id: l.id,
      nome: l.nome,
      prefixo: l.prefixo,
      criadaPor: l.criadaPorNome,
      criadaEm: l.criadaEm.toISOString(),
      ultimoUso: l.ultimoUso?.toISOString() ?? null,
      revogada: l.revogada,
    }));
  }

  async criar(ctx: Contexto, dados: unknown): Promise<ChaveCriada> {
    const d = validar(novaChaveSchema, dados);
    const chave = `dvf_${randomBytes(24).toString('base64url')}`;
    const [l] = await this.db
      .insert(chavesApi)
      .values({
        empresaId: ctx.empresaId,
        nome: d.nome,
        prefixo: chave.slice(0, 12),
        hash: hash(chave),
        criadaPor: ctx.usuarioId,
        criadaPorNome: (dados as { usuarioNome?: string }).usuarioNome ?? null,
      })
      .returning();
    return {
      id: l!.id,
      nome: l!.nome,
      prefixo: l!.prefixo,
      criadaPor: l!.criadaPorNome,
      criadaEm: l!.criadaEm.toISOString(),
      ultimoUso: null,
      revogada: false,
      chave,
    };
  }

  async revogar(ctx: Contexto, dados: unknown) {
    const id = (dados as { id?: unknown } | null)?.id;
    if (!isUuid(id))
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Chave não encontrada.');
    await this.db
      .update(chavesApi)
      .set({ revogada: true })
      .where(and(eq(chavesApi.id, id), eq(chavesApi.empresaId, ctx.empresaId)));
    return { ok: true };
  }

  /** Gateway: a chave vale? Devolve a empresa e os recursos dela (null = recusada). Marca o último uso (no máximo 1 vez por minuto). */
  async validar(dados: unknown): Promise<{
    empresaId: string;
    recursos: Recurso[];
    chaveId: string;
  } | null> {
    const chave = (dados as { chave?: unknown } | null)?.chave;
    if (
      typeof chave !== 'string' ||
      !chave.startsWith('dvf_') ||
      chave.length > 100
    )
      return null;
    const [l] = await this.db
      .select({ c: chavesApi, recursos: empresas.recursos })
      .from(chavesApi)
      .innerJoin(empresas, eq(empresas.id, chavesApi.empresaId))
      .where(eq(chavesApi.hash, hash(chave)));
    if (!l || l.c.revogada) return null;
    if (!l.c.ultimoUso || Date.now() - l.c.ultimoUso.getTime() > 60_000)
      await this.db
        .update(chavesApi)
        .set({ ultimoUso: new Date() })
        .where(eq(chavesApi.id, l.c.id));
    return {
      empresaId: l.c.empresaId,
      recursos: recursosEfetivos(l.recursos),
      chaveId: l.c.id,
    };
  }
}
