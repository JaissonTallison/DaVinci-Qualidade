import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { BuscaService } from './busca.service.js';

/** Pesquisa geral (pedido do serviço paineis). */
@Controller()
export class BuscaController {
  constructor(private readonly busca: BuscaService) {}

  @MessagePattern(PATTERNS.busca.seguranca)
  buscar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.busca.buscar(ctx, dados);
  }
}
