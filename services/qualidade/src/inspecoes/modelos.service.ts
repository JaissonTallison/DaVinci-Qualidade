import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, type SQL } from 'drizzle-orm';
import { DATABASE, type Database, violacaoUnica } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  atualizarModeloSchema,
  filtroModelosSchema,
  isUuid,
  novoModeloSchema,
  situacaoDoModeloSchema,
  type Contexto,
  type ModeloDeInspecao,
  type TipoInspecao,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { modelosInspecao } from '../db/schema.js';

type Db = Database<typeof schema>;
type Linha = typeof modelosInspecao.$inferSelect;
type ComId = { id?: unknown; alteracoes?: unknown };

const ALTERADO_POR_OUTRA_PESSOA =
  'Este modelo foi alterado por outra pessoa. Recarregue a página para ver a versão atual.';
const NOME_REPETIDO = 'Já existe um modelo com este nome.';

/** Modelos de inspeção: listas de itens reaproveitáveis. Mudar o modelo não muda inspeções já criadas. */
@Injectable()
export class ModelosDeInspecaoService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<ModeloDeInspecao[]> {
    const f = validar(filtroModelosSchema, dados ?? {});
    const condicoes: SQL[] = [eq(modelosInspecao.empresaId, ctx.empresaId)];
    if (f.situacao !== 'todos')
      condicoes.push(eq(modelosInspecao.ativo, f.situacao === 'ativos'));
    if (f.tipo) condicoes.push(eq(modelosInspecao.tipo, f.tipo));
    const linhas = await this.db
      .select()
      .from(modelosInspecao)
      .where(and(...condicoes))
      .orderBy(asc(modelosInspecao.nome));
    return linhas.map(montar);
  }

  async obter(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<ModeloDeInspecao> {
    return montar(await this.buscar(ctx, dados?.id));
  }

  async criar(ctx: Contexto, dados: unknown): Promise<ModeloDeInspecao> {
    const novo = validar(novoModeloSchema, dados);
    try {
      const [linha] = await this.db
        .insert(modelosInspecao)
        .values({
          ...novo,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montar(linha!);
    } catch (erro) {
      throw nomeRepetido(erro) ?? erro;
    }
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<ModeloDeInspecao> {
    const { versao, ...campos } = validar(
      atualizarModeloSchema,
      dados?.alteracoes,
    );
    try {
      return montar(await this.gravar(ctx, dados?.id, versao, campos));
    } catch (erro) {
      throw nomeRepetido(erro) ?? erro;
    }
  }

  async inativar(ctx: Contexto, dados: ComId): Promise<ModeloDeInspecao> {
    const { versao } = validar(situacaoDoModeloSchema, dados?.alteracoes);
    return montar(await this.gravar(ctx, dados?.id, versao, { ativo: false }));
  }

  async reativar(ctx: Contexto, dados: ComId): Promise<ModeloDeInspecao> {
    const { versao } = validar(situacaoDoModeloSchema, dados?.alteracoes);
    return montar(await this.gravar(ctx, dados?.id, versao, { ativo: true }));
  }

  private async buscar(ctx: Contexto, id: unknown): Promise<Linha> {
    const [linha] = isUuid(id)
      ? await this.db
          .select()
          .from(modelosInspecao)
          .where(
            and(
              eq(modelosInspecao.id, id),
              eq(modelosInspecao.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!linha)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Modelo de inspeção não encontrado.',
      );
    return linha;
  }

  private async gravar(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof modelosInspecao.$inferInsert>,
  ): Promise<Linha> {
    const atual = await this.buscar(ctx, id);
    const lida = new Date(versao);
    const [linha] = Number.isNaN(lida.getTime())
      ? []
      : await this.db
          .update(modelosInspecao)
          .set({ ...valores, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(modelosInspecao.id, atual.id),
              eq(modelosInspecao.atualizadoEm, lida),
            ),
          )
          .returning();
    if (!linha) throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    return linha;
  }
}

function nomeRepetido(erro: unknown): ErroDeNegocio | null {
  return violacaoUnica(erro) === 'modelos_inspecao_nome_por_empresa'
    ? new ErroDeNegocio('CONFLITO', NOME_REPETIDO, [
        { campo: 'nome', mensagem: NOME_REPETIDO },
      ])
    : null;
}

function montar(l: Linha): ModeloDeInspecao {
  return {
    id: l.id,
    nome: l.nome,
    tipo: l.tipo as TipoInspecao,
    itens: l.itens,
    ativo: l.ativo,
    versao: l.atualizadoEm.toISOString(),
  };
}
