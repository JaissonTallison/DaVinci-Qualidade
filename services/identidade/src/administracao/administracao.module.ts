import { Module } from '@nestjs/common';
import { ContaModule } from '../conta/conta.module.js';
import { AdministracaoController } from './administracao.controller.js';
import { PerfisService } from './perfis.service.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [ContaModule],
  controllers: [AdministracaoController],
  providers: [UsuariosService, PerfisService],
})
export class AdministracaoModule {}
