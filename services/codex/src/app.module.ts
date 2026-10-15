import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';
import { ParceirosModule } from './parceiros/parceiros.module.js';
import { ReferenciasModule } from './referencias/referencias.module.js';
import { FuncionariosModule } from './funcionarios/funcionarios.module.js';
import { ExamesETreinamentosModule } from './exames-e-treinamentos/exames-e-treinamentos.module.js';
import { PrazosModule } from './prazos/prazos.module.js';
import { BuscaModule } from './busca/busca.module.js';

@Module({
  imports: [
    BuscaModule,
    PrazosModule,
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    ParceirosModule,
    ReferenciasModule,
    FuncionariosModule,
    ExamesETreinamentosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
