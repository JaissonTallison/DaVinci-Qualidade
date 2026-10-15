import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { EpisService } from './epis.service.js';

const P = PATTERNS.epis;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens de EPIs recebidas pela fila davinci.seguranca. Toda regra está no service. */
@Controller()
export class EpisController {
  constructor(private readonly epis: EpisService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.epis.listar(ctx, dados);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.epis.obter(ctx, dados);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.epis.criar(ctx, dados);
  }

  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.epis.atualizar(ctx, dados);
  }

  @MessagePattern(P.mudarSituacao)
  mudarSituacao(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.epis.mudarSituacao(ctx, dados);
  }

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.epis.resumo(ctx);
  }

  @MessagePattern(P.listarEntregas)
  listarEntregas(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.epis.listarEntregas(ctx, dados);
  }

  @MessagePattern(P.registrarEntrega)
  registrarEntrega(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.epis.registrarEntrega(ctx, dados);
  }

  @MessagePattern(P.devolver)
  devolver(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.epis.devolver(ctx, dados);
  }

  @MessagePattern(P.anular)
  anular(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.epis.anular(ctx, dados);
  }
}
