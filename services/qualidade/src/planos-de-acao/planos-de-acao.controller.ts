import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { PlanosDeAcaoService } from './planos-de-acao.service.js';

const P = PATTERNS.planosDeAcao;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens de planos de ação recebidas pela fila davinci.qualidade. Toda regra está no service. */
@Controller()
export class PlanosDeAcaoController {
  constructor(private readonly planos: PlanosDeAcaoService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.planos.listar(ctx, dados);
  }

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.planos.resumo(ctx);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.planos.obter(ctx, dados);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.planos.criar(ctx, dados);
  }

  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.planos.atualizar(ctx, dados);
  }

  @MessagePattern(P.incluirTarefa)
  incluirTarefa(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.planos.incluirTarefa(ctx, dados);
  }

  @MessagePattern(P.concluirTarefa)
  concluirTarefa(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.planos.concluirTarefa(ctx, dados);
  }

  @MessagePattern(P.reabrirTarefa)
  reabrirTarefa(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.planos.reabrirTarefa(ctx, dados);
  }

  @MessagePattern(P.cancelarTarefa)
  cancelarTarefa(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.planos.cancelarTarefa(ctx, dados);
  }

  @MessagePattern(P.verificarEficacia)
  verificarEficacia(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.planos.verificarEficacia(ctx, dados);
  }

  @MessagePattern(P.cancelar)
  cancelar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.planos.cancelar(ctx, dados);
  }
}
