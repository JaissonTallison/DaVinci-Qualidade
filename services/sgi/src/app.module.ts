import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';
import { SgiModule } from './sgi/sgi.module.js';
import { PrazosModule } from './prazos/prazos.module.js';
import { BuscaModule } from './busca/busca.module.js';

@Module({
  imports: [
    BuscaModule,
    PrazosModule,
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    SgiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
