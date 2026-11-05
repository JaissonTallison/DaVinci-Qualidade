import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { z } from 'zod';
import {
  atualizarBrigadistaSchema,
  atualizarEquipamentoSchema,
  filtroTurmaSchema,
  inspecionarEquipamentoSchema,
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
  type OrdemDeServicoSst,
  type PlanoDeEmergencia,
  type ResumoDaTurma,
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

/** Investigação estruturada do acidente. docs/05-modulos/acidentes.md */
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
