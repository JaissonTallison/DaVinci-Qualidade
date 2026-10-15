import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { ConsumoService } from './consumo.service.js';

const P = PATTERNS.ambiental;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Consumo e inventário de GEE pela fila davinci.ambiental. Toda regra está no service. */
@Controller()
export class ConsumoController {
  constructor(private readonly s: ConsumoService) {}

  @MessagePattern(P.listarConsumos)
  listar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.listar(ctx, d);
  }

  @MessagePattern(P.registrarConsumo)
  registrar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.registrar(ctx, d);
  }

  @MessagePattern(P.inventarioGee)
  inventario(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.inventario(ctx, d);
  }

  @MessagePattern(P.definirFator)
  definirFator(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.definirFator(ctx, d);
  }
}
