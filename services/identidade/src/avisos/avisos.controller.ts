import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PATTERNS } from '@davinci/types';
import { AvisosService } from './avisos.service.js';

/** Destinatários dos avisos diários (pedido do serviço paineis). */
@Controller()
export class AvisosController {
  constructor(private readonly avisos: AvisosService) {}

  @MessagePattern(PATTERNS.usuarios.destinatariosDeAvisos)
  destinatarios() {
    return this.avisos.destinatarios();
  }
}
