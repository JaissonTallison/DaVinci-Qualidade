import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { MonitoramentosService } from './monitoramentos.service.js';

const P = PATTERNS.ambiental;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Monitoramentos pela fila davinci.ambiental. Toda regra está no service. */
@Controller()
export class MonitoramentosController {
  constructor(private readonly s: MonitoramentosService) {}

  @MessagePattern(P.listarMonitoramentos)
  listar(@Contexto() ctx: Ctx, @Dados() d: { situacao?: unknown }) {
    return this.s.listar(ctx, d);
  }

  @MessagePattern(P.obterMonitoramento)
  obter(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obter(ctx, d);
  }

  @MessagePattern(P.criarMonitoramento)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criar(ctx, d);
  }

  @MessagePattern(P.atualizarMonitoramento)
  atualizar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizar(ctx, d);
  }

  @MessagePattern(P.situacaoMonitoramento)
  situacao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.situacao(ctx, d);
  }

  @MessagePattern(P.registrarResultado)
  registrarResultado(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.registrarResultado(ctx, d);
  }
}
