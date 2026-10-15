import { Module } from '@nestjs/common';
import { PgrController } from './pgr.controller.js';
import { PgrService } from './pgr.service.js';

@Module({ controllers: [PgrController], providers: [PgrService] })
export class PgrModule {}
