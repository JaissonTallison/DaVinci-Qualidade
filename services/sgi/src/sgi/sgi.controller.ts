import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { SgiService } from './sgi.service.js';

const P = PATTERNS.sgi;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens da Gestão do SGI pela fila davinci.sgi. Toda regra está no service. */
@Controller()
export class SgiController {
  constructor(private readonly sgi: SgiService) {}

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.sgi.resumo(ctx);
  }

  @MessagePattern(P.listarRos)
  listarRos(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.sgi.listarRos(ctx, d);
  }

  @MessagePattern(P.obterRo)
  obterRo(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.sgi.obterRo(ctx, d);
  }

  @MessagePattern(P.criarRo)
  criarRo(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.sgi.criarRo(ctx, d);
  }

  @MessagePattern(P.atualizarRo)
  atualizarRo(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.sgi.atualizarRo(ctx, d);
  }

  @MessagePattern(P.encerrarRo)
  encerrarRo(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.sgi.encerrarRo(ctx, d);
  }

  @MessagePattern(P.listarObjetivos)
  listarObjetivos(@Contexto() ctx: Ctx) {
    return this.sgi.listarObjetivos(ctx);
  }

  @MessagePattern(P.criarObjetivo)
  criarObjetivo(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.sgi.criarObjetivo(ctx, d);
  }

  @MessagePattern(P.atualizarObjetivo)
  atualizarObjetivo(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.sgi.atualizarObjetivo(ctx, d);
  }

  @MessagePattern(P.situacaoObjetivo)
  situacaoObjetivo(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.sgi.situacaoObjetivo(ctx, d);
  }

  @MessagePattern(P.registrarMedicao)
  registrarMedicao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.sgi.registrarMedicao(ctx, d);
  }

  @MessagePattern(P.listarAnalises)
  listarAnalises(@Contexto() ctx: Ctx) {
    return this.sgi.listarAnalises(ctx);
  }

  @MessagePattern(P.obterAnalise)
  obterAnalise(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.sgi.obterAnalise(ctx, d);
  }

  @MessagePattern(P.criarAnalise)
  criarAnalise(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.sgi.criarAnalise(ctx, d);
  }

  @MessagePattern(P.listarMudancas)
  listarMudancas(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.sgi.listarMudancas(ctx, d);
  }

  @MessagePattern(P.obterMudanca)
  obterMudanca(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.sgi.obterMudanca(ctx, d);
  }

  @MessagePattern(P.criarMudanca)
  criarMudanca(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.sgi.criarMudanca(ctx, d);
  }

  @MessagePattern(P.decidirMudanca)
  decidirMudanca(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.sgi.decidirMudanca(ctx, d);
  }

  @MessagePattern(P.implementarMudanca)
  implementarMudanca(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.sgi.implementarMudanca(ctx, d);
  }
}
