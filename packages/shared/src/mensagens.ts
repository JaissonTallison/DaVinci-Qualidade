import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { ehContexto, type Contexto as ContextoMensagem } from '@davinci/types';
import { ErroDeNegocio } from './erros.js';

/** Lê e valida o contexto de uma mensagem `{ contexto, dados }`. */
export function lerContexto(mensagem: unknown): ContextoMensagem {
  const contexto = (mensagem as { contexto?: unknown } | null)?.contexto;
  if (!ehContexto(contexto)) {
    throw new ErroDeNegocio(
      'DADOS_INVALIDOS',
      'Mensagem sem contexto válido (empresa e rastreio são obrigatórios).',
    );
  }
  return contexto;
}

/**
 * Nos handlers dos serviços:
 *   @MessagePattern(PATTERNS.parceiros.criar)
 *   criar(@Contexto() ctx: ContextoMensagem, @Dados() dados: NovoParceiro) { … }
 */
export const Contexto = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    lerContexto(ctx.switchToRpc().getData()),
);

export const Dados = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    (ctx.switchToRpc().getData() as { dados?: unknown } | null)?.dados,
);
