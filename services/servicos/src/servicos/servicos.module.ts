import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICES } from '@davinci/types';
import { CatalogoService } from './catalogo.service.js';
import { ContratosService } from './contratos.service.js';
import { GestaoDeServicosController } from './gestao.controller.js';
import { PesquisasService } from './pesquisas.service.js';
import { ReclamacoesService } from './reclamacoes.service.js';
import { ServicosController } from './servicos.controller.js';
import { ServicosService } from './servicos.service.js';

/** Clientes e fornecedores são do codex; a NC de reclamação procedente nasce na qualidade. */
@Module({
  imports: [
    ClientsModule.register([
      rmqClientOptions(SERVICES.CODEX),
      rmqClientOptions(SERVICES.QUALIDADE),
    ]),
  ],
  controllers: [ServicosController, GestaoDeServicosController],
  providers: [
    ServicosService,
    CatalogoService,
    ContratosService,
    ReclamacoesService,
    PesquisasService,
  ],
  exports: [ServicosService],
})
export class ServicosModule {}
