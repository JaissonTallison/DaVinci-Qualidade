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
  alterarConstatacaoSchema,
  atualizarAuditoriaSchema,
  cancelarAuditoriaSchema,
  concluirAuditoriaSchema,
  filtroAuditoriasSchema,
  formalizarNcSchema,
  iniciarAuditoriaSchema,
  novaAuditoriaSchema,
  PATTERNS,
  registrarConstatacaoSchema,
  SERVICES,
  type Auditoria,
  type AuditoriaResumo,
  type Contexto,
  type Pagina,
  type ResumoAuditorias,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.auditorias;

/**
 * Auditorias (serviço auditorias). docs/05-modulos/auditorias.md
 * Planejar, conduzir e concluir: `auditorias.editar`. Cancelar: gestor (`auditorias.excluir`).
 * Formalizar NC leva mais tempo (o serviço auditorias pede ao qualidade): prazo maior.
 */
@Controller('auditorias')
export class AuditoriasController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('auditorias.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroAuditoriasSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<AuditoriaResumo>>(
      SERVICES.AUDITORIAS,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('auditorias.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoAuditorias>(
      SERVICES.AUDITORIAS,
      P.resumo,
      {},
      ctx,
    );
  }

  @Get(':id')
  @Permissao('auditorias.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Auditoria>(
      SERVICES.AUDITORIAS,
      P.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('auditorias.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaAuditoriaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Auditoria>(
      SERVICES.AUDITORIAS,
      P.criar,
      dados,
      ctx,
    );
  }

  @Put(':id')
  @Permissao('auditorias.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      atualizarAuditoriaSchema,
      P.atualizar,
      id,
      alteracoes,
    );
  }

  @Post(':id/iniciar')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  iniciar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, iniciarAuditoriaSchema, P.iniciar, id, alteracoes);
  }

  @Post(':id/constatacoes')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  registrarConstatacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      registrarConstatacaoSchema,
      P.registrarConstatacao,
      id,
      alteracoes,
    );
  }

  @Put(':id/constatacoes')
  @Permissao('auditorias.editar')
  alterarConstatacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      alterarConstatacaoSchema,
      P.alterarConstatacao,
      id,
      alteracoes,
    );
  }

  @Post(':id/constatacoes/formalizar-nc')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  formalizarNc(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      formalizarNcSchema,
      P.formalizarNc,
      id,
      alteracoes,
      15_000,
    );
  }

  @Post(':id/concluir')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  concluir(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, concluirAuditoriaSchema, P.concluir, id, alteracoes);
  }

  @Post(':id/cancelar')
  @Permissao('auditorias.excluir')
  @HttpCode(200)
  cancelar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, cancelarAuditoriaSchema, P.cancelar, id, alteracoes);
  }

  private acao(
    ctx: Contexto,
    schema: z.ZodType,
    padrao: string,
    id: string,
    alteracoes: unknown,
    prazoMs?: number,
  ) {
    validarEntrada(schema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<Auditoria>(
      SERVICES.AUDITORIAS,
      padrao,
      { id, alteracoes },
      ctx,
      prazoMs,
    );
  }
}
