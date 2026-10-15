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
  atualizarAspectoSchema,
  atualizarRequisitoSchema,
  atualizarResiduoSchema,
  avaliarRequisitoSchema,
  cumprirCondicionanteSchema,
  filtroAspectosSchema,
  filtroRequisitosSchema,
  filtroSaidasSchema,
  novaCondicionanteSchema,
  novaLicencaSchema,
  novoAspectoSchema,
  novoRequisitoSchema,
  novoResiduoSchema,
  registrarCdfSchema,
  registrarSaidaSchema,
  renovacaoSolicitadaSchema,
  situacaoDoAspectoSchema,
  PATTERNS,
  SERVICES,
  type Contexto,
  type ResumoAmbiental,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.ambiental;
const S = SERVICES.AMBIENTAL;

/** Resumo de Meio Ambiente para o início. docs/05-modulos/ambiental.md */
@Controller('ambiental')
export class AmbientalController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get('resumo')
  @Permissao('ambiental.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoAmbiental>(S, P.resumo, {}, ctx);
  }
}

/** LAIA. Inativar aspecto: gestor (ambiental.excluir). */
@Controller('aspectos-ambientais')
export class AspectosAmbientaisController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('ambiental.ver')
  listarAspectos(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroAspectosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar(S, P.listarAspectos, filtro, ctx);
  }

  @Get(':id')
  @Permissao('ambiental.ver')
  obterAspecto(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(S, P.obterAspecto, { id }, ctx);
  }

  @Post()
  @Permissao('ambiental.editar')
  criarAspecto(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoAspectoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(S, P.criarAspecto, dados, ctx);
  }

  @Put(':id')
  @Permissao('ambiental.editar')
  atualizarAspecto(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(atualizarAspectoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      S,
      P.atualizarAspecto,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/situacao')
  @Permissao('ambiental.excluir')
  @HttpCode(200)
  situacaoAspecto(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(situacaoDoAspectoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      S,
      P.situacaoAspecto,
      { id, alteracoes },
      ctx,
    );
  }
}

/** Requisitos legais e avaliação de atendimento. */
@Controller('requisitos-legais')
export class RequisitosLegaisController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('ambiental.ver')
  listarRequisitos(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroRequisitosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar(S, P.listarRequisitos, filtro, ctx);
  }

  @Get(':id')
  @Permissao('ambiental.ver')
  obterRequisito(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(S, P.obterRequisito, { id }, ctx);
  }

  @Post()
  @Permissao('ambiental.editar')
  criarRequisito(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoRequisitoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(S, P.criarRequisito, dados, ctx);
  }

  @Put(':id')
  @Permissao('ambiental.editar')
  atualizarRequisito(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(atualizarRequisitoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      S,
      P.atualizarRequisito,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/avaliacao')
  @Permissao('ambiental.editar')
  @HttpCode(200)
  avaliarRequisito(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(avaliarRequisitoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      S,
      P.avaliarRequisito,
      { id, alteracoes },
      ctx,
    );
  }
}

/** Licenças, renovação e condicionantes. */
@Controller('licencas')
export class LicencasController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('ambiental.ver')
  listarLicencas(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar(S, P.listarLicencas, {}, ctx);
  }

  @Get(':id')
  @Permissao('ambiental.ver')
  obterLicenca(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(S, P.obterLicenca, { id }, ctx);
  }

  @Post()
  @Permissao('ambiental.editar')
  criarLicenca(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaLicencaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(S, P.criarLicenca, dados, ctx);
  }

  @Post(':id/renovacao')
  @Permissao('ambiental.editar')
  @HttpCode(200)
  renovacaoSolicitada(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(renovacaoSolicitadaSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      S,
      P.renovacaoSolicitada,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/condicionantes')
  @Permissao('ambiental.editar')
  @HttpCode(200)
  criarCondicionante(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(novaCondicionanteSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      S,
      P.criarCondicionante,
      { id, alteracoes },
      ctx,
    );
  }

  @Post('condicionantes/:id/cumprimento')
  @Permissao('ambiental.editar')
  @HttpCode(200)
  cumprirCondicionante(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(cumprirCondicionanteSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      S,
      P.cumprirCondicionante,
      { id, alteracoes },
      ctx,
    );
  }
}

/** Inventário de resíduos, saídas com MTR e CDF. */
@Controller('residuos')
export class ResiduosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('ambiental.ver')
  listarResiduos(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar(S, P.listarResiduos, {}, ctx);
  }

  @Get('saidas')
  @Permissao('ambiental.ver')
  listarSaidas(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroSaidasSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar(S, P.listarSaidas, filtro, ctx);
  }

  @Post()
  @Permissao('ambiental.editar')
  criarResiduo(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoResiduoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(S, P.criarResiduo, dados, ctx);
  }

  @Put(':id')
  @Permissao('ambiental.editar')
  atualizarResiduo(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(atualizarResiduoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      S,
      P.atualizarResiduo,
      { id, alteracoes },
      ctx,
    );
  }

  @Post('saidas')
  @Permissao('ambiental.editar')
  registrarSaida(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(registrarSaidaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(S, P.registrarSaida, dados, ctx);
  }

  @Post('saidas/:id/cdf')
  @Permissao('ambiental.editar')
  @HttpCode(200)
  registrarCdf(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(registrarCdfSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(S, P.registrarCdf, { id, alteracoes }, ctx);
  }
}
