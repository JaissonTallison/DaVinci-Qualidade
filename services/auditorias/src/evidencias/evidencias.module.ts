import { Module } from '@nestjs/common';
import { EvidenciasController } from './evidencias.controller.js';
import { EvidenciasService } from './evidencias.service.js';

@Module({ controllers: [EvidenciasController], providers: [EvidenciasService] })
export class EvidenciasModule {}
