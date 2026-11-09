import { Controller, Get, Param, Put, Query } from '@nestjs/common';
import {
  PATTERNS,
  SERVICES,
  type Contexto,
  type FiltroDeNotificacoes,
  type ResumoDeNotificacoes,
} from '@davinci/types';
import { SoLogin } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';

/** Central de notificações do usuário logado (serviço Plataforma). É do próprio usuário: só precisa de login. */
@Controller('notificacoes')
@SoLogin()
export class NotificacoesController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  listar(@ContextoHttp() ctx: Contexto, @Query('filtro') filtro?: string) {
    const f: FiltroDeNotificacoes =
      filtro === 'todas' || filtro === 'mencoes' ? filtro : 'nao-lidas';
    return this.mensageria.enviar<ResumoDeNotificacoes>(
      SERVICES.PLATAFORMA,
      PATTERNS.notificacoes.listar,
      { filtro: f },
      ctx,
    );
  }

  @Get('contagem')
  contar(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<{ naoLidas: number }>(
      SERVICES.PLATAFORMA,
      PATTERNS.notificacoes.contar,
      {},
      ctx,
    );
  }

  @Put('marcar-todas')
  marcarTodas(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<void>(
      SERVICES.PLATAFORMA,
      PATTERNS.notificacoes.marcarTodas,
      {},
      ctx,
    );
  }

  @Put(':id/lida')
  marcarLida(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<void>(
      SERVICES.PLATAFORMA,
      PATTERNS.notificacoes.marcarLida,
      { id },
      ctx,
    );
  }
}
