import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { AnexosService } from './anexos.service.js';

const P = PATTERNS.anexos;

/** Mensagens de anexos recebidas pela fila davinci.plataforma. A permissão por módulo é conferida no gateway. */
@Controller()
export class AnexosController {
  constructor(private readonly anexos: AnexosService) {}

  @MessagePattern(P.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.anexos.listar(ctx, dados);
  }

  @MessagePattern(P.anexar)
  anexar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.anexos.anexar(ctx, dados);
  }

  @MessagePattern(P.obter)
  obter(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.anexos.obter(ctx, dados);
  }

  @MessagePattern(P.conteudo)
  conteudo(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.anexos.conteudo(ctx, dados);
  }

  @MessagePattern(P.remover)
  remover(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.anexos.remover(ctx, dados);
  }
}
