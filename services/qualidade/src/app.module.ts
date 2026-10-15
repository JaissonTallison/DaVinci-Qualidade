import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';
import { NaoConformidadesModule } from './nao-conformidades/nao-conformidades.module.js';

@Module({
  imports: [
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    NaoConformidadesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
