import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { ContaService } from './conta.service.js';

/** Segurança da própria conta: o usuário do contexto (token) é sempre o dono. */
@Controller()
export class ContaController {
  constructor(private readonly conta: ContaService) {}

  @MessagePattern(PATTERNS.identidade.seguranca)
  seguranca(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.conta.seguranca(ctx, dados);
  }

  @MessagePattern(PATTERNS.identidade.iniciar2fa)
  iniciar2fa(@Contexto() ctx: Ctx) {
    return this.conta.iniciar2fa(ctx);
  }

  @MessagePattern(PATTERNS.identidade.confirmar2fa)
  confirmar2fa(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.conta.confirmar2fa(ctx, dados);
  }

  @MessagePattern(PATTERNS.identidade.desativar2fa)
  desativar2fa(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.conta.desativar2fa(ctx, dados);
  }

  @MessagePattern(PATTERNS.identidade.novosCodigos)
  novosCodigos(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.conta.novosCodigos(ctx, dados);
  }

  @MessagePattern(PATTERNS.identidade.encerrarSessao)
  encerrarSessao(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.conta.encerrarSessao(ctx, dados);
  }

  @MessagePattern(PATTERNS.identidade.encerrarOutras)
  encerrarOutras(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.conta.encerrarOutras(ctx, dados);
  }

  @MessagePattern(PATTERNS.identidade.esquecerNavegadores)
  esquecerNavegadores(@Contexto() ctx: Ctx) {
    return this.conta.esquecerNavegadores(ctx);
  }
}
