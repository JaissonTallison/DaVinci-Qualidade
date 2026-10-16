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
import type { z } from 'zod';
import {
  analisarReclamacaoSchema,
  atualizarContratoSchema,
  atualizarServicoDoCatalogoSchema,
  criarConviteSchema,
  encerrarContratoSchema,
  encerrarReclamacaoSchema,
  filtroReclamacoesSchema,
  novaReclamacaoSchema,
  novoContratoSchema,
  novoServicoDoCatalogoSchema,
  PATTERNS,
  registrarExecucaoSchema,
  responderPesquisaSchema,
  responderReclamacaoSchema,
  SERVICES,
  situacaoDoServicoSchema,
  type ConviteDePesquisa,
  type Contexto,
  type Contrato,
  type OrdemDeServico,
  type PesquisaPublica,
  type Reclamacao,
  type ResumoReclamacoes,
  type ServicoDoCatalogo,
} from '@davinci/types';
import { Permissao, Publica } from '../auth/decoradores.js';
import { ContextoHttp, RastreioHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.servicos;

/** Base: envio ao serviço servicos e ações `{ id, alteracoes }` validadas aqui. */
abstract class Base {
  constructor(protected readonly mensageria: MensageriaService) {}
  protected enviar<R>(ctx: Contexto, padrao: string, dados: unknown) {
    return this.mensageria.enviar<R>(SERVICES.SERVICOS, padrao, dados, ctx);
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

@Controller('ordens-de-servico')
export class ExecucaoDaOsController extends Base {
  constructor(mensageria: MensageriaService) {
    super(mensageria);
  }
  @Put(':id/execucao')
  @Permissao('servicos.editar')
  registrar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.alterar<OrdemDeServico>(
      ctx,
      registrarExecucaoSchema,
      P.registrarExecucao,
      id,
      alteracoes,
    );
  }
}

@Controller('catalogo-de-servicos')
export class CatalogoDeServicosController extends Base {
  constructor(mensageria: MensageriaService) {
    super(mensageria);
  }
  @Get()
  @Permissao('servicos.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<ServicoDoCatalogo[]>(ctx, P.listarCatalogo, {});
  }
  @Post()
  @Permissao('servicos.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoServicoDoCatalogoSchema, dados, ctx.rastreioId);
    return this.enviar<ServicoDoCatalogo>(ctx, P.criarServico, dados);
  }
  @Put(':id')
  @Permissao('servicos.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<ServicoDoCatalogo>(
      ctx,
      atualizarServicoDoCatalogoSchema,
      P.atualizarServico,
      id,
      a,
    );
  }
  @Post(':id/situacao')
  @Permissao('servicos.editar')
  @HttpCode(200)
  situacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<ServicoDoCatalogo>(
      ctx,
      situacaoDoServicoSchema,
      P.situacaoServico,
      id,
      a,
    );
  }
}

@Controller('contratos')
export class ContratosController extends Base {
  constructor(mensageria: MensageriaService) {
    super(mensageria);
  }
  @Get()
  @Permissao('servicos.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<Contrato[]>(ctx, P.listarContratos, {});
  }
  @Get(':id')
  @Permissao('servicos.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.enviar<Contrato>(ctx, P.obterContrato, { id });
  }
  @Post()
  @Permissao('servicos.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoContratoSchema, dados, ctx.rastreioId);
    return this.enviar<Contrato>(ctx, P.criarContrato, dados);
  }
  @Put(':id')
  @Permissao('servicos.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Contrato>(
      ctx,
      atualizarContratoSchema,
      P.atualizarContrato,
      id,
      a,
    );
  }
  @Post(':id/encerrar')
  @Permissao('servicos.excluir')
  @HttpCode(200)
  encerrar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Contrato>(
      ctx,
      encerrarContratoSchema,
      P.encerrarContrato,
      id,
      a,
    );
  }
}

@Controller('reclamacoes')
export class ReclamacoesController extends Base {
  constructor(mensageria: MensageriaService) {
    super(mensageria);
  }
  @Get()
  @Permissao('servicos.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroReclamacoesSchema, filtro, ctx.rastreioId);
    return this.enviar<Reclamacao[]>(ctx, P.listarReclamacoes, filtro);
  }
  @Get('resumo')
  @Permissao('servicos.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.enviar<ResumoReclamacoes>(ctx, P.resumoReclamacoes, {});
  }
  @Get(':id')
  @Permissao('servicos.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.enviar<Reclamacao>(ctx, P.obterReclamacao, { id });
  }
  @Post()
  @Permissao('servicos.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaReclamacaoSchema, dados, ctx.rastreioId);
    return this.enviar<Reclamacao>(ctx, P.criarReclamacao, dados);
  }
  @Post(':id/analise')
  @Permissao('servicos.editar')
  @HttpCode(200)
  analisar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Reclamacao>(
      ctx,
      analisarReclamacaoSchema,
      P.analisarReclamacao,
      id,
      a,
    );
  }
  @Post(':id/resposta')
  @Permissao('servicos.editar')
  @HttpCode(200)
  responder(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Reclamacao>(
      ctx,
      responderReclamacaoSchema,
      P.responderReclamacao,
      id,
      a,
    );
  }
  @Post(':id/encerrar')
  @Permissao('servicos.editar')
  @HttpCode(200)
  encerrar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() a: unknown,
  ) {
    return this.alterar<Reclamacao>(
      ctx,
      encerrarReclamacaoSchema,
      P.encerrarReclamacao,
      id,
      a,
    );
  }
}

@Controller('pesquisas')
export class PesquisasController extends Base {
  constructor(mensageria: MensageriaService) {
    super(mensageria);
  }
  @Get()
  @Permissao('servicos.ver')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.enviar<ConviteDePesquisa[]>(ctx, P.listarConvites, {});
  }
  @Post()
  @Permissao('servicos.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(criarConviteSchema, dados, ctx.rastreioId);
    return this.enviar<ConviteDePesquisa>(ctx, P.criarConvite, dados);
  }

  /** Pública: o cliente abre o link sem login. O token (256 bits) é a credencial. */
  @Get('publica/:token')
  @Publica()
  obterPublica(
    @RastreioHttp() rastreioId: string,
    @Param('token') token: string,
  ) {
    return this.mensageria.enviar<PesquisaPublica>(
      SERVICES.SERVICOS,
      P.obterPesquisaPublica,
      { token },
      { rastreioId },
    );
  }

  @Post('publica/:token')
  @Publica()
  @HttpCode(200)
  responderPublica(
    @RastreioHttp() rastreioId: string,
    @Param('token') token: string,
    @Body() corpo: Record<string, unknown>,
  ) {
    const dados = { ...corpo, token };
    validarEntrada(responderPesquisaSchema as z.ZodType, dados, rastreioId);
    return this.mensageria.enviar<PesquisaPublica>(
      SERVICES.SERVICOS,
      P.responderPesquisaPublica,
      dados,
      { rastreioId },
    );
  }
}
