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
  anularCalibracaoSchema,
  atualizarInstrumentoSchema,
  filtroInstrumentosSchema,
  novoInstrumentoSchema,
  PATTERNS,
  registrarCalibracaoSchema,
  SERVICES,
  usoDoInstrumentoSchema,
  type Contexto,
  type Instrumento,
  type InstrumentoResumo,
  type Pagina,
  type ResumoCalibracao,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.calibracao;

/**
 * Instrumentos e calibrações (serviço qualidade). docs/05-modulos/calibracao.md
 * Registrar: quem tem o módulo. Anular calibração e tirar instrumento de uso: gestor (`qualidade.excluir`).
 */
@Controller('instrumentos')
export class CalibracaoController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('qualidade.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroInstrumentosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<InstrumentoResumo>>(
      SERVICES.QUALIDADE,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('qualidade.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoCalibracao>(
      SERVICES.QUALIDADE,
      P.resumo,
      {},
      ctx,
    );
  }

  @Get(':id')
  @Permissao('qualidade.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Instrumento>(
      SERVICES.QUALIDADE,
      P.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('qualidade.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoInstrumentoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Instrumento>(
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
    return this.acao(
      ctx,
      atualizarInstrumentoSchema,
      P.atualizar,
      id,
      alteracoes,
    );
  }

  @Post(':id/calibracoes')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  registrar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      registrarCalibracaoSchema,
      P.registrar,
      id,
      alteracoes,
    );
  }

  @Post(':id/calibracoes/anular')
  @Permissao('qualidade.excluir')
  @HttpCode(200)
  anular(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, anularCalibracaoSchema, P.anular, id, alteracoes);
  }

  @Post(':id/uso')
  @Permissao('qualidade.excluir')
  @HttpCode(200)
  mudarUso(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, usoDoInstrumentoSchema, P.mudarUso, id, alteracoes);
  }

  private acao(
    ctx: Contexto,
    schema: z.ZodType,
    padrao: string,
    id: string,
    alteracoes: unknown,
  ) {
    validarEntrada(schema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<Instrumento>(
      SERVICES.QUALIDADE,
      padrao,
      { id, alteracoes },
      ctx,
    );
  }
}
