import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { PaineisController } from './paineis.controller.js';
import { PaineisService } from './paineis.service.js';

/** O painel pergunta a cada dono de dado; o aviso pede os destinatários ao Identidade e o envio à Plataforma. */
@Module({
  imports: [
    ClientsModule.register(
      [
        SERVICES.QUALIDADE,
        SERVICES.AUDITORIAS,
        SERVICES.SEGURANCA,
        SERVICES.CODEX,
        SERVICES.SGI,
        SERVICES.SERVICOS,
        SERVICES.AMBIENTAL,
        SERVICES.ESG,
        SERVICES.IDENTIDADE,
        SERVICES.PLATAFORMA,
      ].map(rmqClientOptions),
    ),
  ],
  controllers: [PaineisController],
  providers: [PaineisService],
})
export class PaineisModule {}
