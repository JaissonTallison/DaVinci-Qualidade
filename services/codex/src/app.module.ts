import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';
import { ParceirosModule } from './parceiros/parceiros.module.js';
import { ReferenciasModule } from './referencias/referencias.module.js';

@Module({
  imports: [
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    ParceirosModule,
    ReferenciasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
