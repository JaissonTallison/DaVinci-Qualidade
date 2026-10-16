import { Module } from '@nestjs/common';
import { ModelosNcController } from './modelos-nc.controller.js';
import { ModelosNcService } from './modelos-nc.service.js';

@Module({ controllers: [ModelosNcController], providers: [ModelosNcService] })
export class ModelosNcModule {}
