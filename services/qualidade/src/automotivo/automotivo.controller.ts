import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { AutomotivoService } from './automotivo.service.js';

const P = PATTERNS.automotivo;
type ComId = { id?: unknown; alteracoes?: unknown };

/** FMEA, plano de controle e PPAP pela fila davinci.qualidade. Toda regra está no service. */
@Controller()
export class AutomotivoController {
  constructor(private readonly s: AutomotivoService) {}

  @MessagePattern(P.listarFmeas)
  listarFmeas(@Contexto() ctx: Ctx) {
    return this.s.listarFmeas(ctx);
  }
  @MessagePattern(P.obterFmea)
  obterFmea(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterFmea(ctx, d);
  }
  @MessagePattern(P.criarFmea)
  criarFmea(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarFmea(ctx, d);
  }
  @MessagePattern(P.atualizarFmea)
  atualizarFmea(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarFmea(ctx, d);
  }

  @MessagePattern(P.listarPlanos)
  listarPlanos(@Contexto() ctx: Ctx) {
    return this.s.listarPlanos(ctx);
  }
  @MessagePattern(P.obterPlano)
  obterPlano(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterPlano(ctx, d);
  }
  @MessagePattern(P.criarPlano)
  criarPlano(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarPlano(ctx, d);
  }
  @MessagePattern(P.atualizarPlano)
  atualizarPlano(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarPlano(ctx, d);
  }

  @MessagePattern(P.listarPpaps)
  listarPpaps(@Contexto() ctx: Ctx) {
    return this.s.listarPpaps(ctx);
  }
  @MessagePattern(P.obterPpap)
  obterPpap(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterPpap(ctx, d);
  }
  @MessagePattern(P.criarPpap)
  criarPpap(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarPpap(ctx, d);
  }
  @MessagePattern(P.atualizarPpap)
  atualizarPpap(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarPpap(ctx, d);
  }
  @MessagePattern(P.submeterPpap)
  submeterPpap(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.submeterPpap(ctx, d);
  }
  @MessagePattern(P.decidirPpap)
  decidirPpap(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.decidirPpap(ctx, d);
  }
}
