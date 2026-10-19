import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { NaoConformidadesService } from './nao-conformidades.service.js';

const P = PATTERNS.naoConformidades;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens de não conformidades recebidas pela fila davinci.qualidade. Toda regra está no service. */
@Controller()
export class NaoConformidadesController {
  constructor(private readonly ncs: NaoConformidadesService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.ncs.listar(ctx, dados);
  }

  @MessagePattern(P.atribuirResponsavelEmLote)
  atribuirResponsavelEmLote(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.ncs.atribuirResponsavelEmLote(ctx, dados);
  }

  @MessagePattern(P.porMes)
  porMes(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.ncs.porMes(ctx, dados);
  }

  @MessagePattern(P.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.ncs.resumo(ctx);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.ncs.obter(ctx, dados);
  }

  @MessagePattern(P.criar)
  criar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.ncs.criar(ctx, dados);
  }

  @MessagePattern(P.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.ncs.atualizar(ctx, dados);
  }

  @MessagePattern(P.registrarTratamento)
  registrarTratamento(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.ncs.registrarTratamento(ctx, dados);
  }

  @MessagePattern(P.enviarParaVerificacao)
  enviarParaVerificacao(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.ncs.enviarParaVerificacao(ctx, dados);
  }

  @MessagePattern(P.verificarEficacia)
  verificarEficacia(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.ncs.verificarEficacia(ctx, dados);
  }

  @MessagePattern(P.cancelar)
  cancelar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.ncs.cancelar(ctx, dados);
  }
}
