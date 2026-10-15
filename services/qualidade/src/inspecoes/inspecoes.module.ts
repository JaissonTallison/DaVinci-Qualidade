import { Module } from '@nestjs/common';
import { InspecoesController } from './inspecoes.controller.js';
import { InspecoesService } from './inspecoes.service.js';
import { ModelosDeInspecaoService } from './modelos.service.js';

@Module({
  controllers: [InspecoesController],
  providers: [InspecoesService, ModelosDeInspecaoService],
})
export class InspecoesModule {}
