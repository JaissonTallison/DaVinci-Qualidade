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
  atribuirResponsavelPlanoEmLoteSchema,
  atualizarPlanoSchema,
  cancelarPlanoSchema,
  cancelarTarefaSchema,
  concluirTarefaSchema,
  filtroPlanosSchema,
  incluirTarefaSchema,
  novoPlanoSchema,
  PATTERNS,
  reabrirTarefaSchema,
  SERVICES,
  verificarEficaciaPlanoSchema,
  type Contexto,
  type Pagina,
  type PlanoDeAcao,
  type PlanoResumo,
  type ResumoPlanos,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.planosDeAcao;

/**
 * Planos de ação (serviço qualidade). docs/05-modulos/planos-de-acao.md
 * Ver e executar: qualquer pessoa com o módulo. Cancelar o plano: gestor (`qualidade.excluir`).
 */
@Controller('planos-de-acao')
export class PlanosDeAcaoController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('qualidade.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroPlanosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<PlanoResumo>>(
      SERVICES.QUALIDADE,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('qualidade.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoPlanos>(
      SERVICES.QUALIDADE,
      P.resumo,
      {},
      ctx,
    );
  }

  @Get(':id')
  @Permissao('qualidade.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<PlanoDeAcao>(
      SERVICES.QUALIDADE,
      P.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('qualidade.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoPlanoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<PlanoDeAcao>(
      SERVICES.QUALIDADE,
      P.criar,
      dados,
      ctx,
    );
  }

  @Post('responsavel-em-lote')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  atribuirResponsavelEmLote(
    @ContextoHttp() ctx: Contexto,
    @Body() dados: unknown,
  ) {
    validarEntrada(atribuirResponsavelPlanoEmLoteSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<{ atualizadas: number }>(
      SERVICES.QUALIDADE,
      P.atribuirResponsavelEmLote,
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
    return this.acao(ctx, atualizarPlanoSchema, P.atualizar, id, alteracoes);
  }

  @Post(':id/tarefas')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  incluirTarefa(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, incluirTarefaSchema, P.incluirTarefa, id, alteracoes);
  }

  @Post(':id/tarefas/concluir')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  concluirTarefa(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      concluirTarefaSchema,
      P.concluirTarefa,
      id,
      alteracoes,
    );
  }

  @Post(':id/tarefas/reabrir')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  reabrirTarefa(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, reabrirTarefaSchema, P.reabrirTarefa, id, alteracoes);
  }

  @Post(':id/tarefas/cancelar')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  cancelarTarefa(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      cancelarTarefaSchema,
      P.cancelarTarefa,
      id,
      alteracoes,
    );
  }

  @Post(':id/verificar-eficacia')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  verificarEficacia(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      verificarEficaciaPlanoSchema,
      P.verificarEficacia,
      id,
      alteracoes,
    );
  }

  @Post(':id/cancelar')
  @Permissao('qualidade.excluir')
  @HttpCode(200)
  cancelar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, cancelarPlanoSchema, P.cancelar, id, alteracoes);
  }

  /** Valida no gateway (resposta rápida e sem ir à fila) e envia `{ id, alteracoes }` ao serviço. */
  private acao(
    ctx: Contexto,
    schema: z.ZodType,
    padrao: string,
    id: string,
    alteracoes: unknown,
  ) {
    validarEntrada(schema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<PlanoDeAcao>(
      SERVICES.QUALIDADE,
      padrao,
      { id, alteracoes },
      ctx,
    );
  }
}
