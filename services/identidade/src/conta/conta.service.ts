import { randomInt } from 'node:crypto';
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  gt,
  isNull,
  lt,
  min,
  ne,
  sql,
} from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  DIAS_HISTORICO_DE_ACESSOS,
  confirmar2faSchema,
  desativar2faSchema,
  isUuid,
  type Acesso,
  type CodigosDeRecuperacao,
  type Contexto,
  type Inicio2fa,
  type ResultadoAcesso,
  type SegurancaDaConta,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  acessos,
  codigosRecuperacao,
  empresas,
  navegadoresConfiaveis,
  perfis,
  sessoes,
  usuarios,
  vinculos,
} from '../db/schema.js';
import {
  hashDoCodigo,
  IdentidadeService,
} from '../identidade/identidade.service.js';
import { cifrar, decifrar } from '../seguranca/cripto.js';
import { anunciarRevogacao } from '../seguranca/revogacao.js';
import { conferirSenha } from '../seguranca/senhas.js';
import { hashDoToken } from '../seguranca/tokens.js';
import {
  conferirCodigo,
  enderecoOtpauth,
  novoSegredo,
} from '../seguranca/totp.js';

type Db = Database<typeof schema>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export const QUANTIDADE_DE_CODIGOS = 10;
const SEM_AMBIGUIDADE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DIA = 86_400_000;

/** "K7PM-X9QR": 8 caracteres sem 0/O/1/I, fáceis de anotar. */
const novoCodigo = () => {
  const c = Array.from(
    { length: 8 },
    () => SEM_AMBIGUIDADE[randomInt(SEM_AMBIGUIDADE.length)],
  ).join('');
  return `${c.slice(0, 4)}-${c.slice(4)}`;
};

/**
 * Segurança da PRÓPRIA conta (docs/05-modulos/identidade.md): verificação em duas etapas,
 * códigos de recuperação, sessões ativas, navegadores confiáveis e histórico de acessos.
 */
