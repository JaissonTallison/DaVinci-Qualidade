import { randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { and, count, eq, gt, isNull, notInArray } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  MINUTOS_LINK_DE_SENHA,
  PATTERNS,
  PEDIDOS_DE_SENHA_POR_HORA,
  SERVICES,
  redefinirSenhaSchema,
  recuperarSenhaSchema,
  uuidv7,
  type EmailParaEnviar,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  acessos,
  navegadoresConfiaveis,
  recuperacoesSenha,
  sessoes,
  usuarios,
} from '../db/schema.js';
import { origemDe } from '../identidade/identidade.service.js';
import {
  MOTIVOS_QUE_NAO_ENCERRAM,
  anunciarRevogacao,
} from '../seguranca/revogacao.js';
import { protegerSenha } from '../seguranca/senhas.js';
import { hashDoToken } from '../seguranca/tokens.js';

const LINK_INVALIDO =
  'Este link não vale mais (já foi usado, venceu ou foi substituído por um pedido mais novo). Peça outro em "Esqueceu a senha?".';

/**
 * "Esqueci minha senha": link por e-mail (30 min, uso único, 3 pedidos por hora por e-mail).
 * A resposta é SEMPRE a mesma, exista o e-mail ou não (não revela quem tem cadastro).
 * Redefinir NÃO desliga o 2FA: quem tem continua precisando do código para entrar.
 */
@Injectable()
export class RecuperacaoService {
  private readonly logger = new Logger('Recuperação de senha');

  constructor(
    @Inject(DATABASE) private readonly db: Database<typeof schema>,
    @Inject(SERVICES.PLATAFORMA)
    private readonly plataforma: Pick<ClientProxy, 'emit'>,
  ) {}

  async solicitar(dados: unknown): Promise<{ enviado: true }> {
    const { email } = validar(recuperarSenhaSchema, dados);
    const origem = origemDe(dados);
    const [usuario] = await this.db
      .select()
      .from(usuarios)
      .where(and(eq(usuarios.email, email), eq(usuarios.ativo, true)));
    if (!usuario) return { enviado: true };

    const umaHoraAtras = new Date(Date.now() - 3_600_000);
    const [{ n }] = await this.db
      .select({ n: count() })
      .from(recuperacoesSenha)
      .where(
        and(
          eq(recuperacoesSenha.usuarioId, usuario.id),
          gt(recuperacoesSenha.criadoEm, umaHoraAtras),
        ),
      );
    if (Number(n) >= PEDIDOS_DE_SENHA_POR_HORA) {
      this.logger.warn(
        `Limite de ${PEDIDOS_DE_SENHA_POR_HORA} pedidos por hora atingido para o usuário ${usuario.id}: nada enviado.`,
      );
      return { enviado: true };
    }

    const token = randomBytes(32).toString('base64url');
    const agora = new Date();
    await this.db.transaction(async (tx) => {
      // Pedido novo invalida os links anteriores ainda não usados
      await tx
        .update(recuperacoesSenha)
        .set({ usadoEm: agora })
        .where(
          and(
            eq(recuperacoesSenha.usuarioId, usuario.id),
            isNull(recuperacoesSenha.usadoEm),
          ),
        );
      await tx.insert(recuperacoesSenha).values({
        usuarioId: usuario.id,
        tokenHash: hashDoToken(token),
        ip: origem.ip,
        expiraEm: new Date(agora.getTime() + MINUTOS_LINK_DE_SENHA * 60_000),
      });
    });
    await this.db
      .insert(acessos)
      .values({
        usuarioId: usuario.id,
        email,
        resultado: 'recuperacao_pedida',
        ip: origem.ip,
        navegador: origem.navegador,
      })
      .catch(() => undefined);

    const url = `${(process.env.APP_URL ?? 'http://localhost:3170').replace(/\/$/, '')}/redefinir-senha?token=${token}`;
    const mensagem: EmailParaEnviar = {
      para: email,
      assunto: 'Criar nova senha · DaVinci Qualidade',
      titulo: 'Criar nova senha',
      paragrafos: [
        `Olá, ${usuario.nome.split(' ')[0]}.`,
        `Recebemos um pedido para criar uma nova senha da sua conta no DaVinci Qualidade. O link abaixo vale por ${MINUTOS_LINK_DE_SENHA} minutos e pode ser usado uma única vez.`,
      ],
      botao: { texto: 'Criar nova senha', url },
      rodape:
        'Se não foi você, ignore este e-mail: a sua senha continua a mesma.',
    };
    this.plataforma.emit(PATTERNS.notificacoes.enviarEmail, {
      contexto: { rastreioId: uuidv7() },
      dados: mensagem,
    });
    return { enviado: true };
  }

