import '@davinci/shared/load-env';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FiltroDeErrosRpc, rmqServerOptions } from '@davinci/shared';
import { queueName, SERVICES } from '@davinci/types';
import { AppModule } from './app.module.js';

const SERVICE = SERVICES.PAINEIS;

const app = await NestFactory.createMicroservice(
  AppModule,
  rmqServerOptions(SERVICE),
);
// Todo erro sai no formato padrão; erro inesperado não vaza detalhe técnico.
app.useGlobalFilters(new FiltroDeErrosRpc());
await app.listen();
new Logger('Bootstrap').log(
  `Serviço "${SERVICE}" ouvindo a fila ${queueName(SERVICE)}`,
);
