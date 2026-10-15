import { Module } from '@nestjs/common';
import { AmbientalModule } from '../ambiental/ambiental.module.js';
import { PrazosController } from './prazos.controller.js';
import { PrazosService } from './prazos.service.js';

@Module({
  imports: [AmbientalModule],
  controllers: [PrazosController],
  providers: [PrazosService],
})
export class PrazosModule {}
