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
  atualizarRiscoSchema,
  cancelarPtSchema,
  encerrarPtSchema,
  filtroPtsSchema,
  filtroRiscosSchema,
  liberarPtSchema,
  novaPtSchema,
  novoRiscoSchema,
  PATTERNS,
  SERVICES,
  situacaoDoRiscoSchema,
  type Contexto,
  type Pagina,
  type PermissaoDeTrabalho,
  type ResumoPgr,
  type ResumoPts,
  type Risco,
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
  return m.enviar<R>(SERVICES.SEGURANCA, padrao, { id, alteracoes }, ctx);
}

/** PGR: inventário de riscos. docs/05-modulos/pgr.md. Inativar risco: gestor. */
@Controller('riscos')
export class RiscosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('seguranca.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroRiscosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Risco[]>(
      SERVICES.SEGURANCA,
      PATTERNS.riscos.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('seguranca.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoPgr>(
      SERVICES.SEGURANCA,
      PATTERNS.riscos.resumo,
      {},
      ctx,
    );
  }

  @Get(':id')
  @Permissao('seguranca.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Risco>(
      SERVICES.SEGURANCA,
      PATTERNS.riscos.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('seguranca.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoRiscoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Risco>(
      SERVICES.SEGURANCA,
      PATTERNS.riscos.criar,
      dados,
      ctx,
    );
  }

  @Put(':id')
  @Permissao('seguranca.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<Risco>(
      this.mensageria,
      ctx,
      atualizarRiscoSchema,
      PATTERNS.riscos.atualizar,
      id,
      alteracoes,
    );
  }

  @Post(':id/situacao')
  @Permissao('seguranca.excluir')
  @HttpCode(200)
  mudarSituacao(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<Risco>(
      this.mensageria,
      ctx,
      situacaoDoRiscoSchema,
      PATTERNS.riscos.mudarSituacao,
      id,
      alteracoes,
    );
  }
}

/** Permissões de trabalho. docs/05-modulos/permissoes-de-trabalho.md. Liberar exige seguranca.liberar-pt. */
@Controller('permissoes-de-trabalho')
export class PermissoesDeTrabalhoController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('seguranca.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroPtsSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<PermissaoDeTrabalho>>(
      SERVICES.SEGURANCA,
      PATTERNS.pts.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('seguranca.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoPts>(
      SERVICES.SEGURANCA,
      PATTERNS.pts.resumo,
      {},
      ctx,
    );
  }

  @Get(':id')
  @Permissao('seguranca.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<PermissaoDeTrabalho>(
      SERVICES.SEGURANCA,
      PATTERNS.pts.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('seguranca.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaPtSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<PermissaoDeTrabalho>(
      SERVICES.SEGURANCA,
      PATTERNS.pts.criar,
      dados,
      ctx,
    );
  }

  @Post(':id/liberar')
  @Permissao('seguranca.liberar-pt')
  @HttpCode(200)
  liberar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<PermissaoDeTrabalho>(
      this.mensageria,
      ctx,
      liberarPtSchema,
      PATTERNS.pts.liberar,
      id,
      alteracoes,
    );
  }

  @Post(':id/encerrar')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  encerrar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<PermissaoDeTrabalho>(
      this.mensageria,
      ctx,
      encerrarPtSchema,
      PATTERNS.pts.encerrar,
      id,
      alteracoes,
    );
  }

  @Post(':id/cancelar')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  cancelar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    return acao<PermissaoDeTrabalho>(
      this.mensageria,
      ctx,
      cancelarPtSchema,
      PATTERNS.pts.cancelar,
      id,
      alteracoes,
    );
  }
}
