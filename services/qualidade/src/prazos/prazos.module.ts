import { Module } from '@nestjs/common';
import { CalibracaoService } from '../calibracao/calibracao.service.js';
import { PrazosController } from './prazos.controller.js';
import { PrazosService } from './prazos.service.js';

@Module({
  controllers: [PrazosController],
  providers: [PrazosService, CalibracaoService],
})
export class PrazosModule {}
