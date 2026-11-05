import { Module } from '@nestjs/common';
import { AcidentesController } from './acidentes.controller.js';
import { AcidentesService } from './acidentes.service.js';

@Module({
  controllers: [AcidentesController],
  providers: [AcidentesService],
  exports: [AcidentesService],
})
export class AcidentesModule {}
