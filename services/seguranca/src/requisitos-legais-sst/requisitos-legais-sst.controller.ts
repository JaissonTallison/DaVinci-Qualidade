import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { RequisitosLegaisSstService } from './requisitos-legais-sst.service.js';

const P = PATTERNS.requisitosSst;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Requisitos legais de SST, pela fila davinci.seguranca. */
@Controller()
export class RequisitosLegaisSstController {
  constructor(private readonly s: RequisitosLegaisSstService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listar(ctx, d);
  }
  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obter(ctx, d);
  }
  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criar(ctx, d);
  }
  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizar(ctx, d);
  }
  @MessagePattern(P.avaliar)
  avaliar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.avaliar(ctx, d);
  }
}
