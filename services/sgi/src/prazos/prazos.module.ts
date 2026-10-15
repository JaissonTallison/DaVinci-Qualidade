import { Module } from '@nestjs/common';
import { SgiService } from '../sgi/sgi.service.js';
import { PrazosController } from './prazos.controller.js';
import { PrazosService } from './prazos.service.js';

@Module({
  controllers: [PrazosController],
  providers: [PrazosService, SgiService],
})
export class PrazosModule {}
