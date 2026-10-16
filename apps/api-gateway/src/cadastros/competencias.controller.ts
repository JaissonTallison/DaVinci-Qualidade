import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
  definirEpisDaFuncaoSchema,
  definirRiscosDaFuncaoSchema,
  definirTreinamentosDaFuncaoSchema,
  PATTERNS,
  SERVICES,
  type ConformidadeDoFuncionario,
  type Contexto,
  type MatrizDaFuncao,
  type RequisitoDaFuncao,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.competencias;

/**
 * Competências por função. Treinamentos e ASO moram no codex; EPIs na segurança: cada rota vai ao dono.
 * docs/05-modulos/competencias.md
 */
@Controller('competencias')
export class CompetenciasController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get('funcoes/:id/treinamentos')
  @Permissao('funcionarios.ver')
  treinamentos(@ContextoHttp() ctx: Contexto, @Param('id') funcaoId: string) {
    return this.mensageria.enviar<RequisitoDaFuncao[]>(
      SERVICES.CODEX,
      P.treinamentosDaFuncao,
      { funcaoId },
      ctx,
    );
  }

  @Put('funcoes/:id/treinamentos')
  @Permissao('funcionarios.editar')
  definirTreinamentos(
    @ContextoHttp() ctx: Contexto,
    @Param('id') funcaoId: string,
    @Body() corpo: Record<string, unknown>,
  ) {
    const dados = { ...corpo, funcaoId };
    validarEntrada(definirTreinamentosDaFuncaoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<RequisitoDaFuncao[]>(
      SERVICES.CODEX,
      P.definirTreinamentos,
      dados,
      ctx,
    );
  }

  @Get('funcoes/:id/epis')
  @Permissao('seguranca.ver')
  epis(@ContextoHttp() ctx: Contexto, @Param('id') funcaoId: string) {
    return this.mensageria.enviar<RequisitoDaFuncao[]>(
      SERVICES.SEGURANCA,
      P.episDaFuncao,
      { funcaoId },
      ctx,
    );
  }

  @Put('funcoes/:id/epis')
  @Permissao('seguranca.editar')
  definirEpis(
    @ContextoHttp() ctx: Contexto,
    @Param('id') funcaoId: string,
    @Body() corpo: Record<string, unknown>,
  ) {
    const dados = { ...corpo, funcaoId };
    validarEntrada(definirEpisDaFuncaoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<RequisitoDaFuncao[]>(
      SERVICES.SEGURANCA,
      P.definirEpis,
      dados,
      ctx,
    );
  }

  @Get('funcoes/:id/riscos')
  @Permissao('seguranca.ver')
  riscos(@ContextoHttp() ctx: Contexto, @Param('id') funcaoId: string) {
    return this.mensageria.enviar(
      SERVICES.SEGURANCA,
      P.riscosDaFuncao,
      { funcaoId },
      ctx,
    );
  }

  @Put('funcoes/:id/riscos')
  @Permissao('seguranca.editar')
  definirRiscos(
    @ContextoHttp() ctx: Contexto,
    @Param('id') funcaoId: string,
    @Body() corpo: Record<string, unknown>,
  ) {
    const dados = { ...corpo, funcaoId };
    validarEntrada(definirRiscosDaFuncaoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SEGURANCA,
      P.definirRiscos,
      dados,
      ctx,
    );
  }

  @Get('funcoes/:id/matriz-treinamentos')
  @Permissao('funcionarios.ver')
  matrizTreinamentos(
    @ContextoHttp() ctx: Contexto,
    @Param('id') funcaoId: string,
  ) {
    return this.mensageria.enviar<MatrizDaFuncao>(
      SERVICES.CODEX,
      P.matrizTreinamentos,
      { funcaoId },
      ctx,
    );
  }

  @Get('funcoes/:id/matriz-epis')
  @Permissao('seguranca.ver')
  matrizEpis(@ContextoHttp() ctx: Contexto, @Param('id') funcaoId: string) {
    return this.mensageria.enviar<MatrizDaFuncao>(
      SERVICES.SEGURANCA,
      P.matrizEpis,
      { funcaoId },
      ctx,
    );
  }

  @Get('funcionarios/:id/treinamentos')
  @Permissao('funcionarios.ver')
  conformidadeTreinamentos(
    @ContextoHttp() ctx: Contexto,
    @Param('id') funcionarioId: string,
  ) {
    return this.mensageria.enviar<ConformidadeDoFuncionario>(
      SERVICES.CODEX,
      P.conformidadeTreinamentos,
      { funcionarioId },
      ctx,
    );
  }

  @Get('funcionarios/:id/epis')
  @Permissao('seguranca.ver')
  conformidadeEpis(
    @ContextoHttp() ctx: Contexto,
    @Param('id') funcionarioId: string,
  ) {
    return this.mensageria.enviar<ConformidadeDoFuncionario>(
      SERVICES.SEGURANCA,
      P.conformidadeEpis,
      { funcionarioId },
      ctx,
    );
  }
}
