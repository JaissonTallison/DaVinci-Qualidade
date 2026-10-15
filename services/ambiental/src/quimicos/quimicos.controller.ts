import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { QuimicosService } from './quimicos.service.js';

const P = PATTERNS.ambiental;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Produtos químicos pela fila davinci.ambiental. Toda regra está no service. */
@Controller()
export class QuimicosController {
  constructor(private readonly s: QuimicosService) {}

  @MessagePattern(P.listarProdutos)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listar(ctx, d);
  }

  @MessagePattern(P.obterProduto)
  obter(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obter(ctx, d);
  }

  @MessagePattern(P.criarProduto)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criar(ctx, d);
  }

  @MessagePattern(P.atualizarProduto)
  atualizar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizar(ctx, d);
  }

  @MessagePattern(P.situacaoProduto)
  situacao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.situacao(ctx, d);
  }
}
