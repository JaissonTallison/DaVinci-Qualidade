import { Module } from '@nestjs/common';
import { RegistrosController } from './registros.controller.js';
import { RegistrosService } from './registros.service.js';

@Module({ controllers: [RegistrosController], providers: [RegistrosService] })
export class RegistrosModule {}
