import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { GestaoAmbientalController } from './gestao.controller.js';
import { GestaoAmbientalService } from './gestao.service.js';

/** A NC da ocorrência ambiental nasce na qualidade. */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.QUALIDADE)])],
  controllers: [GestaoAmbientalController],
  providers: [GestaoAmbientalService],
  exports: [GestaoAmbientalService],
})
export class GestaoAmbientalModule {}
