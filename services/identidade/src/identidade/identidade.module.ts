import { Module } from '@nestjs/common';
import { IdentidadeController } from './identidade.controller.js';
import { IdentidadeService } from './identidade.service.js';

@Module({
  controllers: [IdentidadeController],
  providers: [IdentidadeService],
  exports: [IdentidadeService],
})
export class IdentidadeModule {}
