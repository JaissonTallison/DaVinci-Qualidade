import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Dados } from '@davinci/shared';
import { PATTERNS } from '@davinci/types';
import { ConsultasService } from './consultas.service.js';

/** Consultas públicas (CNPJ, CEP). A permissão é conferida no gateway. */
@Controller()
export class ConsultasController {
  constructor(private readonly consultas: ConsultasService) {}

  @MessagePattern(PATTERNS.consultas.cnpj)
  cnpj(@Dados() dados: unknown) {
    return this.consultas.cnpj(dados);
  }

  @MessagePattern(PATTERNS.consultas.cep)
  cep(@Dados() dados: unknown) {
    return this.consultas.cep(dados);
  }
}
