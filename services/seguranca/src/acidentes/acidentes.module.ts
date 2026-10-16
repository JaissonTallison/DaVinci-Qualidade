import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { AcidentesController } from './acidentes.controller.js';
import { AcidentesService } from './acidentes.service.js';

/** O acidentado do S-2210 vem do cadastro de funcionários (codex). */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.CODEX)])],
  controllers: [AcidentesController],
  providers: [AcidentesService],
  exports: [AcidentesService],
})
export class AcidentesModule {}
