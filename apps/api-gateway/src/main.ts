import '@davinci/shared/load-env';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument, observeEnabled } from './app.module.js';
import { configurarApp } from './configurar.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: observeEnabled ? ObserveInstrument : undefined,
  });
  configurarApp(app);
  await app.listen(process.env.PORT ?? 3171);
}
await bootstrap();
