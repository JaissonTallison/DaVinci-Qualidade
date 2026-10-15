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
  anularRegistroSchema,
  atualizarTreinamentoSchema,
  filtroCadastroSimplesSchema,
  filtroDoFuncionarioSchema,
  filtroVencimentosSchema,
  novoTreinamentoSchema,
  PATTERNS,
  registrarAsoSchema,
  registrarTurmaSchema,
  SERVICES,
  situacaoDoTreinamentoSchema,
  type Aso,
  type Contexto,
  type ResumoVencimentos,
  type Treinamento,
  type TreinamentoRealizado,
  type Vencimento,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

function acao<R>(
  m: MensageriaService,
  ctx: Contexto,
  schema: z.ZodType,
  padrao: string,
  id: string,
  alteracoes: unknown,
) {
  validarEntrada(schema, alteracoes, ctx.rastreioId);
  return m.enviar<R>(SERVICES.CODEX, padrao, { id, alteracoes }, ctx);
}

/** Exames ocupacionais (ASO). docs/05-modulos/exames-e-treinamentos.md */
@Controller('asos')
export class AsosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('funcionarios.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroDoFuncionarioSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Aso[]>(
      SERVICES.CODEX,
      PATTERNS.asos.listar,
      filtro,
      ctx,
    );
  }

  @Post()
  @Permissao('funcionarios.editar')
  registrar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(registrarAsoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Aso>(
      SERVICES.CODEX,
      PATTERNS.asos.registrar,
      dados,
      ctx,
    );
  }

  @Post(':id/anular')
  @Permissao('funcionarios.editar')
  @HttpCode(200)
  anular(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<Aso>(
      this.mensageria,
      ctx,
      anularRegistroSchema,
      PATTERNS.asos.anular,
      id,
      alteracoes,
    );
  }
}

/** Catálogo de treinamentos e turmas realizadas. */
@Controller('treinamentos')
export class TreinamentosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('funcionarios.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroCadastroSimplesSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Treinamento[]>(
      SERVICES.CODEX,
      PATTERNS.treinamentos.listar,
      filtro,
      ctx,
    );
  }

  @Get('realizados')
  @Permissao('funcionarios.ver')
  realizados(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroDoFuncionarioSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<TreinamentoRealizado[]>(
      SERVICES.CODEX,
      PATTERNS.treinamentos.realizados,
      filtro,
      ctx,
    );
  }

  @Post()
  @Permissao('funcionarios.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoTreinamentoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Treinamento>(
      SERVICES.CODEX,
      PATTERNS.treinamentos.criar,
      dados,
      ctx,
    );
  }

  @Post('turmas')
  @Permissao('funcionarios.editar')
  registrarTurma(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(registrarTurmaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<TreinamentoRealizado[]>(
      SERVICES.CODEX,
      PATTERNS.treinamentos.registrarTurma,
      dados,
      ctx,
    );
  }

  @Post('realizados/:id/anular')
  @Permissao('funcionarios.editar')
  @HttpCode(200)
  anularRealizado(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<TreinamentoRealizado>(
      this.mensageria,
      ctx,
      anularRegistroSchema,
      PATTERNS.treinamentos.anularRealizado,
      id,
      alteracoes,
    );
  }

  @Put(':id')
  @Permissao('funcionarios.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<Treinamento>(
      this.mensageria,
      ctx,
      atualizarTreinamentoSchema,
      PATTERNS.treinamentos.atualizar,
      id,
      alteracoes,
    );
  }

  @Post(':id/situacao')
  @Permissao('funcionarios.editar')
  @HttpCode(200)
  mudarSituacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<Treinamento>(
      this.mensageria,
      ctx,
      situacaoDoTreinamentoSchema,
      PATTERNS.treinamentos.mudarSituacao,
      id,
      alteracoes,
    );
  }
}

/** ASO e treinamentos que vencem, de todos os funcionários ativos. */
@Controller('vencimentos')
export class VencimentosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('funcionarios.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroVencimentosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Vencimento[]>(
      SERVICES.CODEX,
      PATTERNS.vencimentos.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('funcionarios.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoVencimentos>(
      SERVICES.CODEX,
      PATTERNS.vencimentos.resumo,
      {},
      ctx,
    );
  }
}
