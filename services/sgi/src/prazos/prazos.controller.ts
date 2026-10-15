import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { PrazosService } from './prazos.service.js';

/** Prazos deste serviço para o painel de vencimentos (serviço paineis). */
@Controller()
export class PrazosController {
  constructor(private readonly prazos: PrazosService) {}

  @MessagePattern(PATTERNS.prazos.sgi)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.prazos.prazos(ctx, dados);
  }
}
