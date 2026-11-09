import { Controller } from '@nestjs/common';
import {
  EventPattern,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import {
  PATTERNS,
  type Contexto as Ctx,
  type EmailParaEnviar,
  type FiltroDeNotificacoes,
  type NovaNotificacao,
} from '@davinci/types';
import { EmailService } from './email.service.js';
import { FeedDeNotificacoesService } from './feed.service.js';

/** E-mail (evento) e central de notificações (feed por usuário). */
@Controller()
export class NotificacoesController {
  constructor(
    private readonly email: EmailService,
    private readonly feed: FeedDeNotificacoesService,
  ) {}

  @EventPattern(PATTERNS.notificacoes.enviarEmail)
  async enviarEmail(@Payload() mensagem: { dados?: EmailParaEnviar }) {
    if (mensagem?.dados) await this.email.enviar(mensagem.dados);
  }

  @EventPattern(PATTERNS.notificacoes.criar)
  async criar(@Payload() mensagem: { dados?: NovaNotificacao }) {
    if (mensagem?.dados) await this.feed.criar(mensagem.dados);
  }

  @MessagePattern(PATTERNS.notificacoes.listar)
  listar(
    @Contexto() ctx: Ctx,
    @Dados() dados: { filtro?: FiltroDeNotificacoes },
  ) {
    return this.feed.listar(ctx, dados?.filtro ?? 'nao-lidas');
  }

  @MessagePattern(PATTERNS.notificacoes.contar)
  contar(@Contexto() ctx: Ctx) {
    return this.feed.contar(ctx);
  }

  @MessagePattern(PATTERNS.notificacoes.marcarLida)
  marcarLida(@Contexto() ctx: Ctx, @Dados() dados: { id: string }) {
    return this.feed.marcarLida(ctx, dados.id);
  }

  @MessagePattern(PATTERNS.notificacoes.marcarTodas)
  marcarTodas(@Contexto() ctx: Ctx) {
    return this.feed.marcarTodas(ctx);
  }
}
