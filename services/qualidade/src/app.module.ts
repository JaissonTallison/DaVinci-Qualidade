import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';
import { NaoConformidadesModule } from './nao-conformidades/nao-conformidades.module.js';
import { PlanosDeAcaoModule } from './planos-de-acao/planos-de-acao.module.js';
import { InspecoesModule } from './inspecoes/inspecoes.module.js';
import { CalibracaoModule } from './calibracao/calibracao.module.js';
import { PrazosModule } from './prazos/prazos.module.js';
import { BuscaModule } from './busca/busca.module.js';

@Module({
  imports: [
    BuscaModule,
    PrazosModule,
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    NaoConformidadesModule,
    PlanosDeAcaoModule,
    InspecoesModule,
    CalibracaoModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
