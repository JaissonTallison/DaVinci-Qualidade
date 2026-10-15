import { Module } from '@nestjs/common';
import { PlanosDeAcaoController } from './planos-de-acao.controller.js';
import { PlanosDeAcaoService } from './planos-de-acao.service.js';

@Module({
  controllers: [PlanosDeAcaoController],
  providers: [PlanosDeAcaoService],
})
export class PlanosDeAcaoModule {}
