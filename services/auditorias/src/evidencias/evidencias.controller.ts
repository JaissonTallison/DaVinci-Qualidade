import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { EvidenciasService } from './evidencias.service.js';

const P = PATTERNS.auditorias;

/** Biblioteca de evidências pela fila davinci.auditorias. */
@Controller()
export class EvidenciasController {
  constructor(private readonly s: EvidenciasService) {}

  @MessagePattern(P.listarEvidencias)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listar(ctx, d);
  }

  @MessagePattern(P.criarEvidenciaPropria)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarPropria(ctx, d);
  }

  @MessagePattern(P.excluirEvidenciaPropria)
  excluir(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.excluirPropria(ctx, d);
  }
}
