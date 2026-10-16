import {
  Body,
  Delete,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  alterarConstatacaoSchema,
  atualizarAuditoriaSchema,
  cancelarAuditoriaSchema,
  concluirAuditoriaSchema,
  filtroAuditoriasSchema,
  formalizarNcSchema,
  iniciarAuditoriaSchema,
  novaAuditoriaSchema,
  PATTERNS,
  registrarConstatacaoSchema,
  SERVICES,
  marcarItemDoKitSchema,
  filtroPerguntasSchema,
  filtroEvidenciasSchema,
  filtroModelosNcSchema,
  filtroLogDoAuditorSchema,
  planoDaAuditoriaSchema,
  type LogDoAuditor,
  filtroPromptsSchema,
  novoCriterioSchema,
  type CriterioProprio,
  novoModeloNcSchema,
  type ModeloDeNc,
  type PromptDeIa,
  novaEvidenciaPropriaSchema,
  type EvidenciaDaBiblioteca,
  novaPerguntaPropriaSchema,
  responderPerguntaSchema,
  selecionarPerguntasSchema,
  type PerguntaDeRoteiro,
  type RoteiroDaAuditoria,
  type KitPreAuditoria,
  type Auditoria,
  type AuditoriaResumo,
  type Contexto,
  type Pagina,
  type ResumoAuditorias,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.auditorias;

/**
 * Auditorias (serviço auditorias). docs/05-modulos/auditorias.md
 * Planejar, conduzir e concluir: `auditorias.editar`. Cancelar: gestor (`auditorias.excluir`).
 * Formalizar NC leva mais tempo (o serviço auditorias pede ao qualidade): prazo maior.
 */
@Controller('auditorias')
export class AuditoriasController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('auditorias.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroAuditoriasSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<AuditoriaResumo>>(
      SERVICES.AUDITORIAS,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('auditorias.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoAuditorias>(
      SERVICES.AUDITORIAS,
      P.resumo,
      {},
      ctx,
    );
  }

  @Get(':id')
  @Permissao('auditorias.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Auditoria>(
      SERVICES.AUDITORIAS,
      P.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('auditorias.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaAuditoriaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Auditoria>(
      SERVICES.AUDITORIAS,
      P.criar,
      dados,
      ctx,
    );
  }

  @Put(':id')
  @Permissao('auditorias.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      atualizarAuditoriaSchema,
      P.atualizar,
      id,
      alteracoes,
    );
  }

  @Post(':id/iniciar')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  iniciar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, iniciarAuditoriaSchema, P.iniciar, id, alteracoes);
  }

  @Post(':id/constatacoes')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  registrarConstatacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      registrarConstatacaoSchema,
      P.registrarConstatacao,
      id,
      alteracoes,
    );
  }

  @Put(':id/constatacoes')
  @Permissao('auditorias.editar')
  alterarConstatacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      alterarConstatacaoSchema,
      P.alterarConstatacao,
      id,
      alteracoes,
    );
  }

  @Post(':id/constatacoes/formalizar-nc')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  formalizarNc(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      formalizarNcSchema,
      P.formalizarNc,
      id,
      alteracoes,
      15_000,
    );
  }

  @Post(':id/concluir')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  concluir(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, concluirAuditoriaSchema, P.concluir, id, alteracoes);
  }

  @Post(':id/cancelar')
  @Permissao('auditorias.excluir')
  @HttpCode(200)
  cancelar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(ctx, cancelarAuditoriaSchema, P.cancelar, id, alteracoes);
  }

  @Get(':id/kit')
  @Permissao('auditorias.ver')
  obterKit(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<KitPreAuditoria>(
      SERVICES.AUDITORIAS,
      P.obterKit,
      { id },
      ctx,
    );
  }

  @Post(':id/kit')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  marcarItemDoKit(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      marcarItemDoKitSchema,
      P.marcarItemDoKit,
      id,
      alteracoes,
    );
  }

  @Put(':id/plano')
  @Permissao('auditorias.editar')
  salvarPlano(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      planoDaAuditoriaSchema,
      P.salvarPlano,
      id,
      alteracoes,
    );
  }

  @Get(':id/roteiro')
  @Permissao('auditorias.ver')
  obterRoteiro(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<RoteiroDaAuditoria>(
      SERVICES.AUDITORIAS,
      P.obterRoteiro,
      { id },
      ctx,
    );
  }

  @Post(':id/roteiro')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  selecionarPerguntas(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      selecionarPerguntasSchema,
      P.selecionarPerguntas,
      id,
      alteracoes,
    );
  }

  @Post(':id/roteiro/resposta')
  @Permissao('auditorias.editar')
  @HttpCode(200)
  responderPergunta(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao(
      ctx,
      responderPerguntaSchema,
      P.responderPergunta,
      id,
      alteracoes,
    );
  }

  private acao(
    ctx: Contexto,
    schema: z.ZodType,
    padrao: string,
    id: string,
    alteracoes: unknown,
    prazoMs?: number,
  ) {
    validarEntrada(schema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<Auditoria>(
      SERVICES.AUDITORIAS,
      padrao,
      { id, alteracoes },
      ctx,
      prazoMs,
    );
  }
}

