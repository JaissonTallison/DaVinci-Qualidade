import { Module } from '@nestjs/common';
import { ProgramacaoController } from './programacao.controller.js';
import { ProgramacaoService } from './programacao.service.js';

@Module({
  controllers: [ProgramacaoController],
  providers: [ProgramacaoService],
})
export class ProgramacaoModule {}
