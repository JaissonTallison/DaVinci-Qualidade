import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import {
  PATTERNS,
  SERVICES,
  novaChaveSchema,
  type ChaveCriada,
  type ChaveDeApi,
  type Contexto,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

/**
 * API de acesso (Integrações): chaves de API da empresa para sistemas externos lerem o DaVinci.
 * O backend fica em Identidade (gera, revoga e valida); o gateway já confere a chave a cada chamada
 * (auth/guarda.ts). Aqui só expomos a gestão das chaves para a tela, com a permissão da empresa.
 */
@Controller('integracoes/chaves')
@Permissao('empresa.gerenciar')
export class ChavesDeApiController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  listar(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ChaveDeApi[]>(
      SERVICES.IDENTIDADE,
      PATTERNS.chavesApi.listar,
      {},
      ctx,
    );
  }

  @Post()
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novaChaveSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<ChaveCriada>(
      SERVICES.IDENTIDADE,
      PATTERNS.chavesApi.criar,
      dados,
      ctx,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  revogar(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<void>(
      SERVICES.IDENTIDADE,
      PATTERNS.chavesApi.revogar,
      { id },
      ctx,
    );
  }
}
