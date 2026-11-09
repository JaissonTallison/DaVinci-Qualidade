import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { PlanosDeAcaoController } from './planos-de-acao.controller.js';
import { PlanosDeAcaoService } from './planos-de-acao.service.js';

/** Emite `notificacoes.criar` para a Plataforma quando um plano encerra. */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.PLATAFORMA)])],
  controllers: [PlanosDeAcaoController],
  providers: [PlanosDeAcaoService],
})
export class PlanosDeAcaoModule {}
