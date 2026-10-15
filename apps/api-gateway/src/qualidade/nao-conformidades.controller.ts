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
  atualizarNcSchema,
  cancelarNcSchema,
  enviarParaVerificacaoSchema,
  filtroNcsSchema,
  novaNcSchema,
  PATTERNS,
  registrarTratamentoSchema,
  SERVICES,
  verificarEficaciaSchema,
  type Contexto,
  type NaoConformidade,
  type NaoConformidadeResumo,
  type Pagina,
  type ResumoNcs,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.naoConformidades;

/**
 * Não conformidades (serviço qualidade). docs/05-modulos/nao-conformidades.md
 * Ver e registrar: qualquer pessoa com o módulo. Cancelar: gestor (`qualidade.excluir`), porque NC não se apaga.
 */
@Controller('nao-conformidades')
export class NaoConformidadesController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('qualidade.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroNcsSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<NaoConformidadeResumo>>(
      SERVICES.QUALIDADE,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('qualidade.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoNcs>(
      SERVICES.QUALIDADE,
      P.resumo,
      {},
      ctx,
    );
  }

  @Get(':id')
  @Permissao('qualidade.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<NaoConformidade>(
      SERVICES.QUALIDADE,
      P.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('qualidade.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaNcSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<NaoConformidade>(
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
    return this.acao(ctx, atualizarNcSchema, P.atualizar, id, alteracoes);
  }

  @Post(':id/tratamento')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  registrarTratamento(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      registrarTratamentoSchema,
      P.registrarTratamento,
      id,
      alteracoes,
    );
  }

  @Post(':id/enviar-para-verificacao')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  enviarParaVerificacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      enviarParaVerificacaoSchema,
      P.enviarParaVerificacao,
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
      verificarEficaciaSchema,
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
    return this.acao(ctx, cancelarNcSchema, P.cancelar, id, alteracoes);
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
    return this.mensageria.enviar<NaoConformidade>(
      SERVICES.QUALIDADE,
      padrao,
      { id, alteracoes },
      ctx,
    );
  }
}
