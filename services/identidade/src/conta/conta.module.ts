import { Module } from '@nestjs/common';
import { IdentidadeModule } from '../identidade/identidade.module.js';
import { ContaController } from './conta.controller.js';
import { ContaService } from './conta.service.js';

@Module({
  imports: [IdentidadeModule],
  controllers: [ContaController],
  providers: [ContaService],
  exports: [ContaService],
})
export class ContaModule {}
