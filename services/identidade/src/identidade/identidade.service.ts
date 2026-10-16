import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  ehPermissao,
  formatarDocumento,
  DIAS_NAVEGADOR_CONFIAVEL,
  TODAS_AS_PERMISSOES,
  isUuid,
  login2faSchema,
  loginExternoSchema,
  loginSchema,
  renovarSchema,
  salvarPreferenciaSchema,
  salvarTemaSchema,
  CHAVES_DE_PREFERENCIA,
  trocarEmpresaSchema,
  trocarSenhaSchema,
  uuidv7,
  type Contexto,
  type Desafio2fa,
  type EmpresaResumo,
  type OrigemDoAcesso,
  type Permissao,
  type RespostaLogin,
  type ResultadoAcesso,
  type Sessao,
  type Tema,
  type Recurso,
  permissoesComRecursos,
  recursosEfetivos,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  acessos,
  codigosRecuperacao,
  desafiosLogin,
  empresas,
  navegadoresConfiaveis,
  perfis,
  sessoes,
  usuarios,
  vinculos,
} from '../db/schema.js';
import { decifrar } from '../seguranca/cripto.js';
import { anunciarRevogacao } from '../seguranca/revogacao.js';
import { conferirCodigo } from '../seguranca/totp.js';
import { conferirTokenExterno } from '../seguranca/provedores.js';
import { conferirSenha, protegerSenha } from '../seguranca/senhas.js';
import {
  CARENCIA_SEGUNDOS,
  emitirTokenDeAcesso,
  hashDoToken,
  novoTokenDeRenovacao,
} from '../seguranca/tokens.js';

export const MAXIMO_DE_FALHAS = 5;
/** Segunda etapa do login (2FA): prazo e tentativas do desafio. */
export const MINUTOS_DO_DESAFIO = 5;
export const TENTATIVAS_DO_CODIGO = 5;
export const MINUTOS_DE_BLOQUEIO = 15;

/** Mensagem única para e-mail inexistente ou senha errada: não revela quais e-mails existem. */
const CREDENCIAIS_INVALIDAS = 'E-mail ou senha incorretos.';
const SESSAO_INVALIDA = 'Sua sessão expirou. Entre novamente.';

type Usuario = typeof usuarios.$inferSelect;
type Db = Database<typeof schema>;

/** Origem do acesso que o gateway anexa à mensagem (IP e navegador repassados pelo web). */
export function origemDe(dados: unknown): OrigemDoAcesso {
  const o = (dados as { origem?: { ip?: unknown; navegador?: unknown } } | null)
    ?.origem;
  const texto = (v: unknown, max: number) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
  return { ip: texto(o?.ip, 45), navegador: texto(o?.navegador, 300) };
}

/** Código de recuperação normalizado ("abcd-efgh" = "ABCDEFGH") → hash. */
export const hashDoCodigo = (codigo: string) =>
  createHash('sha256')
    .update(codigo.toUpperCase().replace(/[^A-Z0-9]/g, ''))
    .digest('hex');
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

@Injectable()
export class IdentidadeService {
  private readonly logger = new Logger('Identidade');
  /** Hash de uma senha qualquer: e-mail inexistente custa o mesmo tempo que senha errada. */
  private readonly hashFicticio = protegerSenha(uuidv7());

  constructor(@Inject(DATABASE) private readonly db: Database<typeof schema>) {}

