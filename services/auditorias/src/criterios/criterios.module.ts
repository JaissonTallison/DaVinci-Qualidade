import { Module } from '@nestjs/common';
import { CriteriosController } from './criterios.controller.js';
import { CriteriosService } from './criterios.service.js';

@Module({ controllers: [CriteriosController], providers: [CriteriosService] })
export class CriteriosModule {}
