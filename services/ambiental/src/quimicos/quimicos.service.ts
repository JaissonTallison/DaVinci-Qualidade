import { Inject, Injectable } from '@nestjs/common';
import { and, eq, type SQL } from 'drizzle-orm';
import { DATABASE, type Database, ordemAlfabetica } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarMeses,
  validar,
} from '@davinci/shared';
import {
  atualizarProdutoSchema,
  filtroProdutosSchema,
  isUuid,
  MESES_REVISAO_FDS,
  novoProdutoSchema,
  situacaoDoProdutoSchema,
  type Contexto,
  type PerigoGhs,
  type ProdutoQuimico,
  type UnidadeProduto,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { produtos } from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const CONFLITO =
  'Este registro foi alterado por outra pessoa ou não existe. Recarregue a página.';

/** Produtos químicos e a revisão da FDS. */
@Injectable()
export class QuimicosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<ProdutoQuimico[]> {
    const f = validar(filtroProdutosSchema, dados ?? {});
    const c: SQL[] = [eq(produtos.empresaId, ctx.empresaId)];
    if (f.situacao !== 'todos')
      c.push(eq(produtos.ativo, f.situacao === 'ativos'));
    const hoje = hojeEmBrasilia();
    return (
      await this.db
        .select()
        .from(produtos)
        .where(and(...c))
        .orderBy(ordemAlfabetica(produtos.nome))
    )
      .map((l) => montar(l, hoje))
      .filter((p) => !f.fds || p.fdsVencida);
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<ProdutoQuimico> {
    return montar(await this.produto(ctx, dados?.id), hojeEmBrasilia());
  }

  async criar(ctx: Contexto, dados: unknown): Promise<ProdutoQuimico> {
    const n = validar(novoProdutoSchema, dados);
    if (n.fdsRevisao > hojeEmBrasilia())
      throw invalido(
        'fdsRevisao',
        'A revisão da FDS não pode estar no futuro.',
      );
    const [l] = await this.db
      .insert(produtos)
      .values({ ...n, ...autoria(ctx) })
      .returning();
    return montar(l!, hojeEmBrasilia());
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<ProdutoQuimico> {
    const { versao, ...campos } = validar(
      atualizarProdutoSchema,
      dados?.alteracoes,
    );
    if (campos.fdsRevisao > hojeEmBrasilia())
      throw invalido(
        'fdsRevisao',
        'A revisão da FDS não pode estar no futuro.',
      );
    const p = await this.produto(ctx, dados?.id);
    return this.gravar(ctx, p.id, versao, campos);
  }

  async situacao(ctx: Contexto, dados: ComId): Promise<ProdutoQuimico> {
    const { versao, ativo } = validar(
      situacaoDoProdutoSchema,
      dados?.alteracoes,
    );
    const p = await this.produto(ctx, dados?.id);
    return this.gravar(ctx, p.id, versao, { ativo });
  }

  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof produtos.$inferInsert>,
  ) {
    const [l] = await this.db
      .update(produtos)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(
        and(eq(produtos.id, id), eq(produtos.atualizadoEm, new Date(versao))),
      )
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montar(l, hojeEmBrasilia());
  }

  private async produto(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(produtos)
          .where(
            and(eq(produtos.id, id), eq(produtos.empresaId, ctx.empresaId)),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Produto não encontrado.');
    return l;
  }
}

const autoria = (ctx: Contexto) => ({
  empresaId: ctx.empresaId,
  criadoPor: ctx.usuarioId,
  atualizadoPor: ctx.usuarioId,
});
const invalido = (campo: string, mensagem: string) =>
  new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique os campos destacados.', [
    { campo, mensagem },
  ]);

function montar(l: typeof produtos.$inferSelect, hoje: string): ProdutoQuimico {
  const proxima = somarMeses(l.fdsRevisao, MESES_REVISAO_FDS);
  return {
    id: l.id,
    nome: l.nome,
    fabricante: l.fabricante,
    cas: l.cas,
    perigos: l.perigos as PerigoGhs[],
    local: l.local,
    quantidadeMaxima: l.quantidadeMaxima,
    unidade: l.unidade as UnidadeProduto,
    fdsRevisao: l.fdsRevisao,
    proximaRevisaoFds: proxima,
    fdsVencida: l.ativo && proxima < hoje,
    ativo: l.ativo,
    versao: l.atualizadoEm.toISOString(),
  };
}
