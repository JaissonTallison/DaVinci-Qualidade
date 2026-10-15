import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { TerceirosService } from './terceiros.service.js';

const P = PATTERNS.terceiros;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Terceiros pela fila davinci.seguranca. */
@Controller()
export class TerceirosController {
  constructor(private readonly terceiros: TerceirosService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.terceiros.listar(ctx, d);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.terceiros.obter(ctx, d);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.terceiros.criar(ctx, d);
  }

  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.terceiros.atualizar(ctx, d);
  }

  @MessagePattern(P.registrarDocumento)
  registrarDocumento(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.terceiros.registrarDocumento(ctx, d);
  }

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.terceiros.resumo(ctx);
  }
}
