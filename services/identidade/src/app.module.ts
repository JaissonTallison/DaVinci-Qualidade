import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';
import { AdministracaoModule } from './administracao/administracao.module.js';
import { ContaModule } from './conta/conta.module.js';
import { EmpresaModule } from './empresa/empresa.module.js';
import { RecuperacaoModule } from './recuperacao/recuperacao.module.js';
import { IdentidadeModule } from './identidade/identidade.module.js';

@Module({
  imports: [
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
    IdentidadeModule,
    AdministracaoModule,
    EmpresaModule,
    ContaModule,
    RecuperacaoModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
