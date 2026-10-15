import { Module } from '@nestjs/common';
import { ParceirosController } from './parceiros.controller.js';
import { ParceirosService } from './parceiros.service.js';

@Module({
  controllers: [ParceirosController],
  providers: [ParceirosService],
})
export class ParceirosModule {}
