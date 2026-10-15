import { Module } from '@nestjs/common';
import { EmpresaController } from './empresa.controller.js';
import { EmpresaService } from './empresa.service.js';
import { ChavesService } from './chaves.service.js';

@Module({
  controllers: [EmpresaController],
  providers: [EmpresaService, ChavesService],
})
export class EmpresaModule {}
