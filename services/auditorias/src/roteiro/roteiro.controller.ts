import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { RoteiroService } from './roteiro.service.js';

const P = PATTERNS.auditorias;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Roteiros de entrevista pela fila davinci.auditorias. */
@Controller()
export class RoteiroController {
  constructor(private readonly s: RoteiroService) {}

  @MessagePattern(P.listarPerguntas)
  listarPerguntas(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listarPerguntas(ctx, d);
  }

  @MessagePattern(P.criarPerguntaPropria)
  criarPropria(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarPropria(ctx, d);
  }

  @MessagePattern(P.excluirPerguntaPropria)
  excluirPropria(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.excluirPropria(ctx, d);
  }

  @MessagePattern(P.obterRoteiro)
  obterRoteiro(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterRoteiro(ctx, d);
  }

  @MessagePattern(P.selecionarPerguntas)
  selecionar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.selecionar(ctx, d);
  }

  @MessagePattern(P.responderPergunta)
  responder(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.responder(ctx, d);
  }
}
