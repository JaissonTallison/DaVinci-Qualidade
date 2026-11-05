import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { AuditoriaSimplesService } from './auditoria-simples.service.js';

const P = PATTERNS.auditoriasSimples;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Auditoria interna simples, pela fila davinci.auditorias. Toda regra está no service. */
@Controller()
export class AuditoriaSimplesController {
  constructor(private readonly s: AuditoriaSimplesService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx) {
    return this.s.listar(ctx);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obter(ctx, d);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criar(ctx, d);
  }

  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizar(ctx, d);
  }

  @MessagePattern(P.excluir)
  excluir(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.excluir(ctx, d);
  }
}
