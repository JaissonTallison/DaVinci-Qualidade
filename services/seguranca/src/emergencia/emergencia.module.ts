import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { EmergenciaController } from './emergencia.controller.js';
import { EmergenciaService } from './emergencia.service.js';

/** O brigadista vem do cadastro de funcionários (codex). */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.CODEX)])],
  controllers: [EmergenciaController],
  providers: [EmergenciaService],
  exports: [EmergenciaService],
})
export class EmergenciaModule {}
