import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { AmbientalModule } from './ambiental/ambiental.module.js';
import { BuscaModule } from './busca/busca.module.js';
import { HealthController } from './health.controller.js';
import { PrazosModule } from './prazos/prazos.module.js';

@Module({
  imports: [
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    AmbientalModule,
    PrazosModule,
    BuscaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