  /**
   * Primeira etapa do login. Senha certa e sem 2FA (ou navegador confiável) → sessão.
   * Com 2FA → um DESAFIO de 5 minutos; a sessão só sai em autenticar2fa, com o código.
   */
  async autenticar(dados: unknown): Promise<RespostaLogin> {
    const { email, senha, empresaId, navegadorConfiavel } = validar(
      loginSchema,
      dados,
    );
    const origem = origemDe(dados);
    const [usuario] = await this.db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, email));

    if (!usuario) {
      await conferirSenha(senha, await this.hashFicticio);
      throw new ErroDeNegocio('NAO_AUTENTICADO', CREDENCIAIS_INVALIDAS);
    }
    await this.recusarSeBloqueado(usuario, email, origem);
    if (!(await conferirSenha(senha, usuario.senhaHash))) {
      await this.registrarFalha(usuario);
      await this.registrarAcesso(usuario, email, null, 'senha_errada', origem);
      throw new ErroDeNegocio('NAO_AUTENTICADO', CREDENCIAIS_INVALIDAS);
    }
    return this.concluirLogin(usuario, {
      email,
      empresaId,
      navegadorConfiavel,
      origem,
      resultado: 'sucesso',
    });
  }

  /**
   * "Entrar com Microsoft/Google": a conta externa só prova o e-mail; quem entra é o usuário já cadastrado
   * com ele (não cria usuário). Daí em diante é igual ao login por senha, inclusive o 2FA.
   */
  async autenticarExterno(dados: unknown): Promise<RespostaLogin> {
    const { provedor, idToken, nonce, navegadorConfiavel } = validar(
      loginExternoSchema,
      dados,
    );
    const origem = origemDe(dados);
    const email = await conferirTokenExterno(provedor, idToken, nonce);
    const [usuario] = await this.db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, email));
    if (!usuario)
      throw new ErroDeNegocio(
        'NAO_AUTENTICADO',
        `O e-mail ${email} não tem acesso ao DaVinci Qualidade. Peça ao administrador da sua empresa para cadastrá-lo.`,
      );
    await this.recusarSeBloqueado(usuario, email, origem);
    return this.concluirLogin(usuario, {
      email,
      navegadorConfiavel,
      origem,
      resultado: `externo_${provedor}`,
    });
  }

  /** Bloqueio por senhas erradas vale para qualquer forma de entrar. */
  private async recusarSeBloqueado(
    usuario: Usuario,
    email: string,
    origem: OrigemDoAcesso,
  ): Promise<void> {
    const agora = new Date();
    if (!usuario.bloqueadoAte || usuario.bloqueadoAte <= agora) return;
    const minutos = Math.ceil(
      (usuario.bloqueadoAte.getTime() - agora.getTime()) / 60_000,
    );
    await this.registrarAcesso(usuario, email, null, 'bloqueado', origem);
    throw new ErroDeNegocio(
      'NAO_AUTENTICADO',
      `Acesso bloqueado temporariamente por excesso de tentativas. Tente novamente em ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`,
    );
  }

  /** Identidade confirmada (senha ou conta externa): usuário ativo, empresa, 2FA e sessão. */
  private async concluirLogin(
    usuario: Usuario,
    l: {
      email: string;
      empresaId?: string;
      navegadorConfiavel?: string;
      origem: OrigemDoAcesso;
      resultado: ResultadoAcesso;
    },
  ): Promise<RespostaLogin> {
    const { email, empresaId, navegadorConfiavel, origem } = l;
    const agora = new Date();
    if (!usuario.ativo) {
      await this.registrarAcesso(usuario, email, null, 'inativo', origem);
      throw new ErroDeNegocio(
        'NAO_AUTENTICADO',
        'Este usuário está inativo. Fale com o administrador da empresa.',
      );
    }

    const disponiveis = await this.empresasDoUsuario(usuario.id);
    if (disponiveis.length === 0) {
      throw new ErroDeNegocio(
        'NAO_AUTENTICADO',
        'Seu usuário não tem acesso a nenhuma empresa ativa. Fale com o administrador.',
      );
    }
    const escolhida = empresaId ?? usuario.ultimaEmpresaId ?? undefined;
    const empresa =
      disponiveis.find((e) => e.id === escolhida) ?? disponiveis[0]!;
    if (empresaId && empresa.id !== empresaId)
      throw new ErroDeNegocio(
        'SEM_PERMISSAO',
        'Você não tem acesso a esta empresa.',
      );

    // Senha certa: zera as falhas de senha (o 2FA tem as próprias tentativas)
    if (l.resultado === 'sucesso')
      await this.db
        .update(usuarios)
        .set({ falhasLogin: 0, bloqueadoAte: null })
        .where(eq(usuarios.id, usuario.id));

    if (
      usuario.totpSegredo &&
      !(await this.navegadorConfiavel(usuario.id, navegadorConfiavel))
    ) {
      return this.criarDesafio(usuario, empresa.id, origem);
    }
    await this.db
      .update(usuarios)
      .set({ ultimoAcessoEm: agora, ultimaEmpresaId: empresa.id })
      .where(eq(usuarios.id, usuario.id));
    await this.registrarAcesso(usuario, email, empresa.id, l.resultado, origem);
    return this.abrirSessao(
      this.db,
      usuario,
      empresa,
      disponiveis,
      uuidv7(),
      origem,
    );
  }

  /** Segunda etapa: código do aplicativo (6 dígitos) ou um código de recuperação (uso único). */
  async autenticar2fa(dados: unknown): Promise<Sessao> {
    const { desafio, codigo, confiar } = validar(login2faSchema, dados);
    const origem = origemDe(dados);
    const agora = new Date();
    const [d] = await this.db
      .select()
      .from(desafiosLogin)
      .where(eq(desafiosLogin.tokenHash, hashDoToken(desafio)));
    if (
      !d ||
      d.usadoEm ||
      d.expiraEm <= agora ||
      d.tentativas >= TENTATIVAS_DO_CODIGO
    ) {
      throw new ErroDeNegocio(
        'NAO_AUTENTICADO',
        'O tempo para digitar o código acabou. Entre de novo com e-mail e senha.',
      );
    }
    const usuario = await this.usuarioAtivo(this.db, d.usuarioId);
    const resultado = await this.conferirSegundoFator(usuario, codigo);
    if (!resultado) {
      const tentativas = d.tentativas + 1;
      await this.db
        .update(desafiosLogin)
        .set({
          tentativas,
          usadoEm: tentativas >= TENTATIVAS_DO_CODIGO ? agora : null,
        })
        .where(eq(desafiosLogin.id, d.id));
      await this.registrarAcesso(
        usuario,
        usuario.email,
        d.empresaId,
        'codigo_errado',
        origem,
      );
      if (tentativas >= TENTATIVAS_DO_CODIGO)
        throw new ErroDeNegocio(
          'NAO_AUTENTICADO',
          'Muitas tentativas com código errado. Entre de novo com e-mail e senha.',
        );
      const restam = TENTATIVAS_DO_CODIGO - tentativas;
      throw new ErroDeNegocio(
        'NAO_AUTENTICADO',
        `Código incorreto. ${restam === 1 ? 'Resta 1 tentativa' : `Restam ${restam} tentativas`}.`,
        [{ campo: 'codigo', mensagem: 'Código incorreto.' }],
      );
    }
    await this.db
      .update(desafiosLogin)
      .set({ usadoEm: agora })
      .where(eq(desafiosLogin.id, d.id));

    const disponiveis = await this.empresasDoUsuario(usuario.id);
    const empresa =
      disponiveis.find((e) => e.id === d.empresaId) ?? disponiveis[0];
    if (!empresa)
      throw new ErroDeNegocio(
        'NAO_AUTENTICADO',
        'Seu usuário não tem acesso a nenhuma empresa ativa. Fale com o administrador.',
      );
    await this.db
      .update(usuarios)
      .set({ ultimoAcessoEm: agora, ultimaEmpresaId: empresa.id })
      .where(eq(usuarios.id, usuario.id));
    await this.registrarAcesso(
      usuario,
      usuario.email,
      empresa.id,
      resultado === 'recuperacao' ? 'codigo_recuperacao' : 'sucesso',
      origem,
    );
    const sessao = await this.abrirSessao(
      this.db,
      usuario,
      empresa,
      disponiveis,
      uuidv7(),
      origem,
    );
    if (!confiar) return sessao;
    const token = randomBytes(32).toString('base64url');
    const expiraEm = new Date(
      agora.getTime() + DIAS_NAVEGADOR_CONFIAVEL * 86_400_000,
    );
    await this.db.insert(navegadoresConfiaveis).values({
      usuarioId: usuario.id,
      tokenHash: hashDoToken(token),
      navegador: origem.navegador,
      expiraEm,
    });
    return {
      ...sessao,
      navegadorConfiavel: { token, expiraEm: expiraEm.toISOString() },
    };
  }

  /** TOTP (sem reuso do mesmo código) ou código de recuperação (marcado como usado). */
  async conferirSegundoFator(
    usuario: Usuario,
    codigo: string,
  ): Promise<'totp' | 'recuperacao' | null> {
    if (!usuario.totpSegredo) return null;
    if (/^\d{6}$/.test(codigo)) {
      const passo = conferirCodigo(
        decifrar(usuario.totpSegredo),
        codigo,
        usuario.totpUltimoPasso,
      );
      if (passo === null) return null;
      // Só grava se ninguém usou um passo igual ou maior no meio-tempo (corrida entre duas abas)
      const [ok] = await this.db
        .update(usuarios)
        .set({ totpUltimoPasso: passo })
        .where(
          and(
            eq(usuarios.id, usuario.id),
            sql`coalesce(${usuarios.totpUltimoPasso}, -1) < ${passo}`,
          ),
        )
        .returning({ id: usuarios.id });
      return ok ? 'totp' : null;
    }
    const [usado] = await this.db
      .update(codigosRecuperacao)
      .set({ usadoEm: new Date() })
      .where(
        and(
          eq(codigosRecuperacao.usuarioId, usuario.id),
          eq(codigosRecuperacao.hash, hashDoCodigo(codigo)),
          isNull(codigosRecuperacao.usadoEm),
        ),
      )
      .returning({ id: codigosRecuperacao.id });
    return usado ? 'recuperacao' : null;
  }

  /** Troca o token de renovação por outro (uso único). Token já trocado = cópia: revoga a família. */
  async renovar(dados: unknown): Promise<Sessao> {
    const { tokenRenovacao } = validar(renovarSchema, dados);
    return this.db.transaction(async (tx) => {
      const sessao = await this.sessaoValida(tx, tokenRenovacao, {
        aceitaCarencia: true,
      });
      if (!sessao.revogadaEm) {
        await tx
          .update(sessoes)
          .set({ revogadaEm: new Date(), motivoRevogacao: 'renovada' })
          .where(eq(sessoes.id, sessao.id));
      }
      const usuario = await this.usuarioAtivo(tx, sessao.usuarioId);
      const disponiveis = await this.empresasDoUsuario(usuario.id, tx);
      const empresa = disponiveis.find((e) => e.id === sessao.empresaId);
      if (!empresa)
        throw new ErroDeNegocio(
          'NAO_AUTENTICADO',
          'Seu acesso a esta empresa foi removido. Entre novamente.',
        );
      return this.abrirSessao(
        tx,
        usuario,
        empresa,
        disponiveis,
        sessao.familia,
        { ip: sessao.ip, navegador: sessao.navegador },
      );
    });
  }

  async encerrar(dados: unknown): Promise<{ encerrada: true }> {
    const { tokenRenovacao } = validar(renovarSchema, dados);
    const r = await this.db
      .update(sessoes)
      .set({ revogadaEm: new Date(), motivoRevogacao: 'encerrada' })
      .where(
        and(
          eq(sessoes.tokenHash, hashDoToken(tokenRenovacao)),
          isNull(sessoes.revogadaEm),
        ),
      )
      .returning({ familia: sessoes.familia });
    await anunciarRevogacao(r.map((x) => x.familia));
    return { encerrada: true };
  }

  async trocarEmpresa(dados: unknown): Promise<Sessao> {
    const { tokenRenovacao, empresaId } = validar(trocarEmpresaSchema, dados);
    return this.db.transaction(async (tx) => {
      const sessao = await this.sessaoValida(tx, tokenRenovacao);
      const usuario = await this.usuarioAtivo(tx, sessao.usuarioId);
      const disponiveis = await this.empresasDoUsuario(usuario.id, tx);
      const empresa = disponiveis.find((e) => e.id === empresaId);
      if (!empresa)
        throw new ErroDeNegocio(
          'SEM_PERMISSAO',
          'Você não tem acesso a esta empresa.',
        );
      await tx
        .update(sessoes)
        .set({ revogadaEm: new Date(), motivoRevogacao: 'troca-de-empresa' })
        .where(eq(sessoes.id, sessao.id));
      await tx
        .update(usuarios)
        .set({ ultimaEmpresaId: empresa.id })
        .where(eq(usuarios.id, usuario.id));
      return this.abrirSessao(
        tx,
        usuario,
        empresa,
        disponiveis,
        sessao.familia,
        { ip: sessao.ip, navegador: sessao.navegador },
      );
    });
  }

  /** Troca a própria senha e encerra as OUTRAS sessões (as demais famílias). */
  async trocarSenha(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ alterada: true }> {
    const { senhaAtual, novaSenha } = validar(trocarSenhaSchema, dados);
    const usuario = await this.usuarioAtivo(this.db, ctx.usuarioId);
    if (!(await conferirSenha(senhaAtual, usuario.senhaHash))) {
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [{ campo: 'senhaAtual', mensagem: 'Senha atual incorreta.' }],
      );
    }
    const token = (dados as { tokenRenovacao?: unknown } | null)
      ?.tokenRenovacao;
    const atual = typeof token === 'string' ? hashDoToken(token) : null;
    const encerradas = await this.db.transaction(async (tx) => {
      await tx
        .update(usuarios)
        .set({
          senhaHash: await protegerSenha(novaSenha),
          deveTrocarSenha: false,
          atualizadoPor: usuario.id,
        })
        .where(eq(usuarios.id, usuario.id));
      const [sessaoAtual] = atual
        ? await tx.select().from(sessoes).where(eq(sessoes.tokenHash, atual))
        : [];
      const outras = await tx
        .update(sessoes)
        .set({ revogadaEm: new Date(), motivoRevogacao: 'senha-alterada' })
        .where(
          and(
            eq(sessoes.usuarioId, usuario.id),
            isNull(sessoes.revogadaEm),
            sessaoAtual
              ? sql`${sessoes.familia} <> ${sessaoAtual.familia}`
              : undefined,
          ),
        )
        .returning({ familia: sessoes.familia });
      // Senha nova: os navegadores "confiáveis" voltam a pedir o código do 2FA
      await tx
        .update(navegadoresConfiaveis)
        .set({ revogadoEm: new Date() })
        .where(
          and(
            eq(navegadoresConfiaveis.usuarioId, usuario.id),
            isNull(navegadoresConfiaveis.revogadoEm),
          ),
        );
      return outras.map((x) => x.familia);
    });
    await anunciarRevogacao(encerradas);
    return { alterada: true };
  }

  /** Dados do usuário logado na empresa do contexto (para o menu e as permissões da tela). */
  async eu(ctx: Contexto) {
    const usuario = await this.usuarioAtivo(this.db, ctx.usuarioId);
    const disponiveis = await this.empresasDoUsuario(usuario.id);
    const empresa = disponiveis.find((e) => e.id === ctx.empresaId);
    if (!empresa)
      throw new ErroDeNegocio(
        'SEM_PERMISSAO',
        'Você não tem acesso a esta empresa.',
      );
    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        deveTrocarSenha: usuario.deveTrocarSenha,
        tema: (usuario.tema === 'escuro' ? 'escuro' : 'claro') as Tema,
      },
      empresa: resumo(empresa),
      empresas: disponiveis.map(resumo),
      permissoes: empresa.permissoes,
      recursos: empresa.recursos,
    };
  }

  /** Tema da interface (claro | escuro), salvo no perfil: vale em qualquer computador. */
  async salvarTema(ctx: Contexto, dados: unknown) {
    const { tema } = validar(salvarTemaSchema, dados);
    await this.db
      .update(usuarios)
      .set({ tema })
      .where(eq(usuarios.id, ctx.usuarioId!));
    return { tema };
  }

  /** Preferência da interface (ex.: colunas da lista de produtos); null se nunca escolhida. */
  async obterPreferencia(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ valor: unknown }> {
    const chave = (dados as { chave?: unknown } | null)?.chave;
    if (!(CHAVES_DE_PREFERENCIA as readonly unknown[]).includes(chave))
      throw new ErroDeNegocio('DADOS_INVALIDOS', 'Preferência desconhecida.');
    const [u] = await this.db
      .select({ p: usuarios.preferencias })
      .from(usuarios)
      .where(eq(usuarios.id, ctx.usuarioId!));
    return { valor: u?.p[chave as string] ?? null };
  }

  async salvarPreferencia(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ valor: unknown }> {
    const { chave, valor } = validar(salvarPreferenciaSchema, dados);
    await this.db
      .update(usuarios)
      .set({
        preferencias: sql`${usuarios.preferencias} || ${JSON.stringify({ [chave]: valor })}::jsonb`,
      })
      .where(eq(usuarios.id, ctx.usuarioId!));
    return { valor };
  }

  // ---------------------------------------------------------------------------

  private async abrirSessao(
    tx: Tx | Database<typeof schema>,
    usuario: Usuario,
    empresa: EmpresaComPermissoes,
    disponiveis: EmpresaComPermissoes[],
    familia: string,
    origem: OrigemDoAcesso = { ip: null, navegador: null },
  ): Promise<Sessao> {
    const agora = new Date();
    const renovacao = novoTokenDeRenovacao(agora);
    await tx.insert(sessoes).values({
      familia,
      usuarioId: usuario.id,
      empresaId: empresa.id,
      tokenHash: renovacao.hash,
      criadoEm: agora,
      expiraEm: renovacao.expiraEm,
      ip: origem.ip,
      navegador: origem.navegador,
    });
    const acesso = await emitirTokenDeAcesso(
      {
        sub: usuario.id,
        emp: empresa.id,
        nom: usuario.nome,
        per: empresa.permissoes,
        dts: usuario.deveTrocarSenha,
        c2f: empresa.exige2fa && !usuario.totpSegredo,
        sid: familia,
        rec: empresa.recursos,
      },
      agora,
    );
    return {
      tokenAcesso: acesso.token,
      acessoExpiraEm: acesso.expiraEm.toISOString(),
      tokenRenovacao: renovacao.token,
      renovacaoExpiraEm: renovacao.expiraEm.toISOString(),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        deveTrocarSenha: usuario.deveTrocarSenha,
        tema: (usuario.tema === 'escuro' ? 'escuro' : 'claro') as Tema,
      },
      empresa: resumo(empresa),
      empresas: disponiveis.map(resumo),
      permissoes: empresa.permissoes,
      recursos: empresa.recursos,
    };
  }

  /** Sessão ativa pelo token; token já trocado (fora da carência) = reutilização: revoga a família inteira. */
  private async sessaoValida(
    tx: Tx,
    token: string,
    { aceitaCarencia = false } = {},
  ) {
    const [sessao] = await tx
      .select()
      .from(sessoes)
      .where(eq(sessoes.tokenHash, hashDoToken(token)));
    if (!sessao) throw new ErroDeNegocio('NAO_AUTENTICADO', SESSAO_INVALIDA);
    const agora = Date.now();
    const emCarencia =
      sessao.revogadaEm !== null &&
      agora - sessao.revogadaEm.getTime() <= CARENCIA_SEGUNDOS * 1000;
    // Requisições simultâneas do navegador com o mesmo token: renova de novo, sem tratar como cópia
    if (
      aceitaCarencia &&
      emCarencia &&
      sessao.motivoRevogacao === 'renovada' &&
      sessao.expiraEm.getTime() > agora
    )
      return sessao;
    // Logo após trocar de empresa: recusa, mas sem derrubar a sessão nova
    if (emCarencia && sessao.motivoRevogacao === 'troca-de-empresa')
      throw new ErroDeNegocio('NAO_AUTENTICADO', SESSAO_INVALIDA);
    if (sessao.revogadaEm) {
      if (
        sessao.motivoRevogacao === 'renovada' ||
        sessao.motivoRevogacao === 'troca-de-empresa'
      ) {
        // Fora da transação de propósito: o erro abaixo desfaz a transação, e a revogação precisa ficar
        await this.db
          .update(sessoes)
          .set({ revogadaEm: new Date(), motivoRevogacao: 'reutilizacao' })
          .where(
            and(
              eq(sessoes.familia, sessao.familia),
              isNull(sessoes.revogadaEm),
            ),
          );
        await anunciarRevogacao([sessao.familia]);
        this.logger.warn(
          `Token de renovação reutilizado: família ${sessao.familia} revogada (usuário ${sessao.usuarioId}).`,
        );
      }
      throw new ErroDeNegocio('NAO_AUTENTICADO', SESSAO_INVALIDA);
    }
    if (sessao.expiraEm <= new Date())
      throw new ErroDeNegocio('NAO_AUTENTICADO', SESSAO_INVALIDA);
    return sessao;
  }

  private async usuarioAtivo(
    tx: Tx | Database<typeof schema>,
    id: string | null,
  ): Promise<Usuario> {
    const [usuario] = isUuid(id)
      ? await tx.select().from(usuarios).where(eq(usuarios.id, id))
      : [];
    if (!usuario || !usuario.ativo)
      throw new ErroDeNegocio('NAO_AUTENTICADO', SESSAO_INVALIDA);
    return usuario;
  }

  /** Empresas ativas em que o usuário tem vínculo ativo, com as permissões do perfil em cada uma. */
  private async empresasDoUsuario(
    usuarioId: string,
    tx: Tx | Database<typeof schema> = this.db,
  ): Promise<EmpresaComPermissoes[]> {
    const linhas = await tx
      .select({
        id: empresas.id,
        razaoSocial: empresas.razaoSocial,
        nomeFantasia: empresas.nomeFantasia,
        cnpj: empresas.cnpj,
        logoAtualizadaEm: empresas.logoAtualizadaEm,
        recursos: empresas.recursos,
        permissoes: perfis.permissoes,
        protegido: perfis.protegido,
        exige2fa: perfis.exige2fa,
      })
      .from(vinculos)
      .innerJoin(empresas, eq(empresas.id, vinculos.empresaId))
      .innerJoin(perfis, eq(perfis.id, vinculos.perfilId))
      .where(
        and(
          eq(vinculos.usuarioId, usuarioId),
          eq(vinculos.ativo, true),
          eq(empresas.ativa, true),
          eq(perfis.ativo, true),
        ),
      )
      .orderBy(asc(empresas.razaoSocial));
    // Administrador (protegido) tem SEMPRE todas as permissões, inclusive as criadas depois
    // A122: os recursos desligados tiram as permissões deles (também do Administrador)
    return linhas.map(({ protegido, recursos, ...l }) => {
      const ligados = recursosEfetivos(recursos);
      return {
        ...l,
        recursos: ligados,
        permissoes: permissoesComRecursos(
          protegido
            ? [...TODAS_AS_PERMISSOES]
            : l.permissoes.filter(ehPermissao),
          ligados,
        ),
      };
    });
  }

  private async criarDesafio(
    usuario: Usuario,
    empresaId: string,
    origem: OrigemDoAcesso,
  ): Promise<Desafio2fa> {
    const token = randomBytes(32).toString('base64url');
    const expiraEm = new Date(Date.now() + MINUTOS_DO_DESAFIO * 60_000);
    await this.db.insert(desafiosLogin).values({
      usuarioId: usuario.id,
      tokenHash: hashDoToken(token),
      empresaId,
      ip: origem.ip,
      navegador: origem.navegador,
      expiraEm,
    });
    return { desafio2fa: token, expiraEm: expiraEm.toISOString() };
  }

  private async navegadorConfiavel(
    usuarioId: string,
    token: string | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    const [n] = await this.db
      .select({ id: navegadoresConfiaveis.id })
      .from(navegadoresConfiaveis)
      .where(
        and(
          eq(navegadoresConfiaveis.tokenHash, hashDoToken(token)),
          eq(navegadoresConfiaveis.usuarioId, usuarioId),
          isNull(navegadoresConfiaveis.revogadoEm),
          gt(navegadoresConfiaveis.expiraEm, new Date()),
        ),
      );
    return Boolean(n);
  }

  /** Histórico de acessos (180 dias). Falha ao gravar o histórico nunca impede o login. */
  private async registrarAcesso(
    usuario: Usuario | null,
    email: string,
    empresaId: string | null,
    resultado: ResultadoAcesso,
    origem: OrigemDoAcesso,
  ) {
    await this.db
      .insert(acessos)
      .values({
        usuarioId: usuario?.id ?? null,
        email,
        empresaId,
        resultado,
        ip: origem.ip,
        navegador: origem.navegador,
      })
      .catch((e: unknown) =>
        this.logger.warn(
          `Não foi possível gravar o histórico de acesso: ${(e as Error).message}`,
        ),
      );
  }

  private async registrarFalha(usuario: Usuario): Promise<void> {
    const falhas = usuario.falhasLogin + 1;
    const bloquear = falhas >= MAXIMO_DE_FALHAS;
    await this.db
      .update(usuarios)
      .set({
        falhasLogin: bloquear ? 0 : falhas,
        bloqueadoAte: bloquear
          ? new Date(Date.now() + MINUTOS_DE_BLOQUEIO * 60_000)
          : usuario.bloqueadoAte,
      })
      .where(eq(usuarios.id, usuario.id));
    if (bloquear)
      this.logger.warn(
        `Usuário ${usuario.id} bloqueado por ${MINUTOS_DE_BLOQUEIO} min após ${MAXIMO_DE_FALHAS} senhas erradas.`,
      );
  }
}

type EmpresaComPermissoes = {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  logoAtualizadaEm: Date | null;
  permissoes: Permissao[];
  exige2fa: boolean;
  recursos: Recurso[];
};

function resumo(e: EmpresaComPermissoes): EmpresaResumo {
  return {
    id: e.id,
    nome: e.nomeFantasia ?? e.razaoSocial,
    cnpj: formatarDocumento(e.cnpj),
    logoVersao: e.logoAtualizadaEm?.toISOString() ?? null,
  };
}
