import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  avaliarFornecedorSchema,
  avaliarOsSchema,
  cancelarOsSchema,
  concluirOsSchema,
  filtroNpsSchema,
  atribuirResponsavelOsEmLoteSchema,
  filtroOsSchema,
  iniciarOsSchema,
  novaOsSchema,
  registrarRespostaNpsSchema,
  PATTERNS,
  SERVICES,
  type Contexto,
  type ResumoServicos,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.servicos;

/** Resumo de Serviços para o início. docs/05-modulos/servicos.md */
@Controller('servicos')
export class ServicosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get('resumo')
  @Permissao('servicos.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoServicos>(
      SERVICES.SERVICOS,
      P.resumo,
      {},
      ctx,
    );
  }
}

/** Serviços: ordens-de-servico. Cancelar OS: gestor (servicos.excluir). */
@Controller('ordens-de-servico')
export class OrdensDeServicoController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('servicos.ver')
  listarOs(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroOsSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar(SERVICES.SERVICOS, P.listarOs, filtro, ctx);
  }

  @Get(':id')
  @Permissao('servicos.ver')
  obterOs(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar(SERVICES.SERVICOS, P.obterOs, { id }, ctx);
  }

  @Post()
  @Permissao('servicos.editar')
  criarOs(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaOsSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SERVICOS,
      P.criarOs,
      dados,
      ctx,
      15_000,
    );
  }

  @Post('responsavel-em-lote')
  @Permissao('servicos.editar')
  @HttpCode(200)
  atribuirResponsavelEmLote(
    @ContextoHttp() ctx: Contexto,
    @Body() dados: unknown,
  ) {
    validarEntrada(atribuirResponsavelOsEmLoteSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<{ atualizadas: number }>(
      SERVICES.SERVICOS,
      P.atribuirResponsavelOsEmLote,
      dados,
      ctx,
    );
  }

  @Post(':id/iniciar')
  @Permissao('servicos.editar')
  @HttpCode(200)
  iniciarOs(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(iniciarOsSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SERVICOS,
      P.iniciarOs,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/concluir')
  @Permissao('servicos.editar')
  @HttpCode(200)
  concluirOs(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(concluirOsSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SERVICOS,
      P.concluirOs,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/cancelar')
  @Permissao('servicos.excluir')
  @HttpCode(200)
  cancelarOs(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(cancelarOsSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SERVICOS,
      P.cancelarOs,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/avaliacao')
  @Permissao('servicos.editar')
  @HttpCode(200)
  avaliarOs(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(avaliarOsSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SERVICOS,
      P.avaliarOs,
      { id, alteracoes },
      ctx,
    );
  }
}

/** Serviços: nps. Cancelar OS: gestor (servicos.excluir). */
@Controller('nps')
export class NpsController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('servicos.ver')
  listarNps(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroNpsSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar(SERVICES.SERVICOS, P.listarNps, filtro, ctx);
  }

  @Post()
  @Permissao('servicos.editar')
  registrarNps(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(registrarRespostaNpsSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SERVICOS,
      P.registrarNps,
      dados,
      ctx,
      15_000,
    );
  }
}

/** Serviços: avaliacoes-de-fornecedores. Cancelar OS: gestor (servicos.excluir). */
@Controller('avaliacoes-de-fornecedores')
export class AvaliacoesDeFornecedoresController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('servicos.ver')
  listarAvaliacoes(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar(
      SERVICES.SERVICOS,
      P.listarAvaliacoes,
      {},
      ctx,
    );
  }

  @Post()
  @Permissao('servicos.editar')
  avaliarFornecedor(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(avaliarFornecedorSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar(
      SERVICES.SERVICOS,
      P.avaliarFornecedor,
      dados,
      ctx,
      15_000,
    );
  }
}
