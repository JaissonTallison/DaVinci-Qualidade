import { Module } from '@nestjs/common';
import { DatabaseModule } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import * as schema from './db/schema.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    DatabaseModule.forRoot({ url: requireEnv('DATABASE_URL'), schema }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
