import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { BuscaModule } from './busca/busca.module.js';
import { HealthController } from './health.controller.js';
import { PrazosModule } from './prazos/prazos.module.js';
import { ServicosModule } from './servicos/servicos.module.js';

@Module({
  imports: [
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    ServicosModule,
    PrazosModule,
    BuscaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
