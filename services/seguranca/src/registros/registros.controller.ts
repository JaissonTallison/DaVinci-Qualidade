import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { RegistrosService } from './registros.service.js';

const P = PATTERNS.registrosSst;

/** DDS, APR, CIPA e simulados pela fila davinci.seguranca. */
@Controller()
export class RegistrosController {
  constructor(private readonly registros: RegistrosService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.registros.listar(ctx, d);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.registros.obter(ctx, d);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.registros.criar(ctx, d);
  }

  @MessagePattern(P.anular)
  anular(
    @Contexto() ctx: Ctx,
    @Dados() d: { id?: unknown; alteracoes?: unknown },
  ) {
    return this.registros.anular(ctx, d);
  }

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.registros.resumo(ctx);
  }
}
