import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PATTERNS,
  RECURSOS,
  SERVICES,
  TODOS_OS_RECURSOS,
  type Permissao,
  type Recurso,
} from '@davinci/types';
import { type RequisicaoComContexto } from '../contexto.js';
import { ErroDoServico, MensageriaService } from '../mensageria.service.js';
import {
  LIBERADA_COM_PENDENCIA,
  PERMISSAO_EXIGIDA,
  RECURSO_EXIGIDO,
  ROTA_PUBLICA,
} from './decoradores.js';
import { RevogacoesService } from './revogacoes.service.js';
import { conferirToken } from './token.js';

export const ENTRE_PARA_CONTINUAR = 'Entre para continuar.';
export const SESSAO_EXPIRADA = 'Sua sessão expirou. Entre novamente.';
export const TROQUE_A_SENHA = 'Troque a senha inicial para continuar.';
export const ATIVE_O_2FA =
  'O seu perfil exige a verificação em duas etapas. Ative-a em Segurança da conta para continuar.';
export const SEM_PERMISSAO =
  'Você não tem permissão para esta ação. Fale com o administrador da empresa.';
export const CHAVE_INVALIDA = 'Chave de API inválida ou revogada.';
/** I4: o que uma chave de API pode fazer (só as rotas /api/v1). */
export const PERMISSOES_DA_API: Permissao[] = [
  'parceiros.ver',
  'parceiros.editar',
];
type ChaveValidada = {
  empresaId: string;
  recursos: Recurso[];
  chaveId: string;
} | null;

/**
 * Guarda global: toda rota exige login, exceto as marcadas com @Publica().
 * A empresa e o usuário do contexto vêm SEMPRE do token assinado, nunca de cabeçalhos livres.
 */
@Injectable()
export class GuardaDeAcesso implements CanActivate {
  /** Chaves de API conferidas há pouco (1 minuto): evita uma ida ao Identidade a cada chamada. */
  private readonly chaves = new Map<
    string,
    { valor: ChaveValidada; ate: number }
  >();

  constructor(
    private readonly reflector: Reflector,
    private readonly revogacoes: RevogacoesService,
    private readonly mensageria: MensageriaService,
  ) {}

  /** I4: chave de API (cabeçalho x-api-key ou Authorization: ApiKey …), só nas rotas /api/v1. */
  private async porChave(
    req: RequisicaoComContexto,
    chave: string,
    alvos: Parameters<Reflector['getAllAndOverride']>[1],
  ): Promise<boolean> {
    if (!req.path.startsWith('/api/v1/'))
      this.recusar(
        'SEM_PERMISSAO',
        'Chave de API só vale nas rotas /api/v1.',
        req,
      );
    let c = this.chaves.get(chave);
    if (!c || c.ate < Date.now()) {
      const valor = await this.mensageria.enviar<ChaveValidada>(
        SERVICES.IDENTIDADE,
        PATTERNS.chavesApi.validar,
        { chave },
        { rastreioId: req.rastreioId! },
      );
      c = { valor, ate: Date.now() + 60_000 };
      this.chaves.set(chave, c);
    }
    if (!c.valor) this.recusar('NAO_AUTENTICADO', CHAVE_INVALIDA, req);
    const exigidas = this.reflector.getAllAndOverride<Permissao[] | undefined>(
      PERMISSAO_EXIGIDA,
      alvos,
    );
    if (
      exigidas?.length &&
      !exigidas.some((p) => PERMISSOES_DA_API.includes(p))
    )
      this.recusar('SEM_PERMISSAO', SEM_PERMISSAO, req);
    req.contexto = {
      empresaId: c.valor!.empresaId,
      usuarioId: null,
      rastreioId: req.rastreioId!,
    };
    req.permissoes = PERMISSOES_DA_API;
    req.recursos = c.valor!.recursos;
    req.usuarioNome = 'Integração (API)';
    return true;
  }

  async canActivate(execucao: ExecutionContext): Promise<boolean> {
    const alvos = [execucao.getHandler(), execucao.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, alvos))
      return true;

    const req = execucao.switchToHttp().getRequest<RequisicaoComContexto>();
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    const chave =
      (req.headers['x-api-key'] as string | undefined) ??
      (tipo === 'ApiKey' ? token : undefined);
    if (chave) return this.porChave(req, chave, alvos);
    if (tipo !== 'Bearer' || !token)
      this.recusar('NAO_AUTENTICADO', ENTRE_PARA_CONTINUAR, req);

    const conteudo = await conferirToken(token!);
    if (!conteudo) this.recusar('NAO_AUTENTICADO', SESSAO_EXPIRADA, req);
    // Sessão encerrada à força (sair, encerrar sessão, remover acesso…): recusa na hora
    if (this.revogacoes.revogada(conteudo!.sid))
      this.recusar('NAO_AUTENTICADO', SESSAO_EXPIRADA, req);

    // Senha inicial pendente: nada além de trocar a senha (vale também para quem chama a API direto)
    // Pendências (senha inicial, 2FA exigido pelo perfil): nada além de resolvê-las (vale também para quem chama a API direto)
    if (
      (conteudo!.dts || conteudo!.c2f) &&
      !this.reflector.getAllAndOverride<boolean>(LIBERADA_COM_PENDENCIA, alvos)
    ) {
      this.recusar(
        'SEM_PERMISSAO',
        conteudo!.dts ? TROQUE_A_SENHA : ATIVE_O_2FA,
        req,
      );
    }

    const exigidas = this.reflector.getAllAndOverride<Permissao[] | undefined>(
      PERMISSAO_EXIGIDA,
      alvos,
    );
    if (exigidas?.length && !exigidas.some((p) => conteudo!.per.includes(p)))
      this.recusar('SEM_PERMISSAO', SEM_PERMISSAO, req);

    req.recursos = conteudo!.rec ?? [...TODOS_OS_RECURSOS];
    const recurso = this.reflector.getAllAndOverride<Recurso | undefined>(
      RECURSO_EXIGIDO,
      alvos,
    );
    if (recurso && !req.recursos.includes(recurso))
      this.recusar(
        'SEM_PERMISSAO',
        `O recurso "${RECURSOS[recurso].nome}" está desligado nesta empresa. Ligue em Administração › Recursos do sistema.`,
        req,
      );

    req.contexto = {
      empresaId: conteudo!.emp,
      usuarioId: conteudo!.sub,
      rastreioId: req.rastreioId!,
    };
    req.permissoes = conteudo!.per;
    req.usuarioNome = conteudo!.nom;
    return true;
  }

  private recusar(
    codigo: 'NAO_AUTENTICADO' | 'SEM_PERMISSAO',
    mensagem: string,
    req: RequisicaoComContexto,
  ): never {
    throw new ErroDoServico({ codigo, mensagem, rastreioId: req.rastreioId });
  }
}
