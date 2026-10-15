import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { AuditoriasService } from './auditorias.service.js';

const P = PATTERNS.auditorias;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens de auditorias recebidas pela fila davinci.auditorias. Toda regra está no service. */
@Controller()
export class AuditoriasController {
  constructor(private readonly auditorias: AuditoriasService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.auditorias.listar(ctx, dados);
  }

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.auditorias.resumo(ctx);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.auditorias.obter(ctx, dados);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.auditorias.criar(ctx, dados);
  }

  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.auditorias.atualizar(ctx, dados);
  }

  @MessagePattern(P.iniciar)
  iniciar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.auditorias.iniciar(ctx, dados);
  }

  @MessagePattern(P.registrarConstatacao)
  registrarConstatacao(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.auditorias.registrarConstatacao(ctx, dados);
  }

  @MessagePattern(P.alterarConstatacao)
  alterarConstatacao(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.auditorias.alterarConstatacao(ctx, dados);
  }

  @MessagePattern(P.formalizarNc)
  formalizarNc(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.auditorias.formalizarNc(ctx, dados);
  }

  @MessagePattern(P.concluir)
  concluir(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.auditorias.concluir(ctx, dados);
  }

  @MessagePattern(P.cancelar)
  cancelar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.auditorias.cancelar(ctx, dados);
  }
}
