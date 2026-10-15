import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, isNull, ne, sql } from 'drizzle-orm';
import { DATABASE, type Database, ordemAlfabetica } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  alterarPerfilDoUsuarioSchema,
  devolverAcessoSchema,
  isUuid,
  novoUsuarioSchema,
  removerAcessoSchema,
  type Contexto,
  type SenhaRedefinida,
  type UsuarioCriado,
  type UsuarioDaEmpresa,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { perfis, sessoes, usuarios, vinculos } from '../db/schema.js';
import { ContaService } from '../conta/conta.service.js';
import { anunciarRevogacao } from '../seguranca/revogacao.js';
import { gerarSenhaProvisoria, protegerSenha } from '../seguranca/senhas.js';

const NAO_ENCONTRADO = 'Usuário não encontrado nesta empresa.';
const ALTERADO_POR_OUTRA_PESSOA =
  'Este acesso foi alterado por outra pessoa. Recarregue para ver a versão atual.';
const ULTIMO_ADMINISTRADOR =
  'A empresa precisa de pelo menos um administrador ativo. Dê o perfil Administrador a outra pessoa antes.';

type Db = Database<typeof schema>;

/** O `id` vem junto dos dados da mensagem (o gateway o tira da URL). */
const idDe = (dados: unknown): unknown =>
  (dados as { id?: unknown } | null)?.id;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Usuários da empresa (docs/05-modulos/identidade.md). A empresa administra o ACESSO
 * (vínculo + perfil); nome e senha de quem acessa outras empresas só a própria pessoa altera.
 */
