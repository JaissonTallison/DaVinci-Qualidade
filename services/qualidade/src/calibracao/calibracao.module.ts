import { Module } from '@nestjs/common';
import { CalibracaoController } from './calibracao.controller.js';
import { CalibracaoService } from './calibracao.service.js';

@Module({ controllers: [CalibracaoController], providers: [CalibracaoService] })
export class CalibracaoModule {}
