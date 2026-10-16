import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { CompetenciasController } from './competencias.controller.js';
import { CompetenciasEpisService } from './competencias.service.js';

/** Pessoas e funções vêm do Codex, pela fila dele. */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.CODEX)])],
  controllers: [CompetenciasController],
  providers: [CompetenciasEpisService],
})
export class CompetenciasModule {}
