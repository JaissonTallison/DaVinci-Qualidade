import {
  createParamDecorator,
  Injectable,
  type ExecutionContext,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  isUuid,
  uuidv7,
  type Contexto,
  type OrigemDoAcesso,
  type Permissao,
  type Recurso,
} from '@davinci/types';
import { ErroDoServico } from './mensageria.service.js';

export const CABECALHO_RASTREIO = 'x-rastreio-id';

export type RequisicaoComContexto = Request & {
  rastreioId?: string;
  /** Preenchido pela GuardaDeAcesso a partir do token (rotas com login). */
  contexto?: Contexto;
  permissoes?: Permissao[];
  /** Nome de quem está logado (do token), para registros como "pedido por". */
  usuarioNome?: string;
  /** A122: recursos ligados na empresa (do token; ausente no token = todos). */
  recursos?: Recurso[];
};

/** Rastreio informado pelo cliente (se for um UUID válido) ou um novo. */
export function lerRastreio(headers: Request['headers']): string {
  const valor = headers[CABECALHO_RASTREIO];
  const rastreio = Array.isArray(valor) ? valor[0] : valor;
  return isUuid(rastreio) ? rastreio : uuidv7();
}

/** Toda requisição ganha um rastreio, devolvido no cabeçalho da resposta. */
@Injectable()
export class ContextoMiddleware implements NestMiddleware {
  use(req: RequisicaoComContexto, res: Response, next: NextFunction): void {
    req.rastreioId = lerRastreio(req.headers);
    res.setHeader(CABECALHO_RASTREIO, req.rastreioId);
    next();
  }
}

/** Nas rotas com login: `listar(@ContextoHttp() ctx: Contexto)` (empresa e usuário do token). */
export const ContextoHttp = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Contexto => {
    const req = ctx.switchToHttp().getRequest<RequisicaoComContexto>();
    if (!req.contexto)
      throw new ErroDoServico({
        codigo: 'NAO_AUTENTICADO',
        mensagem: 'Entre para continuar.',
        rastreioId: req.rastreioId,
      });
    return req.contexto;
  },
);

/** Nome e permissões de quem está logado (rotas com login). */
export const UsuarioHttp = createParamDecorator(
  (
    _: unknown,
    ctx: ExecutionContext,
  ): { nome: string; permissoes: Permissao[]; recursos: Recurso[] } => {
    const req = ctx.switchToHttp().getRequest<RequisicaoComContexto>();
    return {
      nome: req.usuarioNome ?? '',
      permissoes: req.permissoes ?? [],
      recursos: req.recursos ?? [],
    };
  },
);

/** Nas rotas públicas: só o rastreio (não há empresa nem usuário ainda). */
export const RastreioHttp = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<RequisicaoComContexto>();
    return req.rastreioId ?? lerRastreio(req.headers);
  },
);

/** Cabeçalho com o IP do visitante: quem fala com o gateway é o servidor do web, que repassa o IP real. */
export const CABECALHO_IP = 'x-davinci-ip';

/** Origem do acesso (IP e navegador), para o histórico e a lista de sessões. */
export const OrigemHttp = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): OrigemDoAcesso => {
    const req = ctx.switchToHttp().getRequest<RequisicaoComContexto>();
    const primeiro = (v: string | string[] | undefined) =>
      (Array.isArray(v) ? v[0] : v)?.trim() || null;
    const ip =
      primeiro(req.headers[CABECALHO_IP])?.split(',')[0]?.trim() ?? null;
    return {
      ip: ip && /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip : null,
      navegador: primeiro(req.headers['user-agent'])?.slice(0, 300) ?? null,
    };
  },
);
