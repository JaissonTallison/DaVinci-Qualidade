import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { ConsultasModule } from './consultas/consultas.module.js';
import { IntegracoesEmpresaModule } from './empresa/integracoes-empresa.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    ConsultasModule,
    IntegracoesEmpresaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
