import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { EmergenciaService } from './emergencia.service.js';

const P = PATTERNS.emergencia;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Emergência e ordem de serviço de segurança pela fila davinci.seguranca. */
@Controller()
export class EmergenciaController {
  constructor(private readonly s: EmergenciaService) {}

  @MessagePattern(P.listarEquipamentos)
  listarEquipamentos(@Contexto() ctx: Ctx) {
    return this.s.listarEquipamentos(ctx);
  }
  @MessagePattern(P.obterEquipamento)
  obterEquipamento(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterEquipamento(ctx, d);
  }
  @MessagePattern(P.criarEquipamento)
  criarEquipamento(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarEquipamento(ctx, d);
  }
  @MessagePattern(P.atualizarEquipamento)
  atualizarEquipamento(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarEquipamento(ctx, d);
  }
  @MessagePattern(P.situacaoEquipamento)
  situacaoEquipamento(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.mudarSituacaoDoEquipamento(ctx, d);
  }
  @MessagePattern(P.inspecionarEquipamento)
  inspecionar(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.inspecionar(ctx, d);
  }
  @MessagePattern(P.listarBrigada)
  listarBrigada(@Contexto() ctx: Ctx) {
    return this.s.listarBrigada(ctx);
  }
  @MessagePattern(P.incluirBrigadista)
  incluirBrigadista(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.incluirBrigadista(ctx, d);
  }
  @MessagePattern(P.atualizarBrigadista)
  atualizarBrigadista(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarBrigadista(ctx, d);
  }
  @MessagePattern(P.retirarBrigadista)
  retirarBrigadista(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.retirarBrigadista(ctx, d);
  }
  @MessagePattern(P.obterPlano)
  obterPlano(@Contexto() ctx: Ctx) {
    return this.s.obterPlano(ctx);
  }
  @MessagePattern(P.salvarPlano)
  salvarPlano(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.salvarPlano(ctx, d);
  }
  @MessagePattern(P.obterOrdemSst)
  obterOrdemSst(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.obterOrdemSst(ctx, d);
  }
  @MessagePattern(P.salvarOrdemSst)
  salvarOrdemSst(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.salvarOrdemSst(ctx, d);
  }
}
