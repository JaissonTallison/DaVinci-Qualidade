import { Module } from '@nestjs/common';
import { EstruturaService } from './estrutura.service.js';
import { FuncionariosController } from './funcionarios.controller.js';
import { FuncionariosService } from './funcionarios.service.js';

@Module({
  controllers: [FuncionariosController],
  providers: [FuncionariosService, EstruturaService],
})
export class FuncionariosModule {}
