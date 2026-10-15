import { Controller, Get } from '@nestjs/common';
import { Permissao, Publica } from './auth/decoradores.js';
import { ModuleRef } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import {
  PATTERNS,
  SERVICE_LAYER,
  SERVICE_NAMES,
  type HealthPong,
  type ServiceName,
  type StatusServico,
} from '@davinci/types';

type ServiceStatus = StatusServico;

@Controller('health')
export class HealthController {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Get()
  @Publica()
  self() {
    return {
      service: 'api-gateway',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /** Faz ping em cada microsserviço via RabbitMQ (timeout de 3 s por serviço). */
  @Get('services')
  @Permissao('sistema.status')
  async services(): Promise<ServiceStatus[]> {
    return Promise.all(SERVICE_NAMES.map((service) => this.ping(service)));
  }

  private async ping(service: ServiceName): Promise<ServiceStatus> {
    const client = this.moduleRef.get<ClientProxy>(service, { strict: false });
    try {
      const pong = await firstValueFrom(
        client.send<HealthPong>(PATTERNS.health.ping, {}).pipe(timeout(3000)),
      );
      return {
        service,
        layer: SERVICE_LAYER[service],
        status: pong.status,
        database: pong.database,
      };
    } catch (error) {
      return {
        service,
        layer: SERVICE_LAYER[service],
        status: 'indisponivel',
        detail: (error as Error).message,
      };
    }
  }
}
