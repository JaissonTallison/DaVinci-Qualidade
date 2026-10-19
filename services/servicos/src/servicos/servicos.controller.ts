import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { ServicosService } from './servicos.service.js';

const P = PATTERNS.servicos;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens de Serviços pela fila davinci.servicos. */
@Controller()
export class ServicosController {
  constructor(private readonly s: ServicosService) {}

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.s.resumo(ctx);
  }

  @MessagePattern(P.listarOs)
  listarOs(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listarOs(ctx, d);
  }

  @MessagePattern(P.atribuirResponsavelOsEmLote)
  atribuirResponsavelOsEmLote(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.atribuirResponsavelOsEmLote(ctx, d);
  }

  @MessagePattern(P.obterOs)
  obterOs(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterOs(ctx, d);
  }

  @MessagePattern(P.criarOs)
  criarOs(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarOs(ctx, d);
  }

  @MessagePattern(P.iniciarOs)
  iniciarOs(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.iniciarOs(ctx, d);
  }

  @MessagePattern(P.concluirOs)
  concluirOs(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.concluirOs(ctx, d);
  }

  @MessagePattern(P.cancelarOs)
  cancelarOs(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.cancelarOs(ctx, d);
  }

  @MessagePattern(P.avaliarOs)
  avaliarOs(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.avaliarOs(ctx, d);
  }

  @MessagePattern(P.listarNps)
  listarNps(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listarNps(ctx, d);
  }

  @MessagePattern(P.registrarNps)
  registrarNps(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.registrarNps(ctx, d);
  }

  @MessagePattern(P.listarAvaliacoes)
  listarAvaliacoes(@Contexto() ctx: Ctx) {
    return this.s.listarAvaliacoes(ctx);
  }

  @MessagePattern(P.avaliarFornecedor)
  avaliarFornecedor(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.avaliarFornecedor(ctx, d);
  }
}
