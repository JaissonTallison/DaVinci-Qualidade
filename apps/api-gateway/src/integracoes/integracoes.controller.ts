import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  PATTERNS,
  SERVICES,
  salvarIaSchema,
  salvarWebhookSchema,
  type ConfigDeIntegracoes,
  type Contexto,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

/** Configuração das integrações da empresa (provedores). O backend fica no serviço integracoes. */
@Controller('integracoes/config')
@Permissao('empresa.gerenciar')
export class IntegracoesController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  obter(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ConfigDeIntegracoes>(
      SERVICES.INTEGRACOES,
      PATTERNS.integracoes.obter,
      {},
      ctx,
    );
  }

  @Put('webhook')
  salvarWebhook(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(salvarWebhookSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<ConfigDeIntegracoes>(
      SERVICES.INTEGRACOES,
      PATTERNS.integracoes.salvarWebhook,
      dados,
      ctx,
    );
  }

  @Put('ia')
  salvarIa(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(salvarIaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<ConfigDeIntegracoes>(
      SERVICES.INTEGRACOES,
      PATTERNS.integracoes.salvarIa,
      dados,
      ctx,
    );
  }
}