@Injectable()
export class ContaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Conta');
  private limpeza?: NodeJS.Timeout;

  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly identidade: IdentidadeService,
  ) {}

  /** Histórico com IP é dado pessoal: o que passa de 180 dias é apagado (na subida e uma vez por dia). */
  onModuleInit() {
    void this.apagarHistoricoAntigo();
    this.limpeza = setInterval(() => void this.apagarHistoricoAntigo(), DIA);
    this.limpeza.unref();
  }

  onModuleDestroy() {
    if (this.limpeza) clearInterval(this.limpeza);
  }

  async apagarHistoricoAntigo(): Promise<number> {
    const limite = new Date(Date.now() - DIAS_HISTORICO_DE_ACESSOS * DIA);
    const apagados = await this.db
      .delete(acessos)
      .where(lt(acessos.momento, limite))
      .returning({ id: acessos.id })
      .catch(() => []);
    if (apagados.length)
      this.logger.log(
        `Histórico de acessos: ${apagados.length} registro(s) com mais de ${DIAS_HISTORICO_DE_ACESSOS} dias apagado(s).`,
      );
    return apagados.length;
  }

  async seguranca(ctx: Contexto, dados: unknown): Promise<SegurancaDaConta> {
    const usuario = await this.usuario(ctx);
    const familiaAtual = await this.familiaDoToken(dados);
    const agora = new Date();
    const [[codigos], [confiaveis], [perfil], ativas, ultimos] =
      await Promise.all([
        this.db
          .select({ n: count() })
          .from(codigosRecuperacao)
          .where(
            and(
              eq(codigosRecuperacao.usuarioId, usuario.id),
              isNull(codigosRecuperacao.usadoEm),
            ),
          ),
        this.db
          .select({ n: count() })
          .from(navegadoresConfiaveis)
          .where(
            and(
              eq(navegadoresConfiaveis.usuarioId, usuario.id),
              isNull(navegadoresConfiaveis.revogadoEm),
              gt(navegadoresConfiaveis.expiraEm, agora),
            ),
          ),
        this.db
          .select({ exige: perfis.exige2fa })
          .from(vinculos)
          .innerJoin(perfis, eq(perfis.id, vinculos.perfilId))
          .where(
            and(
              eq(vinculos.usuarioId, usuario.id),
              eq(vinculos.empresaId, ctx.empresaId),
            ),
          ),
        // Uma linha ativa por família (as renovações revogam a anterior); o início vem da 1ª da família
        this.db
          .select({
            familia: sessoes.familia,
            criadoEm: sessoes.criadoEm,
            ip: sessoes.ip,
            navegador: sessoes.navegador,
            empresa: sql<string>`coalesce(${empresas.nomeFantasia}, ${empresas.razaoSocial})`,
            inicio: sql<Date>`(select ${min(sql`s2.criado_em`)} from ${sessoes} s2 where s2.familia = ${sessoes.familia})`,
          })
          .from(sessoes)
          .innerJoin(empresas, eq(empresas.id, sessoes.empresaId))
          .where(
            and(
              eq(sessoes.usuarioId, usuario.id),
              isNull(sessoes.revogadaEm),
              gt(sessoes.expiraEm, agora),
            ),
          )
          .orderBy(desc(sessoes.criadoEm)),
        this.db
          .select({
            momento: acessos.momento,
            resultado: acessos.resultado,
            ip: acessos.ip,
            navegador: acessos.navegador,
          })
          .from(acessos)
          .where(eq(acessos.usuarioId, usuario.id))
          .orderBy(desc(acessos.momento))
          .limit(20),
      ]);
    return {
      doisFatores: {
        ativo: Boolean(usuario.totpSegredo),
        ativadoEm: usuario.totpAtivadoEm?.toISOString() ?? null,
        codigosRestantes: Number(codigos?.n ?? 0),
        exigidoPeloPerfil: Boolean(perfil?.exige),
      },
      navegadoresConfiaveis: Number(confiaveis?.n ?? 0),
      sessoes: ativas.map((s) => ({
        id: s.familia,
        empresa: s.empresa,
        inicio: new Date(s.inicio).toISOString(),
        ultimaRenovacao: s.criadoEm.toISOString(),
        ip: s.ip,
        navegador: s.navegador,
        estaSessao: s.familia === familiaAtual,
      })),
      acessos: ultimos.map((a): Acesso => ({
        momento: a.momento.toISOString(),
        resultado: a.resultado as ResultadoAcesso,
        ip: a.ip,
        navegador: a.navegador,
      })),
    };
  }

  // ---------------------------------------------------------------- 2FA

  /** Gera o segredo (guardado cifrado, como "pendente") e o endereço do QR Code. Só ativa depois do primeiro código certo. */
  async iniciar2fa(ctx: Contexto): Promise<Inicio2fa> {
    const usuario = await this.usuario(ctx);
    if (usuario.totpSegredo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'A verificação em duas etapas já está ativa.',
      );
    const segredo = novoSegredo();
    await this.db
      .update(usuarios)
      .set({ totpPendente: cifrar(segredo) })
      .where(eq(usuarios.id, usuario.id));
    return { segredo, uri: enderecoOtpauth(segredo, usuario.email) };
  }

  async confirmar2fa(
    ctx: Contexto,
    dados: unknown,
  ): Promise<CodigosDeRecuperacao> {
    const { codigo } = validar(confirmar2faSchema, dados);
    const usuario = await this.usuario(ctx);
    if (usuario.totpSegredo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'A verificação em duas etapas já está ativa.',
      );
    if (!usuario.totpPendente)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Comece pelo botão "Ativar" para gerar o QR Code.',
      );
    const passo = conferirCodigo(decifrar(usuario.totpPendente), codigo, null);
    if (passo === null) {
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Código incorreto. Confira se o relógio do celular está certo e digite o código atual.',
        [{ campo: 'codigo', mensagem: 'Código incorreto.' }],
      );
    }
    return this.db.transaction(async (tx) => {
      await tx
        .update(usuarios)
        .set({
          totpSegredo: usuario.totpPendente,
          totpPendente: null,
          totpAtivadoEm: new Date(),
          totpUltimoPasso: passo,
          atualizadoPor: usuario.id,
        })
        .where(eq(usuarios.id, usuario.id));
      return this.gerarCodigos(tx, usuario.id);
    });
  }

  /** Exige senha + código. Bloqueado se algum perfil da pessoa exigir 2FA. */
  async desativar2fa(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ desativado: true }> {
    const { senha, codigo } = validar(desativar2faSchema, dados);
    const usuario = await this.usuario(ctx);
    if (!usuario.totpSegredo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'A verificação em duas etapas não está ativa.',
      );
    const exigente = await this.empresaQueExige(usuario.id);
    if (exigente)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        `O seu perfil em ${exigente} exige a verificação em duas etapas. Ela não pode ser desativada.`,
      );
    const detalhes = [];
    if (!(await conferirSenha(senha, usuario.senhaHash)))
      detalhes.push({ campo: 'senha', mensagem: 'Senha incorreta.' });
    else if (!(await this.identidade.conferirSegundoFator(usuario, codigo)))
      detalhes.push({ campo: 'codigo', mensagem: 'Código incorreto.' });
    if (detalhes.length)
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        detalhes,
      );
    await this.limpar2fa(this.db, usuario.id, usuario.id);
    return { desativado: true };
  }

  /** Novos códigos de recuperação (os antigos deixam de valer). Exige o código atual do aplicativo. */
  async novosCodigos(
    ctx: Contexto,
    dados: unknown,
  ): Promise<CodigosDeRecuperacao> {
    const { codigo } = validar(confirmar2faSchema, dados);
    const usuario = await this.usuario(ctx);
    if (!usuario.totpSegredo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Ative a verificação em duas etapas primeiro.',
      );
    if (
      !/^\d{6}$/.test(codigo) ||
      (await this.identidade.conferirSegundoFator(usuario, codigo)) !== 'totp'
    ) {
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [
          {
            campo: 'codigo',
            mensagem: 'Use o código atual do aplicativo (6 números).',
          },
        ],
      );
    }
    return this.db.transaction((tx) => this.gerarCodigos(tx, usuario.id));
  }

  // ---------------------------------------------------------------- sessões e navegadores

  async encerrarSessao(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ encerrada: true }> {
    const familia = (dados as { id?: unknown } | null)?.id;
    if (!isUuid(familia))
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Sessão não encontrada.');
    const revogadas = await this.db
      .update(sessoes)
      .set({ revogadaEm: new Date(), motivoRevogacao: 'encerrada-pela-pessoa' })
      .where(
        and(
          eq(sessoes.familia, familia),
          eq(sessoes.usuarioId, ctx.usuarioId!),
          isNull(sessoes.revogadaEm),
        ),
      )
      .returning({ familia: sessoes.familia });
    if (!revogadas.length)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Sessão não encontrada (talvez já tenha sido encerrada).',
      );
    await anunciarRevogacao([familia]);
    return { encerrada: true };
  }

  async encerrarOutras(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ encerradas: number }> {
    const atual = await this.familiaDoToken(dados);
    if (!atual)
      throw new ErroDeNegocio(
        'NAO_AUTENTICADO',
        'Sua sessão expirou. Entre novamente.',
      );
    const revogadas = await this.db
      .update(sessoes)
      .set({ revogadaEm: new Date(), motivoRevogacao: 'encerrada-pela-pessoa' })
      .where(
        and(
          eq(sessoes.usuarioId, ctx.usuarioId!),
          ne(sessoes.familia, atual),
          isNull(sessoes.revogadaEm),
        ),
      )
      .returning({ familia: sessoes.familia });
    await anunciarRevogacao(revogadas.map((r) => r.familia));
    return { encerradas: new Set(revogadas.map((r) => r.familia)).size };
  }

  async esquecerNavegadores(ctx: Contexto): Promise<{ esquecidos: number }> {
    const r = await this.db
      .update(navegadoresConfiaveis)
      .set({ revogadoEm: new Date() })
      .where(
        and(
          eq(navegadoresConfiaveis.usuarioId, ctx.usuarioId!),
          isNull(navegadoresConfiaveis.revogadoEm),
        ),
      )
      .returning({ id: navegadoresConfiaveis.id });
    return { esquecidos: r.length };
  }

  // ---------------------------------------------------------------------------

  /** Desliga o 2FA: segredo, códigos e navegadores confiáveis (usado aqui e pelo administrador). */
  async limpar2fa(tx: Tx | Db, usuarioId: string, quem: string | null) {
    await tx
      .update(usuarios)
      .set({
        totpSegredo: null,
        totpPendente: null,
        totpAtivadoEm: null,
        totpUltimoPasso: null,
        atualizadoPor: quem,
      })
      .where(eq(usuarios.id, usuarioId));
    await tx
      .delete(codigosRecuperacao)
      .where(eq(codigosRecuperacao.usuarioId, usuarioId));
    await tx
      .update(navegadoresConfiaveis)
      .set({ revogadoEm: new Date() })
      .where(
        and(
          eq(navegadoresConfiaveis.usuarioId, usuarioId),
          isNull(navegadoresConfiaveis.revogadoEm),
        ),
      );
  }

  private async gerarCodigos(
    tx: Tx,
    usuarioId: string,
  ): Promise<CodigosDeRecuperacao> {
    const codigos = Array.from({ length: QUANTIDADE_DE_CODIGOS }, novoCodigo);
    await tx
      .delete(codigosRecuperacao)
      .where(eq(codigosRecuperacao.usuarioId, usuarioId));
    await tx
      .insert(codigosRecuperacao)
      .values(codigos.map((c) => ({ usuarioId, hash: hashDoCodigo(c) })));
    return { codigos };
  }

  private async empresaQueExige(usuarioId: string): Promise<string | null> {
    const [l] = await this.db
      .select({
        nome: sql<string>`coalesce(${empresas.nomeFantasia}, ${empresas.razaoSocial})`,
      })
      .from(vinculos)
      .innerJoin(perfis, eq(perfis.id, vinculos.perfilId))
      .innerJoin(empresas, eq(empresas.id, vinculos.empresaId))
      .where(
        and(
          eq(vinculos.usuarioId, usuarioId),
          eq(vinculos.ativo, true),
          eq(perfis.exige2fa, true),
        ),
      )
      .limit(1);
    return l?.nome ?? null;
  }

  private async familiaDoToken(dados: unknown): Promise<string | null> {
    const token = (dados as { tokenRenovacao?: unknown } | null)
      ?.tokenRenovacao;
    if (typeof token !== 'string' || token.length < 20) return null;
    const [s] = await this.db
      .select({ familia: sessoes.familia })
      .from(sessoes)
      .where(eq(sessoes.tokenHash, hashDoToken(token)));
    return s?.familia ?? null;
  }

  private async usuario(ctx: Contexto) {
    const [u] = isUuid(ctx.usuarioId)
      ? await this.db
          .select()
          .from(usuarios)
          .where(and(eq(usuarios.id, ctx.usuarioId), eq(usuarios.ativo, true)))
      : [];
    if (!u)
      throw new ErroDeNegocio(
        'NAO_AUTENTICADO',
        'Sua sessão expirou. Entre novamente.',
      );
    return u;
  }
}
