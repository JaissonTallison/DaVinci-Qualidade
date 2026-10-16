import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { GestaoAmbientalService } from './gestao.service.js';

const P = PATTERNS.ambiental;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Gestão ambiental pela fila davinci.ambiental. */
@Controller()
export class GestaoAmbientalController {
  constructor(private readonly s: GestaoAmbientalService) {}

  @MessagePattern(P.listarOcorrencias)
  listarOcorrencias(@Contexto() ctx: Ctx) {
    return this.s.listarOcorrencias(ctx);
  }
  @MessagePattern(P.obterOcorrencia)
  obterOcorrencia(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterOcorrencia(ctx, d);
  }
  @MessagePattern(P.criarOcorrencia)
  criarOcorrencia(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarOcorrencia(ctx, d);
  }
  @MessagePattern(P.comunicarOcorrencia)
  comunicarOcorrencia(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.comunicarOcorrencia(ctx, d);
  }
  @MessagePattern(P.ncDaOcorrencia)
  ncDaOcorrencia(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.ncDaOcorrencia(ctx, d);
  }
  @MessagePattern(P.encerrarOcorrencia)
  encerrarOcorrencia(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.encerrarOcorrencia(ctx, d);
  }
  @MessagePattern(P.listarObrigacoes)
  listarObrigacoes(@Contexto() ctx: Ctx) {
    return this.s.listarObrigacoes(ctx);
  }
  @MessagePattern(P.criarObrigacao)
  criarObrigacao(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarObrigacao(ctx, d);
  }
  @MessagePattern(P.atualizarObrigacao)
  atualizarObrigacao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarObrigacao(ctx, d);
  }
  @MessagePattern(P.cumprirObrigacao)
  cumprirObrigacao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.cumprirObrigacao(ctx, d);
  }
  @MessagePattern(P.excluirObrigacao)
  excluirObrigacao(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.excluirObrigacao(ctx, d);
  }
  @MessagePattern(P.listarDestinadores)
  listarDestinadores(@Contexto() ctx: Ctx) {
    return this.s.listarDestinadores(ctx);
  }
  @MessagePattern(P.criarDestinador)
  criarDestinador(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarDestinador(ctx, d);
  }
  @MessagePattern(P.atualizarDestinador)
  atualizarDestinador(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarDestinador(ctx, d);
  }
  @MessagePattern(P.inventarioDeResiduos)
  inventario(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.inventario(ctx, d);
  }
  @MessagePattern(P.listarProducao)
  listarProducao(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listarProducao(ctx, d);
  }
  @MessagePattern(P.registrarProducao)
  registrarProducao(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.registrarProducao(ctx, d);
  }
  @MessagePattern(P.ecoeficiencia)
  ecoeficiencia(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.ecoeficiencia(ctx, d);
  }
  @MessagePattern(P.listarProgramas)
  listarProgramas(@Contexto() ctx: Ctx) {
    return this.s.listarProgramas(ctx);
  }
  @MessagePattern(P.obterPrograma)
  obterPrograma(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.obterPrograma(ctx, d);
  }
  @MessagePattern(P.criarPrograma)
  criarPrograma(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.criarPrograma(ctx, d);
  }
  @MessagePattern(P.atualizarPrograma)
  atualizarPrograma(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.atualizarPrograma(ctx, d);
  }
  @MessagePattern(P.medirPrograma)
  medirPrograma(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.s.medirPrograma(ctx, d);
  }
}
