import { Module } from '@nestjs/common';
import { ServicosModule } from '../servicos/servicos.module.js';
import { PrazosController } from './prazos.controller.js';
import { PrazosService } from './prazos.service.js';

@Module({
  imports: [ServicosModule],
  controllers: [PrazosController],
  providers: [PrazosService],
})
export class PrazosModule {}
