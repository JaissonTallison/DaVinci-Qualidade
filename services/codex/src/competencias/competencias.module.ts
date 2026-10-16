import { Module } from '@nestjs/common';
import { CompetenciasController } from './competencias.controller.js';
import { CompetenciasService } from './competencias.service.js';

@Module({
  controllers: [CompetenciasController],
  providers: [CompetenciasService],
})
export class CompetenciasModule {}
