import { Module } from '@nestjs/common';
import { ListasController } from './listas.controller.js';
import { ListasService } from './listas.service.js';

@Module({
  controllers: [ListasController],
  providers: [ListasService],
})
export class ListasModule {}
