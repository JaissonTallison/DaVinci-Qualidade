import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ClientsModule } from '@nestjs/microservices';
import { createObserveModule } from '@nestjs/observe';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICE_NAMES } from '@davinci/types';
import { PerfisController } from './administracao/perfis.controller.js';
import { UsuariosController } from './administracao/usuarios.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { ContaController } from './auth/conta.controller.js';
import { EmpresaController } from './empresa/empresa.controller.js';
import { GuardaDeAcesso } from './auth/guarda.js';
import { RevogacoesService } from './auth/revogacoes.service.js';
import { ContextoMiddleware } from './contexto.js';
import { FiltroDeErrosHttp } from './filtro-erros-http.js';
import { HealthController } from './health.controller.js';
import { NaoConformidadesController } from './qualidade/nao-conformidades.controller.js';
import { PlanosDeAcaoController } from './qualidade/planos-de-acao.controller.js';
import { MensageriaService } from './mensageria.service.js';
import { ConsultasController } from './parceiros/consultas.controller.js';
import { ParceirosController } from './parceiros/parceiros.controller.js';
import { ReferenciasController } from './parceiros/referencias.controller.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

/** Telemetria (https://observe.nestjs.com): só liga quando há chaves no .env. */
export const observeEnabled = Boolean(
  process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_SECRET,
);

@Module({
  imports: [
    ...(observeEnabled
      ? [
          ObserveModule.forRoot({
            appKey: process.env.OBSERVE_APP_KEY!,
            appSecret: process.env.OBSERVE_APP_SECRET!,
            serviceId: 'api-gateway',
          }),
        ]
      : []),
    // Um cliente RabbitMQ por microsserviço; injete com @Inject(SERVICES.X).
    ClientsModule.register(SERVICE_NAMES.map(rmqClientOptions)),
  ],
  controllers: [
    HealthController,
    AuthController,
    ContaController,
    UsuariosController,
    PerfisController,
    EmpresaController,
    ParceirosController,
    ReferenciasController,
    ConsultasController,
    NaoConformidadesController,
    PlanosDeAcaoController,
  ],
  providers: [
    MensageriaService,
    RevogacoesService,
    // Todo erro HTTP sai como { erro: { codigo, mensagem, rastreioId } }
    { provide: APP_FILTER, useClass: FiltroDeErrosHttp },
    // Toda rota exige login (exceto @Publica); empresa e usuário vêm do token
    { provide: APP_GUARD, useClass: GuardaDeAcesso },
  ],
  exports: [MensageriaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Toda requisição ganha um rastreio (empresa e usuário vêm do token, na guarda)
    consumer.apply(ContextoMiddleware).forRoutes('*');
  }
}
