import { Module } from '@nestjs/common';
import { IntegracoesEmpresaController } from './integracoes-empresa.controller.js';
import { IntegracoesEmpresaService } from './integracoes-empresa.service.js';

@Module({
  controllers: [IntegracoesEmpresaController],
  providers: [IntegracoesEmpresaService],
})
export class IntegracoesEmpresaModule {}
