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
  aprovarProcessoSchema,
  atualizarProcessoSchema,
  cancelarProcessoSchema,
  encerrarProcessoSchema,
  enviarRevisaoProcessoSchema,
  filtroProcessosSchema,
  novaRevisaoProcessoSchema,
  novoProcessoSchema,
  publicarProcessoSchema,
  salvarDiagramaProcessoSchema,
  PATTERNS,
  SERVICES,
  type Contexto,
  type Processo,
  type ProcessoComRevisoes,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.processos;

/**
 * Modelagem de processos (serviço qualidade). Ver e elaborar: qualidade.editar.
 * Aprovar, publicar, tornar obsoleto e cancelar: gestor (qualidade.excluir).
 */
@Controller('processos')
export class ProcessosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('qualidade.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroProcessosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Processo[]>(
      SERVICES.QUALIDADE,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Get(':id')
  @Permissao('qualidade.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<ProcessoComRevisoes>(
      SERVICES.QUALIDADE,
      P.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('qualidade.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoProcessoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Processo>(
      SERVICES.QUALIDADE,
      P.criar,
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
    return this.acao(ctx, atualizarProcessoSchema, P.atualizar, id, alteracoes);
  }

  @Post(':id/enviar-revisao')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  enviarRevisao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      enviarRevisaoProcessoSchema,
      P.enviarRevisao,
      id,
      alteracoes,
    );
  }

  @Post(':id/aprovar')
  @Permissao('qualidade.excluir')
  @HttpCode(200)
  aprovar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, aprovarProcessoSchema, P.aprovar, id, alteracoes);
  }

  @Post(':id/publicar')
  @Permissao('qualidade.excluir')
  @HttpCode(200)
  publicar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, publicarProcessoSchema, P.publicar, id, alteracoes);
  }

  @Post(':id/nova-revisao')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  novaRevisao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      novaRevisaoProcessoSchema,
      P.novaRevisao,
      id,
      alteracoes,
    );
  }

  @Post(':id/encerrar')
  @Permissao('qualidade.excluir')
  @HttpCode(200)
  encerrar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, encerrarProcessoSchema, P.encerrar, id, alteracoes);
  }

  @Post(':id/cancelar')
  @Permissao('qualidade.excluir')
  @HttpCode(200)
  cancelar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, cancelarProcessoSchema, P.cancelar, id, alteracoes);
  }

  @Post(':id/diagrama')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  salvarDiagrama(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      salvarDiagramaProcessoSchema,
      P.salvarDiagrama,
      id,
      alteracoes,
    );
  }

  private acao(
    ctx: Contexto,
    schema: z.ZodType,
    padrao: string,
    id: string,
    alteracoes: unknown,
  ) {
    validarEntrada(schema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<Processo>(
      SERVICES.QUALIDADE,
      padrao,
      { id, alteracoes },
      ctx,
    );
  }
}
