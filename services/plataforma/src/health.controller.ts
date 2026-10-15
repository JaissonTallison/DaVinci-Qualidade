import { Controller, Inject } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DATABASE, pingDatabase, type Database } from '@davinci/database';
import { PATTERNS, SERVICES, type HealthPong } from '@davinci/types';

@Controller()
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @MessagePattern(PATTERNS.health.ping)
  async ping(): Promise<HealthPong> {
    return {
      service: SERVICES.PLATAFORMA,
      status: 'ok',
      database: (await pingDatabase(this.db)) ? 'ok' : 'indisponivel',
      timestamp: new Date().toISOString(),
    };
  }
}
