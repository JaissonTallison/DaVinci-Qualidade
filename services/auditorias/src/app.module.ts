import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';
import { AuditoriasModule } from './auditorias/auditorias.module.js';
import { BuscaModule } from './busca/busca.module.js';

@Module({
  imports: [
    BuscaModule,
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    AuditoriasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
