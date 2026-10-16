import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { CompetenciasEpisService } from './competencias.service.js';

const P = PATTERNS.competencias;

/** EPIs exigidos por função, pela fila davinci.seguranca. */
@Controller()
export class CompetenciasController {
  constructor(private readonly s: CompetenciasEpisService) {}

  @MessagePattern(P.episDaFuncao)
  daFuncao(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.episDaFuncao(ctx, d);
  }

  @MessagePattern(P.definirEpis)
  definir(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.definirEpis(ctx, d);
  }

  @MessagePattern(P.conformidadeEpis)
  conformidade(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.conformidade(ctx, d);
  }

  @MessagePattern(P.riscosDaFuncao)
  riscosDaFuncao(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.riscosDaFuncao(ctx, d);
  }

  @MessagePattern(P.definirRiscos)
  definirRiscos(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.definirRiscos(ctx, d);
  }

  @MessagePattern(P.matrizEpis)
  matriz(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.matriz(ctx, d);
  }
}
