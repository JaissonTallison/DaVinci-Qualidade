import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  atualizarTerceiroSchema,
  filtroTerceirosSchema,
  novoTerceiroSchema,
  PATTERNS,
  registrarDocTerceiroSchema,
  SERVICES,
  type Contexto,
  type ResumoTerceiros,
  type Terceiro,
  type TerceiroResumo,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.terceiros;

/** Terceiros e seus documentos de SST. docs/05-modulos/terceiros.md */
@Controller('terceiros')
export class TerceirosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('seguranca.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroTerceirosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<TerceiroResumo[]>(
      SERVICES.SEGURANCA,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('seguranca.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoTerceiros>(
      SERVICES.SEGURANCA,
      P.resumo,
      {},
      ctx,
    );
  }

  @Get(':id')
  @Permissao('seguranca.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Terceiro>(
      SERVICES.SEGURANCA,
      P.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('seguranca.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoTerceiroSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Terceiro>(
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
    validarEntrada(atualizarTerceiroSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<Terceiro>(
      SERVICES.SEGURANCA,
      P.atualizar,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/documentos')
  @Permissao('seguranca.editar')
  registrarDocumento(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(registrarDocTerceiroSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<Terceiro>(
      SERVICES.SEGURANCA,
      P.registrarDocumento,
      { id, alteracoes },
      ctx,
    );
  }
}
