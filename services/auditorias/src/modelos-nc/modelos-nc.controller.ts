import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { ModelosNcService } from './modelos-nc.service.js';

const P = PATTERNS.auditorias;

/** Banco de NCs e prompts de IA pela fila davinci.auditorias. */
@Controller()
export class ModelosNcController {
  constructor(private readonly s: ModelosNcService) {}

  @MessagePattern(P.listarModelosNc)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listar(ctx, d);
  }

  @MessagePattern(P.criarModeloNcProprio)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarProprio(ctx, d);
  }

  @MessagePattern(P.excluirModeloNcProprio)
  excluir(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.excluirProprio(ctx, d);
  }

  @MessagePattern(P.listarPrompts)
  listarPrompts(@Dados() d: unknown) {
    return this.s.listarPrompts(d);
  }
}
