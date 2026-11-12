import { Module } from '@nestjs/common';
import { ProcessosController } from './processos.controller.js';
import { ProcessosService } from './processos.service.js';

@Module({
  controllers: [ProcessosController],
  providers: [ProcessosService],
})
export class ProcessosModule {}
