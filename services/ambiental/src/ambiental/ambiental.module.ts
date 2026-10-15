import { Module } from '@nestjs/common';
import { ConsumoController } from '../consumo/consumo.controller.js';
import { ConsumoService } from '../consumo/consumo.service.js';
import { MonitoramentosController } from '../monitoramentos/monitoramentos.controller.js';
import { MonitoramentosService } from '../monitoramentos/monitoramentos.service.js';
import { QuimicosController } from '../quimicos/quimicos.controller.js';
import { QuimicosService } from '../quimicos/quimicos.service.js';
import { AmbientalController } from './ambiental.controller.js';
import { AmbientalService } from './ambiental.service.js';

@Module({
  controllers: [
    AmbientalController,
    QuimicosController,
    ConsumoController,
    MonitoramentosController,
  ],
  providers: [
    AmbientalService,
    QuimicosService,
    ConsumoService,
    MonitoramentosService,
  ],
  exports: [AmbientalService, QuimicosService, MonitoramentosService],
})
export class AmbientalModule {}
