import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { IntegracoesEmpresaService } from './integracoes-empresa.service.js';

/** Config de integrações da empresa. A permissão (empresa.gerenciar) é conferida no gateway. */
@Controller()
export class IntegracoesEmpresaController {
  constructor(private readonly svc: IntegracoesEmpresaService) {}

  @MessagePattern(PATTERNS.integracoes.obter)
  obter(@Contexto() ctx: Ctx) {
    return this.svc.obter(ctx);
  }

  @MessagePattern(PATTERNS.integracoes.salvarWebhook)
  salvarWebhook(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.svc.salvarWebhook(ctx, dados);
  }

  @MessagePattern(PATTERNS.integracoes.salvarIa)
  salvarIa(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.svc.salvarIa(ctx, dados);
  }
}
