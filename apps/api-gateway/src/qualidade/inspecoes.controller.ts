import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  atualizarModeloSchema,
  cancelarInspecaoSchema,
  concluirInspecaoSchema,
  filtroInspecoesSchema,
  filtroModelosSchema,
  novaInspecaoSchema,
  novoModeloSchema,
  PATTERNS,
  responderInspecaoSchema,
  SERVICES,
  situacaoDoModeloSchema,
  type Contexto,
  type Inspecao,
  type InspecaoResumo,
  type ModeloDeInspecao,
  type Pagina,
  type RecebimentoDoFornecedor,
  type ResumoInspecoes,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const I = PATTERNS.inspecoes;
const M = PATTERNS.modelosDeInspecao;

/** Inspeções (serviço qualidade). docs/05-modulos/inspecoes.md. Cancelar: gestor (`qualidade.excluir`). */
@Controller('inspecoes')
export class InspecoesController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('qualidade.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroInspecoesSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<InspecaoResumo>>(
      SERVICES.QUALIDADE,
      I.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('qualidade.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoInspecoes>(
      SERVICES.QUALIDADE,
      I.resumo,
      {},
      ctx,
    );
  }

  @Get('fornecedor/:fornecedorId')
  @Permissao('qualidade.ver')
  recebimentoDoFornecedor(
    @ContextoHttp() ctx: Contexto,
    @Param('fornecedorId') fornecedorId: string,
  ) {
    return this.mensageria.enviar<RecebimentoDoFornecedor>(
      SERVICES.QUALIDADE,
      I.recebimentoDoFornecedor,
      { fornecedorId },
      ctx,
    );
  }

  @Get(':id')
  @Permissao('qualidade.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Inspecao>(
      SERVICES.QUALIDADE,
      I.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('qualidade.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaInspecaoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Inspecao>(
      SERVICES.QUALIDADE,
      I.criar,
      dados,
      ctx,
    );
  }

  @Post(':id/respostas')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  responder(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, responderInspecaoSchema, I.responder, id, alteracoes);
  }

  @Post(':id/concluir')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  concluir(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, concluirInspecaoSchema, I.concluir, id, alteracoes);
  }

  @Post(':id/cancelar')
  @Permissao('qualidade.excluir')
  @HttpCode(200)
  cancelar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, cancelarInspecaoSchema, I.cancelar, id, alteracoes);
  }

  private acao(
    ctx: Contexto,
    schema: z.ZodType,
    padrao: string,
    id: string,
    alteracoes: unknown,
  ) {
    validarEntrada(schema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<Inspecao>(
      SERVICES.QUALIDADE,
      padrao,
      { id, alteracoes },
      ctx,
    );
  }
}

/** Modelos de inspeção. Criar e editar: quem registra inspeções. Inativar: gestor. */
@Controller('modelos-de-inspecao')
export class ModelosDeInspecaoController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('qualidade.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroModelosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<ModeloDeInspecao[]>(
      SERVICES.QUALIDADE,
      M.listar,
      filtro,
      ctx,
    );
  }

  @Get(':id')
  @Permissao('qualidade.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<ModeloDeInspecao>(
      SERVICES.QUALIDADE,
      M.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('qualidade.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoModeloSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<ModeloDeInspecao>(
      SERVICES.QUALIDADE,
      M.criar,
      dados,
      ctx,
    );
  }

  @Put(':id')
  @Permissao('qualidade.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, atualizarModeloSchema, M.atualizar, id, alteracoes);
  }

  @Post(':id/inativar')
  @Permissao('qualidade.excluir')
  @HttpCode(200)
  inativar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, situacaoDoModeloSchema, M.inativar, id, alteracoes);
  }

  @Post(':id/reativar')
  @Permissao('qualidade.excluir')
  @HttpCode(200)
  reativar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, situacaoDoModeloSchema, M.reativar, id, alteracoes);
  }

  private acao(
    ctx: Contexto,
    schema: z.ZodType,
    padrao: string,
    id: string,
    alteracoes: unknown,
  ) {
    validarEntrada(schema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<ModeloDeInspecao>(
      SERVICES.QUALIDADE,
      padrao,
      { id, alteracoes },
      ctx,
    );
  }
}
