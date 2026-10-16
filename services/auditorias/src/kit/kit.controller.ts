import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { KitService } from './kit.service.js';

const P = PATTERNS.auditorias;

/** Kit pré-auditoria pela fila davinci.auditorias. */
@Controller()
export class KitController {
  constructor(private readonly kit: KitService) {}

  @MessagePattern(P.obterKit)
  obter(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.kit.obter(ctx, d);
  }

  @MessagePattern(P.marcarItemDoKit)
  marcar(
    @Contexto() ctx: Ctx,
    @Dados() d: { id?: unknown; alteracoes?: unknown },
  ) {
    return this.kit.marcar(ctx, d);
  }
}
