import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { PtsService } from './pts.service.js';

const P = PATTERNS.pts;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens pela fila davinci.seguranca. Toda regra está no service. */
@Controller()
export class PtsController {
  constructor(private readonly pts: PtsService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.pts.listar(ctx, d);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.pts.obter(ctx, d);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.pts.criar(ctx, d);
  }

  @MessagePattern(P.liberar)
  liberar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.pts.liberar(ctx, d);
  }

  @MessagePattern(P.encerrar)
  encerrar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.pts.encerrar(ctx, d);
  }

  @MessagePattern(P.cancelar)
  cancelar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.pts.cancelar(ctx, d);
  }

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.pts.resumo(ctx);
  }
}
