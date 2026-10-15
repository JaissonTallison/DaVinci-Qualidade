import { Module } from '@nestjs/common';
import { TemasModule } from '../temas/temas.module.js';
import { PrazosController } from './prazos.controller.js';
import { PrazosService } from './prazos.service.js';

@Module({
  imports: [TemasModule],
  controllers: [PrazosController],
  providers: [PrazosService],
})
export class PrazosModule {}
