import { Module } from '@nestjs/common';
import { PgrService } from '../pgr/pgr.service.js';
import { PrazosController } from './prazos.controller.js';
import { PrazosService } from './prazos.service.js';

@Module({
  controllers: [PrazosController],
  providers: [PrazosService, PgrService],
})
export class PrazosModule {}