  /** Nova senha pelo link: encerra TODAS as sessões e cancela os navegadores confiáveis. */
  async redefinir(dados: unknown): Promise<{ redefinida: true }> {
    const { token, novaSenha } = validar(redefinirSenhaSchema, dados);
    const origem = origemDe(dados);
    const agora = new Date();
    const [pedido] = await this.db
      .select()
      .from(recuperacoesSenha)
      .where(
        and(
          eq(recuperacoesSenha.tokenHash, hashDoToken(token)),
          isNull(recuperacoesSenha.usadoEm),
          gt(recuperacoesSenha.expiraEm, agora),
        ),
      );
    if (!pedido) throw new ErroDeNegocio('REGRA_DE_NEGOCIO', LINK_INVALIDO);
    const [usuario] = await this.db
      .select()
      .from(usuarios)
      .where(and(eq(usuarios.id, pedido.usuarioId), eq(usuarios.ativo, true)));
    if (!usuario) throw new ErroDeNegocio('REGRA_DE_NEGOCIO', LINK_INVALIDO);

    const encerradas = await this.db.transaction(async (tx) => {
      // Marca o link como usado primeiro: dois cliques simultâneos não usam o mesmo link
      const [usado] = await tx
        .update(recuperacoesSenha)
        .set({ usadoEm: agora })
        .where(
          and(
            eq(recuperacoesSenha.id, pedido.id),
            isNull(recuperacoesSenha.usadoEm),
          ),
        )
        .returning({ id: recuperacoesSenha.id });
      if (!usado) throw new ErroDeNegocio('REGRA_DE_NEGOCIO', LINK_INVALIDO);
      await tx
        .update(usuarios)
        .set({
          senhaHash: await protegerSenha(novaSenha),
          deveTrocarSenha: false,
          falhasLogin: 0,
          bloqueadoAte: null,
          atualizadoPor: usuario.id,
        })
        .where(eq(usuarios.id, usuario.id));
      await tx
        .update(navegadoresConfiaveis)
        .set({ revogadoEm: agora })
        .where(
          and(
            eq(navegadoresConfiaveis.usuarioId, usuario.id),
            isNull(navegadoresConfiaveis.revogadoEm),
          ),
        );
      const r = await tx
        .update(sessoes)
        .set({ revogadaEm: agora, motivoRevogacao: 'senha-redefinida' })
        .where(
          and(eq(sessoes.usuarioId, usuario.id), isNull(sessoes.revogadaEm)),
        )
        .returning({ familia: sessoes.familia });
      await tx.insert(acessos).values({
        usuarioId: usuario.id,
        email: usuario.email,
        resultado: 'senha_redefinida',
        ip: origem.ip,
        navegador: origem.navegador,
      });
      return r.map((x) => x.familia);
    });
    await anunciarRevogacao(encerradas);
    return { redefinida: true };
  }

  /** Para o gateway que acabou de subir: sessões encerradas à força nos últimos 16 minutos. */
  async revogacoesRecentes(): Promise<{ familias: string[] }> {
    const desde = new Date(Date.now() - 16 * 60_000);
    const linhas = await this.db
      .selectDistinct({ familia: sessoes.familia })
      .from(sessoes)
      .where(
        and(
          gt(sessoes.revogadaEm, desde),
          notInArray(sessoes.motivoRevogacao, [...MOTIVOS_QUE_NAO_ENCERRAM]),
        ),
      );
    return { familias: linhas.map((l) => l.familia) };
  }
}
