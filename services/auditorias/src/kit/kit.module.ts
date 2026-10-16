import { Module } from '@nestjs/common';
import { KitController } from './kit.controller.js';
import { KitService } from './kit.service.js';

@Module({ controllers: [KitController], providers: [KitService] })
export class KitModule {}
