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
  atualizarAcidenteSchema,
  cancelarAcidenteSchema,
  concluirInvestigacaoSchema,
  filtroAcidentesSchema,
  indicadoresSchema,
  iniciarInvestigacaoSchema,
  novoAcidenteSchema,
  PATTERNS,
  registrarCatSchema,
  registrarHorasSchema,
  SERVICES,
  type Acidente,
  type AcidenteResumo,
  type Contexto,
  type IndicadoresSst,
  type Pagina,
  type ResumoAcidentes,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.acidentes;

/** Acidentes e indicadores de SST (serviço seguranca). docs/05-modulos/acidentes.md. Cancelar: gestor. */
@Controller('acidentes')
export class AcidentesController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('seguranca.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroAcidentesSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<AcidenteResumo>>(
      SERVICES.SEGURANCA,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('seguranca.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoAcidentes>(
      SERVICES.SEGURANCA,
      P.resumo,
      {},
      ctx,
    );
  }

  @Get('indicadores')
  @Permissao('seguranca.ver')
  indicadores(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(indicadoresSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<IndicadoresSst>(
      SERVICES.SEGURANCA,
      P.indicadores,
      filtro,
      ctx,
    );
  }

  @Post('horas')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  registrarHoras(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(registrarHorasSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<{ competencia: string; horas: number }>(
      SERVICES.SEGURANCA,
      P.registrarHoras,
      dados,
      ctx,
    );
  }

  @Get(':id')
  @Permissao('seguranca.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Acidente>(
      SERVICES.SEGURANCA,
      P.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('seguranca.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoAcidenteSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Acidente>(
      SERVICES.SEGURANCA,
      P.criar,
      dados,
      ctx,
    );
  }

  @Put(':id')
  @Permissao('seguranca.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, atualizarAcidenteSchema, P.atualizar, id, alteracoes);
  }

  @Post(':id/cat')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  registrarCat(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, registrarCatSchema, P.registrarCat, id, alteracoes);
  }

  @Post(':id/investigacao/iniciar')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  iniciarInvestigacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      iniciarInvestigacaoSchema,
      P.iniciarInvestigacao,
      id,
      alteracoes,
    );
  }

  @Post(':id/investigacao/concluir')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  concluirInvestigacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      concluirInvestigacaoSchema,
      P.concluirInvestigacao,
      id,
      alteracoes,
    );
  }

  @Post(':id/cancelar')
  @Permissao('seguranca.excluir')
  @HttpCode(200)
  cancelar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, cancelarAcidenteSchema, P.cancelar, id, alteracoes);
  }

  private acao(
    ctx: Contexto,
    schema: z.ZodType,
    padrao: string,
    id: string,
    alteracoes: unknown,
  ) {
    validarEntrada(schema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<Acidente>(
      SERVICES.SEGURANCA,
      padrao,
      { id, alteracoes },
      ctx,
    );
  }
}
