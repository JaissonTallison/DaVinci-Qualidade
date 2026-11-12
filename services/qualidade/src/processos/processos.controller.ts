import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { ProcessosService } from './processos.service.js';

const P = PATTERNS.processos;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens de modelagem de processos pela fila davinci.qualidade. Toda regra está no service. */
@Controller()
export class ProcessosController {
  constructor(private readonly processos: ProcessosService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.processos.listar(ctx, d);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.processos.obter(ctx, d);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.processos.criar(ctx, d);
  }

  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.processos.atualizar(ctx, d);
  }

  @MessagePattern(P.enviarRevisao)
  enviarRevisao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.processos.enviarRevisao(ctx, d);
  }

  @MessagePattern(P.aprovar)
  aprovar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.processos.aprovar(ctx, d);
  }

  @MessagePattern(P.publicar)
  publicar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.processos.publicar(ctx, d);
  }

  @MessagePattern(P.novaRevisao)
  novaRevisao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.processos.novaRevisao(ctx, d);
  }

  @MessagePattern(P.encerrar)
  encerrar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.processos.encerrar(ctx, d);
  }

  @MessagePattern(P.cancelar)
  cancelar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.processos.cancelar(ctx, d);
  }

  @MessagePattern(P.salvarDiagrama)
  salvarDiagrama(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.processos.salvarDiagrama(ctx, d);
  }
}
