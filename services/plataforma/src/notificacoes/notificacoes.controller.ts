import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PATTERNS, type EmailParaEnviar } from '@davinci/types';
import { EmailService } from './email.service.js';

/** Eventos de notificação (sem resposta): quem pede não espera a entrega. */
@Controller()
export class NotificacoesController {
  constructor(private readonly email: EmailService) {}

  @EventPattern(PATTERNS.notificacoes.enviarEmail)
  async enviarEmail(@Payload() mensagem: { dados?: EmailParaEnviar }) {
    if (mensagem?.dados) await this.email.enviar(mensagem.dados);
  }
}
