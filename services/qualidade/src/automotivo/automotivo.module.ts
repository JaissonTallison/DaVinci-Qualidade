import { Module } from '@nestjs/common';
import { AutomotivoController } from './automotivo.controller.js';
import { AutomotivoService } from './automotivo.service.js';

@Module({ controllers: [AutomotivoController], providers: [AutomotivoService] })
export class AutomotivoModule {}
