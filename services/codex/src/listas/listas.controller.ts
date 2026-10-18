import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { ListasService } from './listas.service.js';

const L = PATTERNS.listasCadastro;
type ComId = { lista?: unknown; id?: unknown; alteracoes?: unknown };

/** Mensagens das listas auxiliares de cadastro (processo/área, tipo de causa…). */
@Controller()
export class ListasController {
  constructor(private readonly listas: ListasService) {}

  @MessagePattern(L.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.listas.listar(ctx, dados);
  }

  @MessagePattern(L.criar)
  criar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.listas.criar(ctx, dados);
  }

  @MessagePattern(L.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.listas.atualizar(ctx, dados);
  }

  @MessagePattern(L.mudarSituacao)
  mudarSituacao(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.listas.mudarSituacao(ctx, dados);
  }
}
