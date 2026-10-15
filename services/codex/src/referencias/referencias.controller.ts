import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Dados } from '@davinci/shared';
import { PATTERNS } from '@davinci/types';
import { ReferenciasService } from './referencias.service.js';

/** Tabelas oficiais de referência: não dependem da empresa (sem contexto). */
@Controller()
export class ReferenciasController {
  constructor(private readonly referencias: ReferenciasService) {}

  @MessagePattern(PATTERNS.referencias.cnaes)
  cnaes(@Dados() dados: unknown) {
    return this.referencias.cnaes(dados);
  }

  @MessagePattern(PATTERNS.referencias.setores)
  setores() {
    return this.referencias.setores();
  }

  @MessagePattern(PATTERNS.referencias.bancos)
  bancos() {
    return this.referencias.bancos();
  }
}
