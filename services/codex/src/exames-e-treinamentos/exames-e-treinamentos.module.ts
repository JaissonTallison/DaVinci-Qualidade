import { Module } from '@nestjs/common';
import { ExamesETreinamentosController } from './exames-e-treinamentos.controller.js';
import { ExamesETreinamentosService } from './exames-e-treinamentos.service.js';

@Module({
  controllers: [ExamesETreinamentosController],
  providers: [ExamesETreinamentosService],
})
export class ExamesETreinamentosModule {}