/** Banco de perguntas dos roteiros (do sistema e próprias da empresa). docs/05-modulos/auditorias.md */
@Controller('perguntas-de-auditoria')
export class PerguntasDeAuditoriaController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('auditorias.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroPerguntasSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<PerguntaDeRoteiro[]>(
      SERVICES.AUDITORIAS,
      P.listarPerguntas,
      filtro,
      ctx,
    );
  }

  @Post()
  @Permissao('auditorias.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaPerguntaPropriaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<PerguntaDeRoteiro>(
      SERVICES.AUDITORIAS,
      P.criarPerguntaPropria,
      dados,
      ctx,
    );
  }

  @Delete(':id')
  @Permissao('auditorias.editar')
  excluir(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(
      SERVICES.AUDITORIAS,
      P.excluirPerguntaPropria,
      { id },
      ctx,
    );
  }
}

/** Biblioteca de evidências por cláusula (do sistema e próprias da empresa). */
@Controller('evidencias-de-auditoria')
export class EvidenciasDeAuditoriaController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('auditorias.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroEvidenciasSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<EvidenciaDaBiblioteca[]>(
      SERVICES.AUDITORIAS,
      P.listarEvidencias,
      filtro,
      ctx,
    );
  }

  @Post()
  @Permissao('auditorias.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaEvidenciaPropriaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<EvidenciaDaBiblioteca>(
      SERVICES.AUDITORIAS,
      P.criarEvidenciaPropria,
      dados,
      ctx,
    );
  }

  @Delete(':id')
  @Permissao('auditorias.editar')
  excluir(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(
      SERVICES.AUDITORIAS,
      P.excluirEvidenciaPropria,
      { id },
      ctx,
    );
  }
}

/** Banco de NCs: modelos de redação com causa raiz, ação corretiva e evidência de fechamento. */
@Controller('modelos-de-nc')
export class ModelosDeNcController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('auditorias.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroModelosNcSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<ModeloDeNc[]>(
      SERVICES.AUDITORIAS,
      P.listarModelosNc,
      filtro,
      ctx,
    );
  }

  @Post()
  @Permissao('auditorias.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoModeloNcSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<ModeloDeNc>(
      SERVICES.AUDITORIAS,
      P.criarModeloNcProprio,
      dados,
      ctx,
    );
  }

  @Delete(':id')
  @Permissao('auditorias.editar')
  excluir(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(
      SERVICES.AUDITORIAS,
      P.excluirModeloNcProprio,
      { id },
      ctx,
    );
  }
}

/** Prompts de IA prontos por norma, cláusula e categoria. */
@Controller('prompts-de-ia')
export class PromptsDeIaController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('auditorias.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroPromptsSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<PromptDeIa[]>(
      SERVICES.AUDITORIAS,
      P.listarPrompts,
      filtro,
      ctx,
    );
  }
}

/** Log do auditor: histórico consolidado para a declaração de experiência. */
@Controller('log-do-auditor')
export class LogDoAuditorController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('auditorias.ver')
  obter(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroLogDoAuditorSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<LogDoAuditor>(
      SERVICES.AUDITORIAS,
      P.logDoAuditor,
      filtro,
      ctx,
    );
  }
}

/** Critérios próprios de auditoria (Minha biblioteca): legislação, norma interna, contrato. */
@Controller('criterios-de-auditoria')
export class CriteriosDeAuditoriaController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('auditorias.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<CriterioProprio[]>(
      SERVICES.AUDITORIAS,
      P.listarCriterios,
      {},
      ctx,
    );
  }

  @Post()
  @Permissao('auditorias.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoCriterioSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<CriterioProprio>(
      SERVICES.AUDITORIAS,
      P.criarCriterio,
      dados,
      ctx,
    );
  }

  @Delete(':id')
  @Permissao('auditorias.editar')
  excluir(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(
      SERVICES.AUDITORIAS,
      P.excluirCriterio,
      { id },
      ctx,
    );
  }
}
