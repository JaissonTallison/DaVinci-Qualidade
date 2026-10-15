import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { AmbientalService } from './ambiental.service.js';

const P = PATTERNS.ambiental;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens de Meio Ambiente pela fila davinci.ambiental. Toda regra está no service. */
@Controller()
export class AmbientalController {
  constructor(private readonly s: AmbientalService) {}

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.s.resumo(ctx);
  }

  @MessagePattern(P.listarAspectos)
  listarAspectos(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listarAspectos(ctx, d);
  }

  @MessagePattern(P.obterAspecto)
  obterAspecto(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterAspecto(ctx, d);
  }

  @MessagePattern(P.criarAspecto)
  criarAspecto(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarAspecto(ctx, d);
  }

  @MessagePattern(P.atualizarAspecto)
  atualizarAspecto(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarAspecto(ctx, d);
  }

  @MessagePattern(P.situacaoAspecto)
  situacaoAspecto(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.situacaoAspecto(ctx, d);
  }

  @MessagePattern(P.listarRequisitos)
  listarRequisitos(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listarRequisitos(ctx, d);
  }

  @MessagePattern(P.obterRequisito)
  obterRequisito(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterRequisito(ctx, d);
  }

  @MessagePattern(P.criarRequisito)
  criarRequisito(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarRequisito(ctx, d);
  }

  @MessagePattern(P.atualizarRequisito)
  atualizarRequisito(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarRequisito(ctx, d);
  }

  @MessagePattern(P.avaliarRequisito)
  avaliarRequisito(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.avaliarRequisito(ctx, d);
  }

  @MessagePattern(P.listarLicencas)
  listarLicencas(@Contexto() ctx: Ctx) {
    return this.s.listarLicencas(ctx);
  }

  @MessagePattern(P.obterLicenca)
  obterLicenca(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterLicenca(ctx, d);
  }

  @MessagePattern(P.criarLicenca)
  criarLicenca(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarLicenca(ctx, d);
  }

  @MessagePattern(P.renovacaoSolicitada)
  renovacaoSolicitada(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.renovacaoSolicitada(ctx, d);
  }

  @MessagePattern(P.criarCondicionante)
  criarCondicionante(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.criarCondicionante(ctx, d);
  }

  @MessagePattern(P.cumprirCondicionante)
  cumprirCondicionante(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.cumprirCondicionante(ctx, d);
  }

  @MessagePattern(P.listarResiduos)
  listarResiduos(@Contexto() ctx: Ctx) {
    return this.s.listarResiduos(ctx);
  }

  @MessagePattern(P.criarResiduo)
  criarResiduo(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarResiduo(ctx, d);
  }

  @MessagePattern(P.atualizarResiduo)
  atualizarResiduo(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarResiduo(ctx, d);
  }

  @MessagePattern(P.listarSaidas)
  listarSaidas(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listarSaidas(ctx, d);
  }

  @MessagePattern(P.registrarSaida)
  registrarSaida(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.registrarSaida(ctx, d);
  }

  @MessagePattern(P.registrarCdf)
  registrarCdf(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.registrarCdf(ctx, d);
  }
}
