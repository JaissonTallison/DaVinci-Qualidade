import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { z } from 'zod';
import {
  atualizarBrigadistaSchema,
  atualizarEquipamentoSchema,
  configuracaoEsocialSchema,
  dadosDaCatSchema,
  filtroTurmaSchema,
  gerarEventoSchema,
  inspecionarEquipamentoSchema,
  marcarEnviadoSchema,
  novoBrigadistaSchema,
  novoEquipamentoSchema,
  ordemDeServicoSstSchema,
  PATTERNS,
  planoDeEmergenciaSchema,
  registrarInvestigacaoSchema,
  SERVICES,
  situacaoDoEquipamentoSchema,
  type Acidente,
  type Brigadista,
  type Contexto,
  type Equipamento,
  type EventoEsocial,
  type OrdemDeServicoSst,
  type PainelEsocial,
  type PlanoDeEmergencia,
  type ResumoDaTurma,
  type Risco,
  type ServiceName,
  type Turma,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

/** Base: envio ao serviço e ações `{ id, alteracoes }` validadas no gateway. */
abstract class Base {
  constructor(protected readonly mensageria: MensageriaService) {}
  protected enviar<R>(
    ctx: Contexto,
    padrao: string,
    dados: unknown,
    servico: ServiceName = SERVICES.SEGURANCA,
  ) {
    return this.mensageria.enviar<R>(servico, padrao, dados, ctx);
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

/** Investigação estruturada e complemento eSocial da CAT. docs/05-modulos/acidentes.md */
@Controller('acidentes')
export class InvestigacaoDoAcidenteController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Put(':id/investigacao')
  @Permissao('seguranca.editar')
  investigacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Acidente>(
      ctx,
      registrarInvestigacaoSchema,
      PATTERNS.acidentes.registrarInvestigacao,
      id,
      a,
    );
  }
  @Put(':id/dados-cat')
  @Permissao('seguranca.editar')
  dadosCat(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Acidente>(
      ctx,
      dadosDaCatSchema,
      PATTERNS.acidentes.registrarDadosCat,
      id,
      a,
    );
  }
}

/** Agente nocivo do risco para o S-2240. */
@Controller('riscos')
export class EsocialDoRiscoController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Put(':id/esocial')
  @Permissao('seguranca.editar')
  definir(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.enviar<Risco>(ctx, PATTERNS.riscos.definirEsocial, {
      id,
      alteracoes: a,
    });
  }
}

/** eSocial SST. docs/05-modulos/esocial.md */
@Controller('esocial')
export class EsocialController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get()
  @Permissao('seguranca.ver')
  painel(@ContextoHttp() ctx: Contexto) {
    return this.enviar<PainelEsocial>(ctx, PATTERNS.esocial.painel, {});
  }
  @Put('configuracao')
  @Permissao('seguranca.editar')
  configurar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(configuracaoEsocialSchema, dados, ctx.rastreioId);
    return this.enviar<PainelEsocial>(
      ctx,
      PATTERNS.esocial.salvarConfiguracao,
      dados,
    );
  }
  @Post('eventos')
  @Permissao('seguranca.editar')
  gerar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(gerarEventoSchema, dados, ctx.rastreioId);
    return this.enviar<EventoEsocial>(ctx, PATTERNS.esocial.gerar, dados);
  }
  /** O XML para baixar, como arquivo. */
  @Get('eventos/:id/xml')
  @Permissao('seguranca.ver')
  async xml(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const r = await this.enviar<{ nome: string; xml: string }>(
      ctx,
      PATTERNS.esocial.xml,
      { id },
    );
    res.setHeader('content-type', 'application/xml; charset=utf-8');
    res.setHeader('content-disposition', `attachment; filename="${r.nome}"`);
    res.setHeader('x-content-type-options', 'nosniff');
    res.send(r.xml);
  }
  @Post('eventos/:id/enviado')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  enviado(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    validarEntrada(marcarEnviadoSchema, a, ctx.rastreioId);
    return this.enviar<EventoEsocial>(ctx, PATTERNS.esocial.marcarEnviado, {
      id,
      alteracoes: a,
    });
  }
}

const E = PATTERNS.emergencia;

