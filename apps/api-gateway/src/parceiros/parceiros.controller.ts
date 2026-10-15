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
  PATTERNS,
  SERVICES,
  atualizarParceiroSchema,
  filtroParceirosSchema,
  inativarParceiroSchema,
  novoParceiroSchema,
  reativarParceiroSchema,
  type Contexto,
  type Pagina,
  type Parceiro,
  type ParceiroResumo,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

/** Parceiros de negócio (Codex). Contrato: docs/02-arquitetura/mensagens-e-erros.md */
@Controller('parceiros')
export class ParceirosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('parceiros.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroParceirosSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<Pagina<ParceiroResumo>>(
      SERVICES.CODEX,
      PATTERNS.parceiros.listar,
      filtro,
      ctx,
    );
  }

  @Get(':id')
  @Permissao('parceiros.ver')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Parceiro>(
      SERVICES.CODEX,
      PATTERNS.parceiros.obter,
      { id },
      ctx,
    );
  }

  @Post()
  @Permissao('parceiros.editar')
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoParceiroSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Parceiro>(
      SERVICES.CODEX,
      PATTERNS.parceiros.criar,
      dados,
      ctx,
    );
  }

  @Put(':id')
  @Permissao('parceiros.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(atualizarParceiroSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<Parceiro>(
      SERVICES.CODEX,
      PATTERNS.parceiros.atualizar,
      { id, alteracoes },
      ctx,
    );
  }

  @Post(':id/inativar')
  @Permissao('parceiros.inativar')
  @HttpCode(200)
  inativar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(inativarParceiroSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Parceiro>(
      SERVICES.CODEX,
      PATTERNS.parceiros.inativar,
      { ...dados, id },
      ctx,
    );
  }

  @Post(':id/reativar')
  @Permissao('parceiros.inativar')
  @HttpCode(200)
  reativar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(reativarParceiroSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Parceiro>(
      SERVICES.CODEX,
      PATTERNS.parceiros.reativar,
      { ...dados, id },
      ctx,
    );
  }
}
