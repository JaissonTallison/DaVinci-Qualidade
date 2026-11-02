import { Module } from '@nestjs/common';
import { RequisitosLegaisSstController } from './requisitos-legais-sst.controller.js';
import { RequisitosLegaisSstService } from './requisitos-legais-sst.service.js';

@Module({
  controllers: [RequisitosLegaisSstController],
  providers: [RequisitosLegaisSstService],
})
export class RequisitosLegaisSstModule {}
