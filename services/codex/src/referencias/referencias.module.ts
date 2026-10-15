import { Module } from '@nestjs/common';
import { ReferenciasController } from './referencias.controller.js';
import { ReferenciasService } from './referencias.service.js';

@Module({
  controllers: [ReferenciasController],
  providers: [ReferenciasService],
})
export class ReferenciasModule {}
