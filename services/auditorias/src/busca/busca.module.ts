import { Module } from '@nestjs/common';
import { BuscaController } from './busca.controller.js';
import { BuscaService } from './busca.service.js';

@Module({ controllers: [BuscaController], providers: [BuscaService] })
export class BuscaModule {}
