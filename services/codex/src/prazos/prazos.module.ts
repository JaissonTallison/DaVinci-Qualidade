import { Module } from '@nestjs/common';
import { ExamesETreinamentosService } from '../exames-e-treinamentos/exames-e-treinamentos.service.js';
import { PrazosController } from './prazos.controller.js';
import { PrazosService } from './prazos.service.js';

@Module({
  controllers: [PrazosController],
  providers: [PrazosService, ExamesETreinamentosService],
})
export class PrazosModule {}
