import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { PaineisService } from './paineis.service.js';

/** Painel de vencimentos e envio manual dos avisos, pela fila davinci.paineis. */
@Controller()
export class PaineisController {
  constructor(private readonly paineis: PaineisService) {}

  @MessagePattern(PATTERNS.paineis.buscar)
  buscar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.paineis.buscar(ctx, dados);
  }

  @MessagePattern(PATTERNS.paineis.vencimentos)
  vencimentos(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.paineis.vencimentos(ctx, dados);
  }

  /** Manual: só a empresa de quem pediu. */
  @MessagePattern(PATTERNS.paineis.enviarAvisos)
  enviarAvisos(@Contexto() ctx: Ctx) {
    return this.paineis.enviarAvisos(ctx.empresaId);
  }
}
