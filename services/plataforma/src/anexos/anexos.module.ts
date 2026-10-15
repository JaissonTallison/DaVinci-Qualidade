import { Module } from '@nestjs/common';
import { AnexosController } from './anexos.controller.js';
import { AnexosService } from './anexos.service.js';

@Module({ controllers: [AnexosController], providers: [AnexosService] })
export class AnexosModule {}
