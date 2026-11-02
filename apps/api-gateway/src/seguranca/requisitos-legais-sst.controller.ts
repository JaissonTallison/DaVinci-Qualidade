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
  atualizarRequisitoSstSchema,
  avaliarRequisitoSstSchema,
  filtroRequisitosSstSchema,
  novoRequisitoSstSchema,
  PATTERNS,
  SERVICES,
  type Contexto,
  type RequisitoLegalSst,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.requisitosSst;
const S = SERVICES.SEGURANCA;

/** Requisitos legais de SST e a avaliação de atendimento. */
@Controller('requisitos-legais-sst')
export class RequisitosLegaisSstController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('seguranca.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroRequisitosSstSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<RequisitoLegalSst[]>(S, P.listar, filtro, ctx);
  }

  @Get(':id')
  @Permissao('seguranca.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<RequisitoLegalSst>(S, P.obter, { id }, ctx);
  }

  @Post()
  @Permissao('seguranca.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoRequisitoSstSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<RequisitoLegalSst>(S, P.criar, dados, ctx);
  }

  @Put(':id')
  @Permissao('seguranca.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(atualizarRequisitoSstSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<RequisitoLegalSst>(
      S,
      P.atualizar,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/avaliacao')
  @Permissao('seguranca.editar')
  @HttpCode(200)
  avaliar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(avaliarRequisitoSstSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<RequisitoLegalSst>(
      S,
      P.avaliar,
      { id, alteracoes },
      ctx,
    );
  }
}
