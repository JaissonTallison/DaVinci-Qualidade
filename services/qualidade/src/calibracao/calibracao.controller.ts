import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { CalibracaoService } from './calibracao.service.js';

const P = PATTERNS.calibracao;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens de instrumentos e calibrações recebidas pela fila davinci.qualidade. Toda regra está no service. */
@Controller()
export class CalibracaoController {
  constructor(private readonly calibracao: CalibracaoService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.calibracao.listar(ctx, dados);
  }

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.calibracao.resumo(ctx);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.calibracao.obter(ctx, dados);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.calibracao.criar(ctx, dados);
  }

  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.calibracao.atualizar(ctx, dados);
  }

  @MessagePattern(P.mudarUso)
  mudarUso(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.calibracao.mudarUso(ctx, dados);
  }

  @MessagePattern(P.registrar)
  registrar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.calibracao.registrar(ctx, dados);
  }

  @MessagePattern(P.anular)
  anular(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.calibracao.anular(ctx, dados);
  }
}
