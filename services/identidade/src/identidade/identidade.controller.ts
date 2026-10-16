import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { IdentidadeService } from './identidade.service.js';

/** Mensagens da fila davinci.identidade. Login e renovação não exigem usuário no contexto. */
@Controller()
export class IdentidadeController {
  constructor(private readonly identidade: IdentidadeService) {}

  @MessagePattern(PATTERNS.identidade.autenticar)
  autenticar(@Dados() dados: unknown) {
    return this.identidade.autenticar(dados);
  }

  @MessagePattern(PATTERNS.identidade.autenticarExterno)
  autenticarExterno(@Dados() dados: unknown) {
    return this.identidade.autenticarExterno(dados);
  }

  @MessagePattern(PATTERNS.identidade.renovar)
  renovar(@Dados() dados: unknown) {
    return this.identidade.renovar(dados);
  }

  @MessagePattern(PATTERNS.identidade.encerrar)
  encerrar(@Dados() dados: unknown) {
    return this.identidade.encerrar(dados);
  }

  @MessagePattern(PATTERNS.identidade.trocarEmpresa)
  trocarEmpresa(@Dados() dados: unknown) {
    return this.identidade.trocarEmpresa(dados);
  }

  @MessagePattern(PATTERNS.identidade.obterPreferencia)
  obterPreferencia(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.identidade.obterPreferencia(ctx, dados);
  }

  @MessagePattern(PATTERNS.identidade.salvarPreferencia)
  salvarPreferencia(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.identidade.salvarPreferencia(ctx, dados);
  }

  @MessagePattern(PATTERNS.identidade.salvarTema)
  salvarTema(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.identidade.salvarTema(ctx, dados);
  }

  @MessagePattern(PATTERNS.identidade.trocarSenha)
  trocarSenha(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.identidade.trocarSenha(ctx, dados);
  }

  @MessagePattern(PATTERNS.identidade.eu)
  eu(@Contexto() ctx: Ctx) {
    return this.identidade.eu(ctx);
  }

  @MessagePattern(PATTERNS.identidade.autenticar2fa)
  autenticar2fa(@Dados() dados: unknown) {
    return this.identidade.autenticar2fa(dados);
  }
}
