import { Module } from '@nestjs/common';
import { AuditoriaSimplesController } from './auditoria-simples.controller.js';
import { AuditoriaSimplesService } from './auditoria-simples.service.js';

@Module({
  controllers: [AuditoriaSimplesController],
  providers: [AuditoriaSimplesService],
})
export class AuditoriaSimplesModule {}
