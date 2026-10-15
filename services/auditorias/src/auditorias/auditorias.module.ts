import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { AuditoriasController } from './auditorias.controller.js';
import { AuditoriasService } from './auditorias.service.js';

/** Fala com o Qualidade (criar a NC de uma constatação) pela fila dele. */
@Module({
  imports: [ClientsModule.register([rmqClientOptions(SERVICES.QUALIDADE)])],
  controllers: [AuditoriasController],
  providers: [AuditoriasService],
})
export class AuditoriasModule {}
