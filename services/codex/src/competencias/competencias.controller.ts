import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { CompetenciasService } from './competencias.service.js';

const P = PATTERNS.competencias;

/** Competências por função (treinamentos e ASO), pela fila davinci.codex. */
@Controller()
export class CompetenciasController {
  constructor(private readonly s: CompetenciasService) {}

  @MessagePattern(P.treinamentosDaFuncao)
  daFuncao(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.treinamentosDaFuncao(ctx, d);
  }

  @MessagePattern(P.definirTreinamentos)
  definir(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.definirTreinamentos(ctx, d);
  }

  @MessagePattern(P.conformidadeTreinamentos)
  conformidade(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.conformidade(ctx, d);
  }

  @MessagePattern(P.matrizTreinamentos)
  matriz(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.matriz(ctx, d);
  }
}
