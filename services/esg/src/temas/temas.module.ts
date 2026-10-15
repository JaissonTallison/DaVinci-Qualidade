import { Module } from '@nestjs/common';
import { TemasController } from './temas.controller.js';
import { TemasService } from './temas.service.js';

@Module({
  controllers: [TemasController],
  providers: [TemasService],
  exports: [TemasService],
})
export class TemasModule {}