@Injectable()
export class UsuariosService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly conta: ContaService,
  ) {}

  async listar(ctx: Contexto): Promise<UsuarioDaEmpresa[]> {
    return this.consultar(ctx, this.db);
  }

  async obter(ctx: Contexto, dados: unknown): Promise<UsuarioDaEmpresa> {
    return this.buscar(ctx, this.db, idDe(dados));
  }

  async criar(ctx: Contexto, dados: unknown): Promise<UsuarioCriado> {
    const { nome, email, perfilId } = validar(novoUsuarioSchema, dados);
    return this.db.transaction(async (tx) => {
      await this.perfilAtivo(ctx, tx, perfilId);
      const [existente] = await tx
        .select()
        .from(usuarios)
        .where(eq(usuarios.email, email));
      if (existente) {
        const [vinculo] = await tx
          .select({ ativo: vinculos.ativo })
          .from(vinculos)
          .where(
            and(
              eq(vinculos.empresaId, ctx.empresaId),
              eq(vinculos.usuarioId, existente.id),
            ),
          );
        if (vinculo) {
          const situacao = vinculo.ativo
            ? 'já tem acesso a esta empresa'
            : 'já teve acesso a esta empresa (está removido): devolva o acesso na ficha dela';
          throw new ErroDeNegocio(
            'CONFLITO',
            `${existente.nome} ${situacao}.`,
            [
              {
                campo: 'email',
                mensagem: 'E-mail já cadastrado nesta empresa.',
              },
            ],
          );
        }
        await tx.insert(vinculos).values({
          empresaId: ctx.empresaId,
          usuarioId: existente.id,
          perfilId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        });
        return {
          usuario: await this.buscar(ctx, tx, existente.id),
          senhaProvisoria: null,
          pessoaJaExistia: true,
        };
      }
      const senhaProvisoria = gerarSenhaProvisoria();
      const [novo] = await tx
        .insert(usuarios)
        .values({
          nome,
          email,
          senhaHash: await protegerSenha(senhaProvisoria),
          deveTrocarSenha: true,
          ultimaEmpresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      await tx.insert(vinculos).values({
        empresaId: ctx.empresaId,
        usuarioId: novo!.id,
        perfilId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      });
      return {
        usuario: await this.buscar(ctx, tx, novo!.id),
        senhaProvisoria,
        pessoaJaExistia: false,
      };
    });
  }

  async alterarPerfil(
    ctx: Contexto,
    dados: unknown,
  ): Promise<UsuarioDaEmpresa> {
    const { perfilId, versao } = validar(alterarPerfilDoUsuarioSchema, dados);
    return this.db.transaction(async (tx) => {
      const alvo = await this.buscar(ctx, tx, idDe(dados));
      if (alvo.euMesmo)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Você não pode alterar o seu próprio perfil. Peça a outro administrador.',
        );
      if (!alvo.ativo)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Devolva o acesso antes de alterar o perfil.',
        );
      const novo = await this.perfilAtivo(ctx, tx, perfilId);
      if (alvo.perfil.protegido && !novo.protegido)
        await this.garantirOutroAdministrador(ctx, tx, alvo.id);
      await this.gravar(ctx, tx, alvo.id, versao, { perfilId });
      return this.buscar(ctx, tx, alvo.id);
    });
  }

  async removerAcesso(
    ctx: Contexto,
    dados: unknown,
  ): Promise<UsuarioDaEmpresa> {
    const { motivo, versao } = validar(removerAcessoSchema, dados);
    return this.db.transaction(async (tx) => {
      const alvo = await this.buscar(ctx, tx, idDe(dados));
      if (alvo.euMesmo)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Você não pode remover o seu próprio acesso.',
        );
      if (!alvo.ativo)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'O acesso desta pessoa já foi removido.',
        );
      if (alvo.perfil.protegido)
        await this.garantirOutroAdministrador(ctx, tx, alvo.id);
      await this.gravar(ctx, tx, alvo.id, versao, {
        ativo: false,
        inativadoEm: new Date(),
        inativadoPor: ctx.usuarioId,
        motivoInativacao: motivo,
      });
      // Sai na hora: as sessões nesta empresa deixam de renovar
      const encerradas = await tx
        .update(sessoes)
        .set({ revogadaEm: new Date(), motivoRevogacao: 'acesso-removido' })
        .where(
          and(
            eq(sessoes.usuarioId, alvo.id),
            eq(sessoes.empresaId, ctx.empresaId),
            isNull(sessoes.revogadaEm),
          ),
        )
        .returning({ familia: sessoes.familia });
      await anunciarRevogacao(encerradas.map((x) => x.familia));
      return this.buscar(ctx, tx, alvo.id);
    });
  }

  async devolverAcesso(
    ctx: Contexto,
    dados: unknown,
  ): Promise<UsuarioDaEmpresa> {
    const { versao } = validar(devolverAcessoSchema, dados);
    return this.db.transaction(async (tx) => {
      const alvo = await this.buscar(ctx, tx, idDe(dados));
      if (alvo.ativo)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Esta pessoa já tem acesso.',
        );
      await this.perfilAtivo(
        ctx,
        tx,
        alvo.perfil.id,
        'O perfil desta pessoa foi inativado. Reative o perfil ou escolha outro antes.',
      );
      await this.gravar(ctx, tx, alvo.id, versao, {
        ativo: true,
        inativadoEm: null,
        inativadoPor: null,
        motivoInativacao: null,
      });
      return this.buscar(ctx, tx, alvo.id);
    });
  }

  async redefinirSenha(
    ctx: Contexto,
    dados: unknown,
  ): Promise<SenhaRedefinida> {
    return this.db.transaction(async (tx) => {
      const alvo = await this.buscar(ctx, tx, idDe(dados));
      if (alvo.euMesmo)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Para a sua própria senha, use "Alterar senha" no menu da conta.',
        );
      if (!alvo.ativo)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Devolva o acesso antes de redefinir a senha.',
        );
      if (alvo.acessaOutrasEmpresas) {
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Esta pessoa também acessa outras empresas, por isso só ela pode trocar a própria senha. Se ela esqueceu, o administrador da empresa de origem pode redefinir.',
        );
      }
      const senhaProvisoria = gerarSenhaProvisoria();
      await tx
        .update(usuarios)
        .set({
          senhaHash: await protegerSenha(senhaProvisoria),
          deveTrocarSenha: true,
          falhasLogin: 0,
          bloqueadoAte: null,
          atualizadoPor: ctx.usuarioId,
        })
        .where(eq(usuarios.id, alvo.id));
      const encerradas = await tx
        .update(sessoes)
        .set({ revogadaEm: new Date(), motivoRevogacao: 'senha-redefinida' })
        .where(and(eq(sessoes.usuarioId, alvo.id), isNull(sessoes.revogadaEm)))
        .returning({ familia: sessoes.familia });
      await anunciarRevogacao(encerradas.map((x) => x.familia));
      return { senhaProvisoria };
    });
  }

  /**
   * Pessoa perdeu o celular e os códigos: o administrador desliga o 2FA (ela reativa depois).
   * Mesma regra da senha: só de quem acessa apenas esta empresa.
   */
  async desativar2fa(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ desativado: true }> {
    return this.db.transaction(async (tx) => {
      const alvo = await this.buscar(ctx, tx, idDe(dados));
      if (alvo.euMesmo)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Para a sua própria conta, use "Segurança da conta" no menu.',
        );
      if (!alvo.doisFatores)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Esta pessoa não usa a verificação em duas etapas.',
        );
      if (alvo.acessaOutrasEmpresas) {
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Esta pessoa também acessa outras empresas: o administrador da empresa de origem é quem pode desativar.',
        );
      }
      await this.conta.limpar2fa(tx, alvo.id, ctx.usuarioId);
      const encerradas = await tx
        .update(sessoes)
        .set({ revogadaEm: new Date(), motivoRevogacao: '2fa-desativado' })
        .where(and(eq(sessoes.usuarioId, alvo.id), isNull(sessoes.revogadaEm)))
        .returning({ familia: sessoes.familia });
      await anunciarRevogacao(encerradas.map((x) => x.familia));
      return { desativado: true as const };
    });
  }

  // ---------------------------------------------------------------------------

  private async consultar(
    ctx: Contexto,
    tx: Tx | Db,
    usuarioId?: string,
  ): Promise<UsuarioDaEmpresa[]> {
    const outras = tx
      .select({ usuarioId: vinculos.usuarioId, total: count().as('total') })
      .from(vinculos)
      .where(ne(vinculos.empresaId, ctx.empresaId))
      .groupBy(vinculos.usuarioId)
      .as('outras');
    const linhas = await tx
      .select({
        u: usuarios,
        v: vinculos,
        p: { id: perfis.id, nome: perfis.nome, protegido: perfis.protegido },
        outras: outras.total,
      })
      .from(vinculos)
      .innerJoin(usuarios, eq(usuarios.id, vinculos.usuarioId))
      .innerJoin(perfis, eq(perfis.id, vinculos.perfilId))
      .leftJoin(outras, eq(outras.usuarioId, vinculos.usuarioId))
      .where(
        and(
          eq(vinculos.empresaId, ctx.empresaId),
          usuarioId ? eq(vinculos.usuarioId, usuarioId) : undefined,
        ),
      )
      .orderBy(ordemAlfabetica(usuarios.nome));
    return linhas.map(({ u, v, p, outras: total }) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      perfil: p,
      ativo: v.ativo,
      motivoInativacao: v.motivoInativacao,
      inativadoEm: v.inativadoEm?.toISOString() ?? null,
      ultimoAcessoEm: u.ultimoAcessoEm?.toISOString() ?? null,
      deveTrocarSenha: u.deveTrocarSenha,
      doisFatores: u.totpSegredo !== null,
      acessaOutrasEmpresas: Number(total ?? 0) > 0,
      euMesmo: u.id === ctx.usuarioId,
      versao: v.atualizadoEm.toISOString(),
    }));
  }

  private async buscar(
    ctx: Contexto,
    tx: Tx | Db,
    id: unknown,
  ): Promise<UsuarioDaEmpresa> {
    const [u] = isUuid(id) ? await this.consultar(ctx, tx, id) : [];
    if (!u) throw new ErroDeNegocio('NAO_ENCONTRADO', NAO_ENCONTRADO);
    return u;
  }

  private async perfilAtivo(
    ctx: Contexto,
    tx: Tx,
    perfilId: string,
    mensagem = 'Selecione um perfil ativo desta empresa.',
  ) {
    const [p] = isUuid(perfilId)
      ? await tx
          .select()
          .from(perfis)
          .where(
            and(
              eq(perfis.id, perfilId),
              eq(perfis.empresaId, ctx.empresaId),
              eq(perfis.ativo, true),
            ),
          )
      : [];
    if (!p)
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [{ campo: 'perfilId', mensagem }],
      );
    return p;
  }

  /**
   * Trava (FOR UPDATE) os acessos de administrador da empresa: dois administradores
   * removendo um ao outro ao mesmo tempo não podem deixar a empresa sem nenhum.
   */
  private async garantirOutroAdministrador(
    ctx: Contexto,
    tx: Tx,
    exceto: string,
  ) {
    const admins = await tx
      .select({ usuarioId: vinculos.usuarioId })
      .from(vinculos)
      .innerJoin(perfis, eq(perfis.id, vinculos.perfilId))
      .where(
        and(
          eq(vinculos.empresaId, ctx.empresaId),
          eq(vinculos.ativo, true),
          eq(perfis.protegido, true),
        ),
      )
      .for('update', { of: vinculos });
    if (!admins.some((a) => a.usuarioId !== exceto))
      throw new ErroDeNegocio('REGRA_DE_NEGOCIO', ULTIMO_ADMINISTRADOR);
  }

  /** Atualiza o vínculo só se a versão for a que a tela leu (edição simultânea). */
  private async gravar(
    ctx: Contexto,
    tx: Tx,
    usuarioId: string,
    versao: string,
    valores: Partial<typeof vinculos.$inferInsert>,
  ) {
    const lida = new Date(versao);
    const [linha] = Number.isNaN(lida.getTime())
      ? []
      : await tx
          .update(vinculos)
          .set({ ...valores, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(vinculos.empresaId, ctx.empresaId),
              eq(vinculos.usuarioId, usuarioId),
              eq(vinculos.atualizadoEm, lida),
            ),
          )
          .returning({ id: vinculos.id });
    if (!linha) throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
  }
}
