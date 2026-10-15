import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { EpisController } from './epis.controller.js';
import { EpisService } from './epis.service.js';

/** Fala com o Codex (cadastro de funcionários) pela fila dele. */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.CODEX)])],
  controllers: [EpisController],
  providers: [EpisService],
})
export class EpisModule {}
