import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { InspecoesService } from './inspecoes.service.js';
import { ModelosDeInspecaoService } from './modelos.service.js';

const I = PATTERNS.inspecoes;
const M = PATTERNS.modelosDeInspecao;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Mensagens de inspeções e modelos recebidas pela fila davinci.qualidade. Toda regra está nos services. */
@Controller()
export class InspecoesController {
  constructor(
    private readonly inspecoes: InspecoesService,
    private readonly modelos: ModelosDeInspecaoService,
  ) {}

  @MessagePattern(I.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.inspecoes.listar(ctx, dados);
  }

  @MessagePattern(I.recebimentoDoFornecedor)
  recebimentoDoFornecedor(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.inspecoes.recebimentoDoFornecedor(ctx, dados);
  }

  @MessagePattern(I.resumo)
  resumo(@Contexto() ctx: Ctx) {
    return this.inspecoes.resumo(ctx);
  }

  @MessagePattern(I.obter)
  obter(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.inspecoes.obter(ctx, dados);
  }

  @MessagePattern(I.criar)
  criar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.inspecoes.criar(ctx, dados);
  }

  @MessagePattern(I.responder)
  responder(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.inspecoes.responder(ctx, dados);
  }

  @MessagePattern(I.concluir)
  concluir(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.inspecoes.concluir(ctx, dados);
  }

  @MessagePattern(I.cancelar)
  cancelar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.inspecoes.cancelar(ctx, dados);
  }

  @MessagePattern(M.listar)
  listarModelos(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.modelos.listar(ctx, dados);
  }

  @MessagePattern(M.obter)
  obterModelo(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.modelos.obter(ctx, dados);
  }

  @MessagePattern(M.criar)
  criarModelo(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.modelos.criar(ctx, dados);
  }

  @MessagePattern(M.atualizar)
  atualizarModelo(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.modelos.atualizar(ctx, dados);
  }

  @MessagePattern(M.inativar)
  inativarModelo(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.modelos.inativar(ctx, dados);
  }

  @MessagePattern(M.reativar)
  reativarModelo(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.modelos.reativar(ctx, dados);
  }
}
