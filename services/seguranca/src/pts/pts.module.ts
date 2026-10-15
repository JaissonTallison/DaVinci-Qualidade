import { Module } from '@nestjs/common';
import { PtsController } from './pts.controller.js';
import { PtsService } from './pts.service.js';

@Module({ controllers: [PtsController], providers: [PtsService] })
export class PtsModule {}
