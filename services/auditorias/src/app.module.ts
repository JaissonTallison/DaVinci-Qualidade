import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';
import { AuditoriasModule } from './auditorias/auditorias.module.js';
import { BuscaModule } from './busca/busca.module.js';
import { EvidenciasModule } from './evidencias/evidencias.module.js';
import { KitModule } from './kit/kit.module.js';
import { ModelosNcModule } from './modelos-nc/modelos-nc.module.js';
import { CriteriosModule } from './criterios/criterios.module.js';
import { RoteiroModule } from './roteiro/roteiro.module.js';

@Module({
  imports: [
    BuscaModule,
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    AuditoriasModule,
    KitModule,
    RoteiroModule,
    EvidenciasModule,
    ModelosNcModule,
    CriteriosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
