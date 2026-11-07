import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { ProgramacaoService } from './programacao.service.js';

const P = PATTERNS.auditorias;

/** Programação anual de auditorias, pela fila davinci.auditorias. */
@Controller()
export class ProgramacaoController {
  constructor(private readonly s: ProgramacaoService) {}

  @MessagePattern(P.listarProgramacao)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listar(ctx, d);
  }

  @MessagePattern(P.obterItemProgramacao)
  obter(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obter(ctx, d);
  }

  @MessagePattern(P.criarItemProgramacao)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criar(ctx, d);
  }

  @MessagePattern(P.atualizarItemProgramacao)
  atualizar(
    @Contexto() ctx: Ctx,
    @Dados() d: { id?: unknown; alteracoes?: unknown },
  ) {
    return this.s.atualizar(ctx, d);
  }

  @MessagePattern(P.excluirItemProgramacao)
  excluir(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.excluir(ctx, d);
  }
}
