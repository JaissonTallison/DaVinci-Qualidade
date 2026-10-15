import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { TemasService } from './temas.service.js';

const P = PATTERNS.esg;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens da Agenda ESG pela fila davinci.esg. Toda regra está no service. */
@Controller()
export class TemasController {
  constructor(private readonly s: TemasService) {}

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.s.resumo(ctx);
  }

  @MessagePattern(P.listarTemas)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listar(ctx, d);
  }

  @MessagePattern(P.obterTema)
  obter(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obter(ctx, d);
  }

  @MessagePattern(P.criarTema)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criar(ctx, d);
  }

  @MessagePattern(P.atualizarTema)
  atualizar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizar(ctx, d);
  }

  @MessagePattern(P.situacaoTema)
  situacao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.situacao(ctx, d);
  }

  @MessagePattern(P.importarCatalogo)
  importarCatalogo(@Contexto() ctx: Ctx) {
    return this.s.importarCatalogo(ctx);
  }

  @MessagePattern(P.registrarAndamento)
  registrarAndamento(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.registrarAndamento(ctx, d);
  }
}
