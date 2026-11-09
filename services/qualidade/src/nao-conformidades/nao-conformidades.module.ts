import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { NaoConformidadesController } from './nao-conformidades.controller.js';
import { NaoConformidadesService } from './nao-conformidades.service.js';

/** Emite `notificacoes.criar` para a Plataforma quando uma NC encerra. */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.PLATAFORMA)])],
  controllers: [NaoConformidadesController],
  providers: [NaoConformidadesService],
})
export class NaoConformidadesModule {}
