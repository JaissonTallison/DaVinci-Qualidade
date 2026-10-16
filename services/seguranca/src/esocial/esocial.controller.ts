import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { EsocialService } from './esocial.service.js';

const P = PATTERNS.esocial;

/** eSocial SST pela fila davinci.seguranca. */
@Controller()
export class EsocialController {
  constructor(private readonly s: EsocialService) {}

  @MessagePattern(P.painel)
  painel(@Contexto() ctx: Ctx) {
    return this.s.painel(ctx);
  }
  @MessagePattern(P.salvarConfiguracao)
  salvar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.salvarConfiguracao(ctx, d);
  }
  @MessagePattern(P.gerar)
  gerar(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.s.gerar(ctx, d);
  }
  @MessagePattern(P.xml)
  xml(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.s.xml(ctx, d);
  }
  @MessagePattern(P.marcarEnviado)
  marcarEnviado(
    @Contexto() ctx: Ctx,
    @Dados() d: { id?: unknown; alteracoes?: unknown },
  ) {
    return this.s.marcarEnviado(ctx, d);
  }
}
