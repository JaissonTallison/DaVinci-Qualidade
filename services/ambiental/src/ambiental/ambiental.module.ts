import { Module } from '@nestjs/common';
import { AmbientalController } from './ambiental.controller.js';
import { AmbientalService } from './ambiental.service.js';

@Module({
  controllers: [AmbientalController],
  providers: [AmbientalService],
  exports: [AmbientalService],
})
export class AmbientalModule {}
