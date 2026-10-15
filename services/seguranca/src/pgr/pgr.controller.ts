import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { PgrService } from './pgr.service.js';

const P = PATTERNS.riscos;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens pela fila davinci.seguranca. Toda regra está no service. */
@Controller()
export class PgrController {
  constructor(private readonly pgr: PgrService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.pgr.listar(ctx, d);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.pgr.obter(ctx, d);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.pgr.criar(ctx, d);
  }

  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.pgr.atualizar(ctx, d);
  }

  @MessagePattern(P.mudarSituacao)
  mudarSituacao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.pgr.mudarSituacao(ctx, d);
  }

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.pgr.resumo(ctx);
  }
}
