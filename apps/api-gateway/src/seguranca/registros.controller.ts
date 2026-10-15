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
  anularRegistroSstSchema,
  filtroRegistrosSstSchema,
  novoRegistroSstSchema,
  PATTERNS,
  SERVICES,
  type Contexto,
  type Pagina,
  type RegistroSst,
  type ResumoRegistrosSst,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.registrosSst;

/** DDS, APR, reuniões da CIPA e simulados. docs/05-modulos/registros-de-seguranca.md. Anular: gestor. */
@Controller('registros-de-seguranca')
export class RegistrosDeSegurancaController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('seguranca.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroRegistrosSstSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<RegistroSst>>(
      SERVICES.SEGURANCA,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Get('resumo')
  @Permissao('seguranca.ver')
  resumo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResumoRegistrosSst>(
      SERVICES.SEGURANCA,
      P.resumo,
      {},
      ctx,
    );
  }

  @Get(':id')
  @Permissao('seguranca.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<RegistroSst>(
      SERVICES.SEGURANCA,
      P.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('seguranca.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoRegistroSstSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<RegistroSst>(
      SERVICES.SEGURANCA,
      P.criar,
      dados,
      ctx,
    );
  }

  @Post(':id/anular')
  @Permissao('seguranca.excluir')
  @HttpCode(200)
  anular(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(anularRegistroSstSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<RegistroSst>(
      SERVICES.SEGURANCA,
      P.anular,
      { id, alteracoes },
      ctx,
    );
  }
}
