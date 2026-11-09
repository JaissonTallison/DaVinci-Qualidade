import { Module } from '@nestjs/common';
import { EmailService } from './email.service.js';
import { FeedDeNotificacoesService } from './feed.service.js';
import { NotificacoesController } from './notificacoes.controller.js';

@Module({
  controllers: [NotificacoesController],
  providers: [
    { provide: EmailService, useFactory: () => new EmailService() },
    FeedDeNotificacoesService,
  ],
})
export class NotificacoesModule {}
