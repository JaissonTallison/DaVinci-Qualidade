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
  atualizarFuncaoSchema,
  atualizarFuncionarioSchema,
  atualizarSetorSchema,
  desligarFuncionarioSchema,
  filtroCadastroSimplesSchema,
  filtroFuncionariosSchema,
  novaFuncaoSchema,
  novoFuncionarioSchema,
  novoSetorSchema,
  PATTERNS,
  readmitirFuncionarioSchema,
  SERVICES,
  situacaoDoCadastroSchema,
  type Contexto,
  type Funcao,
  type Funcionario,
  type FuncionarioResumo,
  type Pagina,
  type SetorDaEmpresa,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

/** Validação no gateway e envio de `{ id, alteracoes }` ao codex. */
function acao<R>(
  mensageria: MensageriaService,
  ctx: Contexto,
  schema: z.ZodType,
  padrao: string,
  id: string,
  alteracoes: unknown,
) {
  validarEntrada(schema, alteracoes, ctx.rastreioId);
  return mensageria.enviar<R>(SERVICES.CODEX, padrao, { id, alteracoes }, ctx);
}

/** Funcionários (serviço codex). docs/05-modulos/funcionarios.md */
@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('funcionarios.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroFuncionariosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<FuncionarioResumo>>(
      SERVICES.CODEX,
      PATTERNS.funcionarios.listar,
      filtro,
      ctx,
    );
  }

  @Get(':id')
  @Permissao('funcionarios.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Funcionario>(
      SERVICES.CODEX,
      PATTERNS.funcionarios.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('funcionarios.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoFuncionarioSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Funcionario>(
      SERVICES.CODEX,
      PATTERNS.funcionarios.criar,
      dados,
      ctx,
    );
  }

  @Put(':id')
  @Permissao('funcionarios.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<Funcionario>(
      this.mensageria,
      ctx,
      atualizarFuncionarioSchema,
      PATTERNS.funcionarios.atualizar,
      id,
      alteracoes,
    );
  }

  @Post(':id/desligar')
  @Permissao('funcionarios.editar')
  @HttpCode(200)
  desligar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<Funcionario>(
      this.mensageria,
      ctx,
      desligarFuncionarioSchema,
      PATTERNS.funcionarios.desligar,
      id,
      alteracoes,
    );
  }

  @Post(':id/readmitir')
  @Permissao('funcionarios.editar')
  @HttpCode(200)
  readmitir(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<Funcionario>(
      this.mensageria,
      ctx,
      readmitirFuncionarioSchema,
      PATTERNS.funcionarios.readmitir,
      id,
      alteracoes,
    );
  }
}

/** Setores da empresa (serviço codex). */
@Controller('setores-da-empresa')
export class SetoresDaEmpresaController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('funcionarios.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroCadastroSimplesSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<SetorDaEmpresa[]>(
      SERVICES.CODEX,
      PATTERNS.setoresEmpresa.listar,
      filtro,
      ctx,
    );
  }

  @Post()
  @Permissao('funcionarios.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoSetorSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<SetorDaEmpresa>(
      SERVICES.CODEX,
      PATTERNS.setoresEmpresa.criar,
      dados,
      ctx,
    );
  }

  @Put(':id')
  @Permissao('funcionarios.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<SetorDaEmpresa>(
      this.mensageria,
      ctx,
      atualizarSetorSchema,
      PATTERNS.setoresEmpresa.atualizar,
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
    return acao<SetorDaEmpresa>(
      this.mensageria,
      ctx,
      situacaoDoCadastroSchema,
      PATTERNS.setoresEmpresa.mudarSituacao,
      id,
      alteracoes,
    );
  }
}

/** Funções (serviço codex). */
@Controller('funcoes')
export class FuncoesController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('funcionarios.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroCadastroSimplesSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Funcao[]>(
      SERVICES.CODEX,
      PATTERNS.funcoes.listar,
      filtro,
      ctx,
    );
  }

  @Post()
  @Permissao('funcionarios.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaFuncaoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Funcao>(
      SERVICES.CODEX,
      PATTERNS.funcoes.criar,
      dados,
      ctx,
    );
  }

  @Put(':id')
  @Permissao('funcionarios.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<Funcao>(
      this.mensageria,
      ctx,
      atualizarFuncaoSchema,
      PATTERNS.funcoes.atualizar,
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
    return acao<Funcao>(
      this.mensageria,
      ctx,
      situacaoDoCadastroSchema,
      PATTERNS.funcoes.mudarSituacao,
      id,
      alteracoes,
    );
  }
}
