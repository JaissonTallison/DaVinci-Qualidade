import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';
import { AcidentesModule } from './acidentes/acidentes.module.js';
import { EpisModule } from './epis/epis.module.js';
import { PgrModule } from './pgr/pgr.module.js';
import { PtsModule } from './pts/pts.module.js';
import { RegistrosModule } from './registros/registros.module.js';
import { TerceirosModule } from './terceiros/terceiros.module.js';
import { PrazosModule } from './prazos/prazos.module.js';
import { BuscaModule } from './busca/busca.module.js';

@Module({
  imports: [
    BuscaModule,
    PrazosModule,
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    AcidentesModule,
    EpisModule,
    PgrModule,
    PtsModule,
    RegistrosModule,
    TerceirosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
