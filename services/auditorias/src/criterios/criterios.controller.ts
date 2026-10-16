import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { CriteriosService } from './criterios.service.js';

const P = PATTERNS.auditorias;

/** Critérios próprios pela fila davinci.auditorias. */
@Controller()
export class CriteriosController {
  constructor(private readonly s: CriteriosService) {}

  @MessagePattern(P.listarCriterios)
  listar(@Contexto() ctx: Ctx) {
    return this.s.listar(ctx);
  }

  @MessagePattern(P.criarCriterio)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criar(ctx, d);
  }

  @MessagePattern(P.excluirCriterio)
  excluir(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.excluir(ctx, d);
  }
}
