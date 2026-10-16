import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DATABASE, type Database, violacaoUnica } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  atualizarServicoDoCatalogoSchema,
  isUuid,
  novoServicoDoCatalogoSchema,
  situacaoDoServicoSchema,
  type Contexto,
  type ServicoDoCatalogo,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { catalogoServicos as cat } from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const REPETIDO = 'Já existe um serviço com este nome no catálogo.';

/** Catálogo de serviços: o padrão (checklist, horas) que a OS copia ao ser aberta. */
@Injectable()
export class CatalogoService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto): Promise<ServicoDoCatalogo[]> {
    const linhas = await this.db
      .select()
      .from(cat)
      .where(eq(cat.empresaId, ctx.empresaId))
      .orderBy(asc(cat.nome));
    return linhas.map(montar);
  }

  async criar(ctx: Contexto, dados: unknown): Promise<ServicoDoCatalogo> {
    const n = validar(novoServicoDoCatalogoSchema, dados);
    try {
      const [l] = await this.db
        .insert(cat)
        .values({
          ...n,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montar(l!);
    } catch (e) {
      if (violacaoUnica(e)) throw invalido('nome', REPETIDO);
      throw e;
    }
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<ServicoDoCatalogo> {
    const { versao, ...n } = validar(
      atualizarServicoDoCatalogoSchema,
      dados?.alteracoes,
    );
    return this.gravar(ctx, dados?.id, versao, n);
  }

  async mudarSituacao(ctx: Contexto, dados: ComId): Promise<ServicoDoCatalogo> {
    const { versao, ativo } = validar(
      situacaoDoServicoSchema,
      dados?.alteracoes,
    );
    return this.gravar(ctx, dados?.id, versao, { ativo });
  }

  private async gravar(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof cat.$inferInsert>,
  ): Promise<ServicoDoCatalogo> {
    if (!isUuid(id))
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Serviço não encontrado.');
    try {
      const [l] = await this.db
        .update(cat)
        .set({ ...valores, atualizadoPor: ctx.usuarioId })
        .where(
          and(
            eq(cat.id, id),
            eq(cat.empresaId, ctx.empresaId),
            eq(cat.atualizadoEm, new Date(versao)),
          ),
        )
        .returning();
      if (!l)
        throw new ErroDeNegocio(
          'CONFLITO',
          'Este serviço foi alterado por outra pessoa. Recarregue a página.',
        );
      return montar(l);
    } catch (e) {
      if (violacaoUnica(e)) throw invalido('nome', REPETIDO);
      throw e;
    }
  }
}

function montar(l: typeof cat.$inferSelect): ServicoDoCatalogo {
  return {
    id: l.id,
    nome: l.nome,
    descricao: l.descricao,
    horasPadrao: l.horasPadrao,
    checklist: l.checklist as string[],
    ativo: l.ativo,
    versao: l.atualizadoEm.toISOString(),
  };
}

const invalido = (campo: string, mensagem: string) =>
  new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique os campos destacados.', [
    { campo, mensagem },
  ]);
