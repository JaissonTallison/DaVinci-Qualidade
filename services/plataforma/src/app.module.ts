import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { AnexosModule } from './anexos/anexos.module.js';
import { HealthController } from './health.controller.js';
import { NotificacoesModule } from './notificacoes/notificacoes.module.js';

@Module({
  imports: [
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    NotificacoesModule,
    AnexosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
