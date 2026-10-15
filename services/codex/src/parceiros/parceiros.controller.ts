import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { ParceirosService } from './parceiros.service.js';

/** Mensagens de parceiros recebidas pela fila davinci.codex. Toda regra está no service. */
@Controller()
export class ParceirosController {
  constructor(private readonly parceiros: ParceirosService) {}

  @MessagePattern(PATTERNS.parceiros.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.parceiros.listar(ctx, dados);
  }

  @MessagePattern(PATTERNS.parceiros.obter)
  obter(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.parceiros.obter(ctx, dados);
  }

  @MessagePattern(PATTERNS.parceiros.criar)
  criar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.parceiros.criar(ctx, dados);
  }

  @MessagePattern(PATTERNS.parceiros.atualizar)
  atualizar(
    @Contexto() ctx: Ctx,
    @Dados() dados: { id?: unknown; alteracoes?: unknown },
  ) {
    return this.parceiros.atualizar(ctx, dados);
  }

  @MessagePattern(PATTERNS.parceiros.inativar)
  inativar(
    @Contexto() ctx: Ctx,
    @Dados() dados: { id?: unknown; motivo?: unknown; versao?: unknown },
  ) {
    return this.parceiros.inativar(ctx, dados);
  }

  @MessagePattern(PATTERNS.parceiros.consumidorFinal)
  consumidorFinal(@Contexto() ctx: Ctx) {
    return this.parceiros.consumidorFinal(ctx);
  }

  @MessagePattern(PATTERNS.parceiros.garantir)
  garantir(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.parceiros.garantir(ctx, dados);
  }

  @MessagePattern(PATTERNS.parceiros.importar)
  importar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.parceiros.importar(ctx, dados);
  }

  @MessagePattern(PATTERNS.parceiros.reativar)
  reativar(
    @Contexto() ctx: Ctx,
    @Dados() dados: { id?: unknown; versao?: unknown },
  ) {
    return this.parceiros.reativar(ctx, dados);
  }
}
