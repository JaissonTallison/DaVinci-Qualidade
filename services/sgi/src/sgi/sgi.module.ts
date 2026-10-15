import { Module } from '@nestjs/common';
import { SgiController } from './sgi.controller.js';
import { SgiService } from './sgi.service.js';

@Module({ controllers: [SgiController], providers: [SgiService] })
export class SgiModule {}
