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
  atualizarTemaSchema,
  filtroTemasSchema,
  novoTemaSchema,
  registrarAndamentoSchema,
  situacaoDoTemaSchema,
  PATTERNS,
  SERVICES,
  type Contexto,
  type ResumoEsg,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.esg;
const S = SERVICES.ESG;

/** Agenda ESG. Inativar tema: gestor (esg.excluir); importar o catálogo: esg.importar-catalogo. docs/05-modulos/esg.md */
@Controller('esg')
export class EsgController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get('resumo')
  @Permissao('esg.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoEsg>(S, P.resumo, {}, ctx);
  }

  @Get('temas')
  @Permissao('esg.ver')
  listarTemas(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroTemasSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar(S, P.listarTemas, filtro, ctx);
  }

  @Post('temas/catalogo')
  @Permissao('esg.importar-catalogo')
  @HttpCode(200)
  importarCatalogo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar(S, P.importarCatalogo, {}, ctx, 15_000);
  }

  @Get('temas/:id')
  @Permissao('esg.ver')
  obterTema(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(S, P.obterTema, { id }, ctx);
  }

  @Post('temas')
  @Permissao('esg.editar')
  criarTema(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoTemaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(S, P.criarTema, dados, ctx);
  }

  @Put('temas/:id')
  @Permissao('esg.editar')
  atualizarTema(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(atualizarTemaSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(S, P.atualizarTema, { id, alteracoes }, ctx);
  }

  @Post('temas/:id/situacao')
  @Permissao('esg.excluir')
  @HttpCode(200)
  situacaoTema(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(situacaoDoTemaSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(S, P.situacaoTema, { id, alteracoes }, ctx);
  }

  @Post('temas/:id/andamentos')
  @Permissao('esg.editar')
  @HttpCode(200)
  registrarAndamento(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(registrarAndamentoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      S,
      P.registrarAndamento,
      { id, alteracoes },
      ctx,
    );
  }
}
