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
  atualizarObjetivoSchema,
  atualizarRoSchema,
  decidirMudancaSchema,
  encerrarRoSchema,
  filtroMudancasSchema,
  filtroRosSchema,
  implementarMudancaSchema,
  novaAnaliseCriticaSchema,
  novaMudancaSchema,
  novoObjetivoSchema,
  novoRoSchema,
  registrarMedicaoSchema,
  situacaoDoObjetivoSchema,
  PATTERNS,
  SERVICES,
  type Contexto,
  type ResumoSgi,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.sgi;

/** Resumo da Gestão do SGI para o início. docs/05-modulos/sgi.md */
@Controller('sgi')
export class SgiController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get('resumo')
  @Permissao('sgi.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoSgi>(SERVICES.SGI, P.resumo, {}, ctx);
  }
}

/** Gestão do SGI: riscos-e-oportunidades. Decidir mudança e inativar objetivo: gestor (sgi.excluir). */
@Controller('riscos-e-oportunidades')
export class RiscosEOportunidadesController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('sgi.ver')
  listarRos(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroRosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar(SERVICES.SGI, P.listarRos, filtro, ctx);
  }

  @Get(':id')
  @Permissao('sgi.ver')
  obterRo(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(SERVICES.SGI, P.obterRo, { id }, ctx);
  }

  @Post()
  @Permissao('sgi.editar')
  criarRo(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoRoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(SERVICES.SGI, P.criarRo, dados, ctx);
  }

  @Put(':id')
  @Permissao('sgi.editar')
  atualizarRo(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(atualizarRoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SGI,
      P.atualizarRo,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/encerrar')
  @Permissao('sgi.editar')
  @HttpCode(200)
  encerrarRo(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(encerrarRoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SGI,
      P.encerrarRo,
      { id, alteracoes },
      ctx,
    );
  }
}

/** Gestão do SGI: objetivos. Decidir mudança e inativar objetivo: gestor (sgi.excluir). */
@Controller('objetivos')
export class ObjetivosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('sgi.ver')
  listarObjetivos(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar(SERVICES.SGI, P.listarObjetivos, {}, ctx);
  }

  @Post()
  @Permissao('sgi.editar')
  criarObjetivo(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoObjetivoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(SERVICES.SGI, P.criarObjetivo, dados, ctx);
  }

  @Put(':id')
  @Permissao('sgi.editar')
  atualizarObjetivo(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(atualizarObjetivoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SGI,
      P.atualizarObjetivo,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/situacao')
  @Permissao('sgi.excluir')
  @HttpCode(200)
  situacaoObjetivo(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(situacaoDoObjetivoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SGI,
      P.situacaoObjetivo,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/medicoes')
  @Permissao('sgi.editar')
  @HttpCode(200)
  registrarMedicao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(registrarMedicaoSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SGI,
      P.registrarMedicao,
      { id, alteracoes },
      ctx,
    );
  }
}

/** Gestão do SGI: analises-criticas. Decidir mudança e inativar objetivo: gestor (sgi.excluir). */
@Controller('analises-criticas')
export class AnalisesCriticasController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('sgi.ver')
  listarAnalises(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar(SERVICES.SGI, P.listarAnalises, {}, ctx);
  }

  @Get(':id')
  @Permissao('sgi.ver')
  obterAnalise(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(SERVICES.SGI, P.obterAnalise, { id }, ctx);
  }

  @Post()
  @Permissao('sgi.editar')
  criarAnalise(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaAnaliseCriticaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(SERVICES.SGI, P.criarAnalise, dados, ctx);
  }
}

/** Gestão do SGI: mudancas. Decidir mudança e inativar objetivo: gestor (sgi.excluir). */
@Controller('mudancas')
export class MudancasController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('sgi.ver')
  listarMudancas(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroMudancasSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar(SERVICES.SGI, P.listarMudancas, filtro, ctx);
  }

  @Get(':id')
  @Permissao('sgi.ver')
  obterMudanca(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(SERVICES.SGI, P.obterMudanca, { id }, ctx);
  }

  @Post()
  @Permissao('sgi.editar')
  criarMudanca(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaMudancaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(SERVICES.SGI, P.criarMudanca, dados, ctx);
  }

  @Post(':id/decidir')
  @Permissao('sgi.excluir')
  @HttpCode(200)
  decidirMudanca(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(decidirMudancaSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SGI,
      P.decidirMudanca,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/implementar')
  @Permissao('sgi.editar')
  @HttpCode(200)
  implementarMudanca(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(implementarMudancaSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SGI,
      P.implementarMudanca,
      { id, alteracoes },
      ctx,
    );
  }
}
