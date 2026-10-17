import { Inject, Injectable } from '@nestjs/common';
import { and, eq, type SQL } from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  ordemAlfabetica,
  violacaoUnica,
} from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  atualizarItemDeListaSchema,
  ehListaCadastro,
  filtroCadastroSimplesSchema,
  isUuid,
  novoItemDeListaSchema,
  situacaoDoCadastroSchema,
  type Contexto,
  type ItemDeLista,
  type ListaCadastro,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { listasCadastro } from '../db/schema.js';

type Db = Database<typeof schema>;
type ComLista = { lista?: unknown };
type ComId = ComLista & { id?: unknown; alteracoes?: unknown };

const ALTERADO_POR_OUTRA_PESSOA =
  'Este cadastro foi alterado por outra pessoa. Recarregue a página para ver a versão atual.';

/** Listas auxiliares da empresa (processo/área, tipo de causa…): cadastros simples que se inativam, não se apagam. */
@Injectable()
export class ListasService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  /** A lista vem na rota; recusa qualquer valor fora do conjunto conhecido. */
  private qualLista(dados: ComLista): ListaCadastro {
    const l = String(dados?.lista ?? '');
    if (!ehListaCadastro(l))
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Lista desconhecida.');
    return l;
  }

  async listar(ctx: Contexto, dados: unknown): Promise<ItemDeLista[]> {
    const lista = this.qualLista(dados as ComLista);
    const { situacao } = validar(filtroCadastroSimplesSchema, dados ?? {});
    const condicoes: SQL[] = [
      eq(listasCadastro.empresaId, ctx.empresaId),
      eq(listasCadastro.lista, lista),
    ];
    if (situacao !== 'todos')
      condicoes.push(eq(listasCadastro.ativo, situacao === 'ativos'));
    const linhas = await this.db
      .select()
      .from(listasCadastro)
      .where(and(...condicoes))
      .orderBy(ordemAlfabetica(listasCadastro.nome));
    return linhas.map(this.paraItem);
  }

  async criar(ctx: Contexto, dados: unknown): Promise<ItemDeLista> {
    const lista = this.qualLista(dados as ComLista);
    const { nome } = validar(novoItemDeListaSchema, dados);
    const [l] = await this.db
      .insert(listasCadastro)
      .values({
        lista,
        nome,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning()
      .catch(this.nomeRepetido);
    return this.paraItem(l!);
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<ItemDeLista> {
    this.qualLista(dados);
    const { nome, versao } = validar(
      atualizarItemDeListaSchema,
      dados?.alteracoes,
    );
    await this.gravar(ctx, dados?.id, versao, { nome });
    return this.porId(ctx, dados?.id);
  }

  async mudarSituacao(ctx: Contexto, dados: ComId): Promise<ItemDeLista> {
    this.qualLista(dados);
    const { ativo, versao } = validar(
      situacaoDoCadastroSchema,
      dados?.alteracoes,
    );
    await this.gravar(ctx, dados?.id, versao, { ativo });
    return this.porId(ctx, dados?.id);
  }

  private async gravar(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof listasCadastro.$inferInsert>,
  ) {
    const lida = new Date(versao);
    const [l] =
      isUuid(id) && !Number.isNaN(lida.getTime())
        ? await this.db
            .update(listasCadastro)
            .set({ ...valores, atualizadoPor: ctx.usuarioId })
            .where(
              and(
                eq(listasCadastro.id, id),
                eq(listasCadastro.empresaId, ctx.empresaId),
                eq(listasCadastro.atualizadoEm, lida),
              ),
            )
            .returning()
            .catch(this.nomeRepetido)
        : [];
    if (!l) {
      await this.porId(ctx, id);
      throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    }
  }

  private async porId(ctx: Contexto, id: unknown): Promise<ItemDeLista> {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(listasCadastro)
          .where(
            and(
              eq(listasCadastro.id, id),
              eq(listasCadastro.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Item de lista não encontrado.',
      );
    return this.paraItem(l);
  }

  private paraItem = (l: typeof listasCadastro.$inferSelect): ItemDeLista => ({
    id: l.id,
    nome: l.nome,
    ativo: l.ativo,
    versao: l.atualizadoEm.toISOString(),
  });

  private nomeRepetido = (erro: unknown): never => {
    if (violacaoUnica(erro) === 'listas_cadastro_nome_por_empresa') {
      const mensagem = 'Já existe um item com este nome nesta lista.';
      throw new ErroDeNegocio('CONFLITO', mensagem, [
        { campo: 'nome', mensagem },
      ]);
    }
    throw erro;
  };
}
