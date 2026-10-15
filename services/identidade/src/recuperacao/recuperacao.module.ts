import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { RecuperacaoController } from './recuperacao.controller.js';
import { RecuperacaoService } from './recuperacao.service.js';

/** Fala com a Plataforma (envio de e-mail) pela fila dela. */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.PLATAFORMA)])],
  controllers: [RecuperacaoController],
  providers: [RecuperacaoService],
})
export class RecuperacaoModule {}
