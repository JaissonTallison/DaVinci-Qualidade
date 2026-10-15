import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  TODAS_AS_PERMISSOES,
  atualizarPerfilSchema,
  ehPermissao,
  exige2faSchema,
  isUuid,
  novoPerfilSchema,
  situacaoDoPerfilSchema,
  type Contexto,
  type Perfil,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { perfis, vinculos } from '../db/schema.js';

const NAO_ENCONTRADO = 'Perfil não encontrado.';
const ALTERADO_POR_OUTRA_PESSOA =
  'Este perfil foi alterado por outra pessoa. Recarregue para ver a versão atual.';
const PROTEGIDO =
  'O perfil Administrador tem sempre todas as permissões e não pode ser alterado nem inativado.';

type Db = Database<typeof schema>;

/** O `id` vem junto dos dados da mensagem (o gateway o tira da URL). */
const idDe = (dados: unknown): unknown =>
  (dados as { id?: unknown } | null)?.id;

/** Perfis de acesso da empresa: conjuntos de permissões (docs/05-modulos/identidade.md §4). */
@Injectable()
export class PerfisService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  listar(ctx: Contexto): Promise<Perfil[]> {
    return this.consultar(ctx);
  }

  async obter(ctx: Contexto, dados: unknown): Promise<Perfil> {
    return this.buscar(ctx, idDe(dados));
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Perfil> {
    const { nome, descricao, permissoes } = validar(novoPerfilSchema, dados);
    await this.recusarNomeRepetido(ctx, nome);
    const [p] = await this.db
      .insert(perfis)
      .values({
        empresaId: ctx.empresaId,
        nome,
        descricao,
        permissoes,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning({ id: perfis.id });
    return this.buscar(ctx, p!.id);
  }

  async atualizar(ctx: Contexto, dados: unknown): Promise<Perfil> {
    const { nome, descricao, permissoes, versao } = validar(
      atualizarPerfilSchema,
      dados,
    );
    const atual = await this.buscar(ctx, idDe(dados));
    if (atual.protegido) throw new ErroDeNegocio('REGRA_DE_NEGOCIO', PROTEGIDO);
    if (!atual.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Reative o perfil para alterá-lo.',
      );
    await this.recusarNomeRepetido(ctx, nome, atual.id);
    // As permissões novas valem na próxima renovação da sessão de cada usuário (até 15 min)
    return this.gravar(ctx, atual.id, versao, { nome, descricao, permissoes });
  }

  async inativar(ctx: Contexto, dados: unknown): Promise<Perfil> {
    const { versao } = validar(situacaoDoPerfilSchema, dados);
    const atual = await this.buscar(ctx, idDe(dados));
    if (atual.protegido) throw new ErroDeNegocio('REGRA_DE_NEGOCIO', PROTEGIDO);
    if (!atual.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Este perfil já está inativo.',
      );
    if (atual.usuarios > 0) {
      const quem =
        atual.usuarios === 1
          ? '1 pessoa usa'
          : `${atual.usuarios} pessoas usam`;
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        `${quem} este perfil. Mude o perfil delas antes de inativá-lo.`,
      );
    }
    return this.gravar(ctx, atual.id, versao, { ativo: false });
  }

  /** Exigir 2FA de quem usa o perfil: vale também para o Administrador (protegido só nas permissões). */
  async exige2fa(ctx: Contexto, dados: unknown): Promise<Perfil> {
    const { exige, versao } = validar(exige2faSchema, dados);
    const atual = await this.buscar(ctx, idDe(dados));
    return this.gravar(ctx, atual.id, versao, { exige2fa: exige });
  }

  async reativar(ctx: Contexto, dados: unknown): Promise<Perfil> {
    const { versao } = validar(situacaoDoPerfilSchema, dados);
    const atual = await this.buscar(ctx, idDe(dados));
    if (atual.ativo)
      throw new ErroDeNegocio('REGRA_DE_NEGOCIO', 'Este perfil já está ativo.');
    return this.gravar(ctx, atual.id, versao, { ativo: true });
  }

  // ---------------------------------------------------------------------------

  private async consultar(ctx: Contexto, id?: string): Promise<Perfil[]> {
    const emUso = this.db
      .select({ perfilId: vinculos.perfilId, total: count().as('total') })
      .from(vinculos)
      .where(
        and(eq(vinculos.empresaId, ctx.empresaId), eq(vinculos.ativo, true)),
      )
      .groupBy(vinculos.perfilId)
      .as('em_uso');
    const linhas = await this.db
      .select({ p: perfis, usuarios: emUso.total })
      .from(perfis)
      .leftJoin(emUso, eq(emUso.perfilId, perfis.id))
      .where(
        and(
          eq(perfis.empresaId, ctx.empresaId),
          id ? eq(perfis.id, id) : undefined,
        ),
      )
      // Administrador primeiro; os demais em ordem alfabética
      .orderBy(sql`${perfis.protegido} desc`, asc(sql`lower(${perfis.nome})`));
    return linhas.map(({ p, usuarios }) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      permissoes: p.protegido
        ? [...TODAS_AS_PERMISSOES]
        : p.permissoes.filter(ehPermissao),
      protegido: p.protegido,
      ativo: p.ativo,
      exige2fa: p.exige2fa,
      usuarios: Number(usuarios ?? 0),
      versao: p.atualizadoEm.toISOString(),
    }));
  }

  private async buscar(ctx: Contexto, id: unknown): Promise<Perfil> {
    const [p] = isUuid(id) ? await this.consultar(ctx, id) : [];
    if (!p) throw new ErroDeNegocio('NAO_ENCONTRADO', NAO_ENCONTRADO);
    return p;
  }

  private async recusarNomeRepetido(
    ctx: Contexto,
    nome: string,
    exceto?: string,
  ) {
    const [igual] = await this.db
      .select({ id: perfis.id })
      .from(perfis)
      .where(
        and(
          eq(perfis.empresaId, ctx.empresaId),
          sql`lower(${perfis.nome}) = lower(${nome})`,
        ),
      );
    if (igual && igual.id !== exceto) {
      throw new ErroDeNegocio(
        'CONFLITO',
        'Já existe um perfil com este nome.',
        [{ campo: 'nome', mensagem: `"${nome}" já existe nesta empresa.` }],
      );
    }
  }

  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof perfis.$inferInsert>,
  ): Promise<Perfil> {
    const lida = new Date(versao);
    const [linha] = Number.isNaN(lida.getTime())
      ? []
      : await this.db
          .update(perfis)
          .set({ ...valores, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(perfis.id, id),
              eq(perfis.empresaId, ctx.empresaId),
              eq(perfis.atualizadoEm, lida),
            ),
          )
          .returning({ id: perfis.id });
    if (!linha) throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    return this.buscar(ctx, id);
  }
}
