import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  PATTERNS,
  SERVICES,
  confirmar2faSchema,
  desativar2faSchema,
  salvarPreferenciaSchema,
  salvarTemaSchema,
  type CodigosDeRecuperacao,
  type Contexto,
  type Inicio2fa,
  type SegurancaDaConta,
  type Tema,
} from '@davinci/types';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';
import { LiberadaComPendencia, SoLogin } from './decoradores.js';

/**
 * Segurança da PRÓPRIA conta (Identidade). Só exige login: o dono é sempre quem está no token.
 * Ver a segurança e ativar o 2FA funcionam com a pendência "perfil exige 2FA".
 */
@Controller('conta')
@SoLogin()
export class ContaController {
  constructor(private readonly mensageria: MensageriaService) {}

  /** O token de renovação (cabeçalho) só serve para marcar "esta sessão" na lista. */
  @Get('seguranca')
  @LiberadaComPendencia()
  seguranca(
    @ContextoHttp() ctx: Contexto,
    @Headers('x-token-renovacao') tokenRenovacao?: string,
  ) {
    return this.mensageria.enviar<SegurancaDaConta>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.seguranca,
      { tokenRenovacao },
      ctx,
    );
  }

  /** Tema da interface (claro | escuro), salvo no perfil da pessoa. */
  @Put('tema')
  salvarTema(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(salvarTemaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<{ tema: Tema }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.salvarTema,
      dados,
      ctx,
    );
  }

  /** Preferências da interface (colunas das listas…), salvas no perfil da pessoa. */
  @Get('preferencias/:chave')
  obterPreferencia(
    @ContextoHttp() ctx: Contexto,
    @Param('chave') chave: string,
  ) {
    return this.mensageria.enviar<{ valor: unknown }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.obterPreferencia,
      { chave },
      ctx,
    );
  }

  @Put('preferencias/:chave')
  salvarPreferencia(
    @ContextoHttp() ctx: Contexto,
    @Param('chave') chave: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(
      salvarPreferenciaSchema,
      { ...dados, chave },
      ctx.rastreioId,
    );
    return this.mensageria.enviar<{ valor: unknown }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.salvarPreferencia,
      { ...dados, chave },
      ctx,
    );
  }

  @Post('2fa/iniciar')
  @LiberadaComPendencia()
  @HttpCode(200)
  iniciar2fa(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<Inicio2fa>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.iniciar2fa,
      {},
      ctx,
    );
  }

  @Post('2fa/confirmar')
  @LiberadaComPendencia()
  @HttpCode(200)
  confirmar2fa(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(confirmar2faSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<CodigosDeRecuperacao>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.confirmar2fa,
      dados,
      ctx,
    );
  }

  @Post('2fa/desativar')
  @HttpCode(200)
  desativar2fa(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(desativar2faSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<{ desativado: true }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.desativar2fa,
      dados,
      ctx,
    );
  }

  @Post('2fa/codigos')
  @HttpCode(200)
  novosCodigos(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(confirmar2faSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<CodigosDeRecuperacao>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.novosCodigos,
      dados,
      ctx,
    );
  }

  @Post('sessoes/encerrar-outras')
  @HttpCode(200)
  encerrarOutras(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    return this.mensageria.enviar<{ encerradas: number }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.encerrarOutras,
      dados,
      ctx,
    );
  }

  @Post('sessoes/:id/encerrar')
  @HttpCode(200)
  encerrarSessao(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<{ encerrada: true }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.encerrarSessao,
      { id },
      ctx,
    );
  }

  @Post('navegadores/esquecer')
  @HttpCode(200)
  esquecerNavegadores(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<{ esquecidos: number }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.esquecerNavegadores,
      {},
      ctx,
    );
  }
}
