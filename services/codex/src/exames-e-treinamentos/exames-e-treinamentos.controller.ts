import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { ExamesETreinamentosService } from './exames-e-treinamentos.service.js';

type ComId = { id?: unknown; alteracoes?: unknown };

/** ASO, treinamentos e vencimentos, pela fila davinci.codex. Toda regra está no service. */
@Controller()
export class ExamesETreinamentosController {
  constructor(private readonly s: ExamesETreinamentosService) {}

  @MessagePattern(PATTERNS.asos.paraEsocial)
  asosParaEsocial(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.asosParaEsocial(ctx, d);
  }

  @MessagePattern(PATTERNS.treinamentos.turmas)
  turmas(@Contexto() ctx: Ctx) {
    return this.s.turmas(ctx);
  }

  @MessagePattern(PATTERNS.treinamentos.turma)
  turma(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.turma(ctx, d);
  }

  @MessagePattern(PATTERNS.asos.listar)
  listarAsos(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listarAsos(ctx, d);
  }

  @MessagePattern(PATTERNS.asos.registrar)
  registrarAso(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.registrarAso(ctx, d);
  }

  @MessagePattern(PATTERNS.asos.anular)
  anularAso(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.anularAso(ctx, d);
  }

  @MessagePattern(PATTERNS.treinamentos.listar)
  listarTreinamentos(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listarTreinamentos(ctx, d);
  }

  @MessagePattern(PATTERNS.treinamentos.criar)
  criarTreinamento(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarTreinamento(ctx, d);
  }

  @MessagePattern(PATTERNS.treinamentos.atualizar)
  atualizarTreinamento(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarTreinamento(ctx, d);
  }

  @MessagePattern(PATTERNS.treinamentos.mudarSituacao)
  mudarSituacao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.mudarSituacaoDoTreinamento(ctx, d);
  }

  @MessagePattern(PATTERNS.treinamentos.realizados)
  realizados(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.realizados(ctx, d);
  }

  @MessagePattern(PATTERNS.treinamentos.registrarTurma)
  registrarTurma(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.registrarTurma(ctx, d);
  }

  @MessagePattern(PATTERNS.treinamentos.anularRealizado)
  anularRealizado(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.anularRealizado(ctx, d);
  }

  @MessagePattern(PATTERNS.vencimentos.listar)
  vencimentos(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.vencimentos(ctx, d);
  }

  @MessagePattern(PATTERNS.vencimentos.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.s.resumo(ctx);
  }
}
