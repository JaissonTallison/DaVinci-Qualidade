import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { InspecoesController } from './inspecoes.controller.js';
import { InspecoesService } from './inspecoes.service.js';
import { ModelosDeInspecaoService } from './modelos.service.js';

/** Fala com o Codex (cadastro de fornecedores) pela fila dele. */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.CODEX)])],
  controllers: [InspecoesController],
  providers: [InspecoesService, ModelosDeInspecaoService],
})
export class InspecoesModule {}
