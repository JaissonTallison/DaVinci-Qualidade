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
  anularEntregaSchema,
  atualizarEpiSchema,
  devolverEntregaSchema,
  filtroEntregasSchema,
  filtroEpisSchema,
  novoEpiSchema,
  PATTERNS,
  registrarEntregaSchema,
  SERVICES,
  situacaoDoEpiSchema,
  type Contexto,
  type EntregaEpi,
  type Epi,
  type Pagina,
  type ResumoEpis,
} from '@davinci/types';
import type { z } from 'zod';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.epis;

/** Catálogo de EPIs e entregas (serviço seguranca). docs/05-modulos/epis.md. Anular entrega: gestor. */
@Controller('epis')
export class EpisController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('seguranca.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroEpisSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Epi[]>(
      SERVICES.SEGURANCA,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('seguranca.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoEpis>(
      SERVICES.SEGURANCA,
      P.resumo,
      {},
      ctx,
    );
  }

  @Get('entregas')
  @Permissao('seguranca.ver')
  listarEntregas(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroEntregasSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<EntregaEpi>>(
      SERVICES.SEGURANCA,
      P.listarEntregas,
      filtro,
      ctx,
    );
  }

  @Get(':id')
  @Permissao('seguranca.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Epi>(
      SERVICES.SEGURANCA,
      P.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('seguranca.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoEpiSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Epi>(SERVICES.SEGURANCA, P.criar, dados, ctx);
  }

  @Put(':id')
  @Permissao('seguranca.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao<Epi>(ctx, atualizarEpiSchema, P.atualizar, id, alteracoes);
  }

  @Post(':id/situacao')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  mudarSituacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao<Epi>(
      ctx,
      situacaoDoEpiSchema,
      P.mudarSituacao,
      id,
      alteracoes,
    );
  }

  /** O seguranca consulta o Codex antes de gravar: prazo maior que o padrão. */
  @Post('entregas')
  @Permissao('seguranca.editar')
  registrarEntrega(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(registrarEntregaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<EntregaEpi>(
      SERVICES.SEGURANCA,
      P.registrarEntrega,
      dados,
      ctx,
      15_000,
    );
  }

  @Post('entregas/:id/devolver')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  devolver(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao<EntregaEpi>(
      ctx,
      devolverEntregaSchema,
      P.devolver,
      id,
      alteracoes,
    );
  }

  @Post('entregas/:id/anular')
  @Permissao('seguranca.excluir')
  @HttpCode(200)
  anular(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return this.acao<EntregaEpi>(
      ctx,
      anularEntregaSchema,
      P.anular,
      id,
      alteracoes,
    );
  }

  private acao<R>(
    ctx: Contexto,
    schema: z.ZodType,
    padrao: string,
    id: string,
    alteracoes: unknown,
  ) {
    validarEntrada(schema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<R>(
      SERVICES.SEGURANCA,
      padrao,
      { id, alteracoes },
      ctx,
    );
  }
}
