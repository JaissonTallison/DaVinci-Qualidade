import { Module } from '@nestjs/common';
import { RoteiroController } from './roteiro.controller.js';
import { RoteiroService } from './roteiro.service.js';

@Module({ controllers: [RoteiroController], providers: [RoteiroService] })
export class RoteiroModule {}