@Controller('equipamentos')
export class EquipamentosController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get()
  @Permissao('seguranca.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<Equipamento[]>(ctx, E.listarEquipamentos, {});
  }
  @Get(':id')
  @Permissao('seguranca.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.enviar<Equipamento>(ctx, E.obterEquipamento, { id });
  }
  @Post()
  @Permissao('seguranca.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoEquipamentoSchema, dados, ctx.rastreioId);
    return this.enviar<Equipamento>(ctx, E.criarEquipamento, dados);
  }
  @Put(':id')
  @Permissao('seguranca.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Equipamento>(
      ctx,
      atualizarEquipamentoSchema,
      E.atualizarEquipamento,
      id,
      a,
    );
  }
  @Post(':id/situacao')
  @Permissao('seguranca.excluir')
  @HttpCode(200)
  situacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Equipamento>(
      ctx,
      situacaoDoEquipamentoSchema,
      E.situacaoEquipamento,
      id,
      a,
    );
  }
  @Post(':id/inspecao')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  inspecionar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Equipamento>(
      ctx,
      inspecionarEquipamentoSchema,
      E.inspecionarEquipamento,
      id,
      a,
    );
  }
}

@Controller('brigada')
export class BrigadaController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get()
  @Permissao('seguranca.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<Brigadista[]>(ctx, E.listarBrigada, {});
  }
  @Post()
  @Permissao('seguranca.editar')
  incluir(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoBrigadistaSchema, dados, ctx.rastreioId);
    return this.enviar<Brigadista>(ctx, E.incluirBrigadista, dados);
  }
  @Put(':id')
  @Permissao('seguranca.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Brigadista>(
      ctx,
      atualizarBrigadistaSchema,
      E.atualizarBrigadista,
      id,
      a,
    );
  }
  @Delete(':id')
  @Permissao('seguranca.editar')
  retirar(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.enviar(ctx, E.retirarBrigadista, { id });
  }
}

@Controller('plano-de-emergencia')
export class PlanoDeEmergenciaController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get()
  @Permissao('seguranca.ver')
  obter(@ContextoHttp() ctx: Contexto) {
    return this.enviar<PlanoDeEmergencia | null>(ctx, E.obterPlano, {});
  }
  @Put()
  @Permissao('seguranca.editar')
  salvar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(planoDeEmergenciaSchema, dados, ctx.rastreioId);
    return this.enviar<PlanoDeEmergencia>(ctx, E.salvarPlano, dados);
  }
}

/** Ordem de serviço de segurança por função (NR-1). */
@Controller('ordens-sst')
export class OrdensSstController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get(':funcaoId')
  @Permissao('seguranca.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('funcaoId') funcaoId: string) {
    return this.enviar<OrdemDeServicoSst | null>(ctx, E.obterOrdemSst, {
      funcaoId,
    });
  }
  @Put(':funcaoId')
  @Permissao('seguranca.editar')
  salvar(
    @ContextoHttp() ctx: Contexto,
    @Param('funcaoId') funcaoId: string,
    @Body() corpo: Record<string, unknown>,
  ) {
    const dados = { ...corpo, funcaoId };
    validarEntrada(ordemDeServicoSstSchema, dados, ctx.rastreioId);
    return this.enviar<OrdemDeServicoSst>(ctx, E.salvarOrdemSst, dados);
  }
}

/** Turmas de treinamento (codex): lista de presença e certificados. */
@Controller('turmas-de-treinamento')
export class TurmasController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get()
  @Permissao('funcionarios.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<ResumoDaTurma[]>(
      ctx,
      PATTERNS.treinamentos.turmas,
      {},
      SERVICES.CODEX,
    );
  }
  @Get(':treinamentoId/:data')
  @Permissao('funcionarios.ver')
  obter(
    @ContextoHttp() ctx: Contexto,
    @Param('treinamentoId') treinamentoId: string,
    @Param('data') data: string,
  ) {
    validarEntrada(filtroTurmaSchema, { treinamentoId, data }, ctx.rastreioId);
    return this.enviar<Turma>(
      ctx,
      PATTERNS.treinamentos.turma,
      { treinamentoId, data },
      SERVICES.CODEX,
    );
  }
}
