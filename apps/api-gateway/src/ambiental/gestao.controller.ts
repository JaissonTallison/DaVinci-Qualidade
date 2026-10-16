import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { z } from 'zod';
import {
  atualizarDestinadorSchema,
  atualizarObrigacaoSchema,
  atualizarProgramaSchema,
  comunicarOcorrenciaSchema,
  cumprirObrigacaoSchema,
  encerrarOcorrenciaSchema,
  medirProgramaSchema,
  ncDaOcorrenciaSchema,
  novaObrigacaoSchema,
  novaOcorrenciaSchema,
  novoDestinadorSchema,
  novoProgramaSchema,
  PATTERNS,
  registrarProducaoSchema,
  SERVICES,
  type Contexto,
  type Destinador,
  type Ecoeficiencia,
  type InventarioDeResiduos,
  type ObrigacaoLegal,
  type OcorrenciaAmbiental,
  type ProducaoDoMes,
  type ProgramaAmbiental,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.ambiental;

/** Base: envio ao serviço ambiental e ações `{ id, alteracoes }` validadas aqui. */
abstract class Base {
  constructor(protected readonly mensageria: MensageriaService) {}
  protected enviar<R>(ctx: Contexto, padrao: string, dados: unknown) {
    return this.mensageria.enviar<R>(SERVICES.AMBIENTAL, padrao, dados, ctx);
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

@Controller('ocorrencias-ambientais')
export class OcorrenciasAmbientaisController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get()
  @Permissao('ambiental.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<OcorrenciaAmbiental[]>(ctx, P.listarOcorrencias, {});
  }
  @Get(':id')
  @Permissao('ambiental.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.enviar<OcorrenciaAmbiental>(ctx, P.obterOcorrencia, { id });
  }
  @Post()
  @Permissao('ambiental.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaOcorrenciaSchema, dados, ctx.rastreioId);
    return this.enviar<OcorrenciaAmbiental>(ctx, P.criarOcorrencia, dados);
  }
  @Post(':id/comunicacao')
  @Permissao('ambiental.editar')
  @HttpCode(200)
  comunicar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<OcorrenciaAmbiental>(
      ctx,
      comunicarOcorrenciaSchema,
      P.comunicarOcorrencia,
      id,
      a,
    );
  }
  @Post(':id/nc')
  @Permissao('ambiental.editar')
  @HttpCode(200)
  nc(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<OcorrenciaAmbiental>(
      ctx,
      ncDaOcorrenciaSchema,
      P.ncDaOcorrencia,
      id,
      a,
    );
  }
  @Post(':id/encerrar')
  @Permissao('ambiental.editar')
  @HttpCode(200)
  encerrar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<OcorrenciaAmbiental>(
      ctx,
      encerrarOcorrenciaSchema,
      P.encerrarOcorrencia,
      id,
      a,
    );
  }
}

@Controller('obrigacoes-legais')
export class ObrigacoesLegaisController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get()
  @Permissao('ambiental.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<ObrigacaoLegal[]>(ctx, P.listarObrigacoes, {});
  }
  @Post()
  @Permissao('ambiental.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaObrigacaoSchema, dados, ctx.rastreioId);
    return this.enviar<ObrigacaoLegal>(ctx, P.criarObrigacao, dados);
  }
  @Put(':id')
  @Permissao('ambiental.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<ObrigacaoLegal>(
      ctx,
      atualizarObrigacaoSchema,
      P.atualizarObrigacao,
      id,
      a,
    );
  }
  @Post(':id/cumprimento')
  @Permissao('ambiental.editar')
  @HttpCode(200)
  cumprir(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<ObrigacaoLegal>(
      ctx,
      cumprirObrigacaoSchema,
      P.cumprirObrigacao,
      id,
      a,
    );
  }
  @Delete(':id')
  @Permissao('ambiental.excluir')
  excluir(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.enviar(ctx, P.excluirObrigacao, { id });
  }
}

@Controller('destinadores')
export class DestinadoresController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get()
  @Permissao('ambiental.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<Destinador[]>(ctx, P.listarDestinadores, {});
  }
  @Post()
  @Permissao('ambiental.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoDestinadorSchema, dados, ctx.rastreioId);
    return this.enviar<Destinador>(ctx, P.criarDestinador, dados);
  }
  @Put(':id')
  @Permissao('ambiental.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Destinador>(
      ctx,
      atualizarDestinadorSchema,
      P.atualizarDestinador,
      id,
      a,
    );
  }
}

@Controller('ecoeficiencia')
export class EcoeficienciaController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get()
  @Permissao('ambiental.ver')
  obter(@ContextoHttp() ctx: Contexto, @Query('ano') ano?: string) {
    return this.enviar<Ecoeficiencia>(ctx, P.ecoeficiencia, { ano });
  }
  @Get('inventario-de-residuos')
  @Permissao('ambiental.ver')
  inventario(@ContextoHttp() ctx: Contexto, @Query('ano') ano?: string) {
    return this.enviar<InventarioDeResiduos>(ctx, P.inventarioDeResiduos, {
      ano,
    });
  }
  @Get('producao')
  @Permissao('ambiental.ver')
  producao(@ContextoHttp() ctx: Contexto, @Query('ano') ano?: string) {
    return this.enviar<ProducaoDoMes[]>(ctx, P.listarProducao, { ano });
  }
  @Post('producao')
  @Permissao('ambiental.editar')
  registrarProducao(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(registrarProducaoSchema, dados, ctx.rastreioId);
    return this.enviar<ProducaoDoMes[]>(ctx, P.registrarProducao, dados);
  }
}

@Controller('programas-ambientais')
export class ProgramasAmbientaisController extends Base {
  constructor(m: MensageriaService) {
    super(m);
  }
  @Get()
  @Permissao('ambiental.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<ProgramaAmbiental[]>(ctx, P.listarProgramas, {});
  }
  @Get(':id')
  @Permissao('ambiental.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.enviar<ProgramaAmbiental>(ctx, P.obterPrograma, { id });
  }
  @Post()
  @Permissao('ambiental.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoProgramaSchema, dados, ctx.rastreioId);
    return this.enviar<ProgramaAmbiental>(ctx, P.criarPrograma, dados);
  }
  @Put(':id')
  @Permissao('ambiental.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<ProgramaAmbiental>(
      ctx,
      atualizarProgramaSchema,
      P.atualizarPrograma,
      id,
      a,
    );
  }
  @Post(':id/medicao')
  @Permissao('ambiental.editar')
  @HttpCode(200)
  medir(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<ProgramaAmbiental>(
      ctx,
      medirProgramaSchema,
      P.medirPrograma,
      id,
      a,
    );
  }
}
