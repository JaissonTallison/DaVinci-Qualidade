import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { EsocialController } from './esocial.controller.js';
import { EsocialService } from './esocial.service.js';

/** Funcionários e ASOs vêm do codex. */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.CODEX)])],
  controllers: [EsocialController],
  providers: [EsocialService],
})
export class EsocialModule {}
