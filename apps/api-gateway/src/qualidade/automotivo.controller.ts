import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { z } from 'zod';
import {
  atualizarFmeaSchema,
  atualizarPlanoDeControleSchema,
  atualizarPpapSchema,
  decidirPpapSchema,
  novoFmeaSchema,
  novoPlanoDeControleSchema,
  novoPpapSchema,
  PATTERNS,
  SERVICES,
  submeterPpapSchema,
  type Contexto,
  type Fmea,
  type FmeaResumo,
  type PlanoDeControle,
  type PlanoDeControleResumo,
  type Ppap,
  type PpapResumo,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.automotivo;

/** Automotivo (IATF 16949) no serviço qualidade. docs/05-modulos/automotivo.md */
abstract class Base {
  constructor(protected readonly mensageria: MensageriaService) {}
  protected enviar<R>(ctx: Contexto, padrao: string, dados: unknown) {
    return this.mensageria.enviar<R>(SERVICES.QUALIDADE, padrao, dados, ctx);
  }
  protected alterar<R>(
    ctx: Contexto,
    schema: z.ZodType,
    padrao: string,
    id: string,
    alteracoes: unknown,
  ) {
    validarEntrada(schema, alteracoes, ctx.rastreioId);
    return this.enviar<R>(ctx, padrao, { id, alteracoes });
  }
}

@Controller('fmeas')
export class FmeasController extends Base {
  constructor(mensageria: MensageriaService) {
    super(mensageria);
  }

  @Get()
  @Permissao('qualidade.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<FmeaResumo[]>(ctx, P.listarFmeas, {});
  }
  @Get(':id')
  @Permissao('qualidade.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.enviar<Fmea>(ctx, P.obterFmea, { id });
  }
  @Post()
  @Permissao('qualidade.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoFmeaSchema, dados, ctx.rastreioId);
    return this.enviar<Fmea>(ctx, P.criarFmea, dados);
  }
  @Put(':id')
  @Permissao('qualidade.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.alterar<Fmea>(
      ctx,
      atualizarFmeaSchema,
      P.atualizarFmea,
      id,
      alteracoes,
    );
  }
}

@Controller('planos-de-controle')
export class PlanosDeControleController extends Base {
  constructor(mensageria: MensageriaService) {
    super(mensageria);
  }

  @Get()
  @Permissao('qualidade.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<PlanoDeControleResumo[]>(ctx, P.listarPlanos, {});
  }
  @Get(':id')
  @Permissao('qualidade.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.enviar<PlanoDeControle>(ctx, P.obterPlano, { id });
  }
  @Post()
  @Permissao('qualidade.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoPlanoDeControleSchema, dados, ctx.rastreioId);
    return this.enviar<PlanoDeControle>(ctx, P.criarPlano, dados);
  }
  @Put(':id')
  @Permissao('qualidade.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.alterar<PlanoDeControle>(
      ctx,
      atualizarPlanoDeControleSchema,
      P.atualizarPlano,
      id,
      alteracoes,
    );
  }
}

@Controller('ppaps')
export class PpapsController extends Base {
  constructor(mensageria: MensageriaService) {
    super(mensageria);
  }

  @Get()
  @Permissao('qualidade.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<PpapResumo[]>(ctx, P.listarPpaps, {});
  }
  @Get(':id')
  @Permissao('qualidade.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.enviar<Ppap>(ctx, P.obterPpap, { id });
  }
  @Post()
  @Permissao('qualidade.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoPpapSchema, dados, ctx.rastreioId);
    return this.enviar<Ppap>(ctx, P.criarPpap, dados);
  }
  @Put(':id')
  @Permissao('qualidade.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.alterar<Ppap>(
      ctx,
      atualizarPpapSchema,
      P.atualizarPpap,
      id,
      alteracoes,
    );
  }
  @Post(':id/submeter')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  submeter(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.alterar<Ppap>(
      ctx,
      submeterPpapSchema,
      P.submeterPpap,
      id,
      alteracoes,
    );
  }
  @Post(':id/decisao')
  @Permissao('qualidade.editar')
  @HttpCode(200)
  decidir(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.alterar<Ppap>(
      ctx,
      decidirPpapSchema,
      P.decidirPpap,
      id,
      alteracoes,
    );
  }
}
