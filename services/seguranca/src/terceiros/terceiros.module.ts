import { Module } from '@nestjs/common';
import { TerceirosController } from './terceiros.controller.js';
import { TerceirosService } from './terceiros.service.js';

@Module({ controllers: [TerceirosController], providers: [TerceirosService] })
export class TerceirosModule {}
