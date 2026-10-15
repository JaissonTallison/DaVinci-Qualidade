import { Module } from '@nestjs/common';
import { NaoConformidadesController } from './nao-conformidades.controller.js';
import { NaoConformidadesService } from './nao-conformidades.service.js';

@Module({
  controllers: [NaoConformidadesController],
  providers: [NaoConformidadesService],
})
export class NaoConformidadesModule {}
