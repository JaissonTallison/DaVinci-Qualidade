import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { AcidentesService } from './acidentes.service.js';

const P = PATTERNS.acidentes;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens de acidentes e indicadores recebidas pela fila davinci.seguranca. Toda regra está no service. */
@Controller()
export class AcidentesController {
  constructor(private readonly acidentes: AcidentesService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.acidentes.listar(ctx, dados);
  }

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.acidentes.resumo(ctx);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.acidentes.obter(ctx, dados);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.acidentes.criar(ctx, dados);
  }

  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.acidentes.atualizar(ctx, dados);
  }

  @MessagePattern(P.registrarCat)
  registrarCat(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.acidentes.registrarCat(ctx, dados);
  }

  @MessagePattern(P.iniciarInvestigacao)
  iniciarInvestigacao(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.acidentes.iniciarInvestigacao(ctx, dados);
  }

  @MessagePattern(P.concluirInvestigacao)
  concluirInvestigacao(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.acidentes.concluirInvestigacao(ctx, dados);
  }

  @MessagePattern(P.cancelar)
  cancelar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.acidentes.cancelar(ctx, dados);
  }

  @MessagePattern(P.registrarHoras)
  registrarHoras(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.acidentes.registrarHoras(ctx, dados);
  }

  @MessagePattern(P.indicadores)
  indicadores(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.acidentes.indicadores(ctx, dados);
  }
}
