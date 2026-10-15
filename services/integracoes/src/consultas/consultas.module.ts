import { Module } from '@nestjs/common';
import { ConsultasController } from './consultas.controller.js';
import { BUSCAR, ConsultasService } from './consultas.service.js';

@Module({
  controllers: [ConsultasController],
  providers: [
    ConsultasService,
    { provide: BUSCAR, useValue: globalThis.fetch.bind(globalThis) },
  ],
})
export class ConsultasModule {}
