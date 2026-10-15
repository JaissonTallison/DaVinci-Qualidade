import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { EmpresaService } from './empresa.service.js';
import { ChavesService } from './chaves.service.js';

/** Dados da empresa do contexto. A permissão (empresa.gerenciar) é conferida no gateway. */
@Controller()
export class EmpresaController {
  constructor(
    private readonly empresa: EmpresaService,
    private readonly chaves: ChavesService,
  ) {}

  @MessagePattern(PATTERNS.chavesApi.listar)
  listarChaves(@Contexto() ctx: Ctx) {
    return this.chaves.listar(ctx);
  }

  @MessagePattern(PATTERNS.chavesApi.criar)
  criarChave(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.chaves.criar(ctx, dados);
  }

  @MessagePattern(PATTERNS.chavesApi.revogar)
  revogarChave(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.chaves.revogar(ctx, dados);
  }

  /** Gateway (sem contexto de usuário): confere a chave de API. */
  @MessagePattern(PATTERNS.chavesApi.validar)
  validarChave(@Dados() dados: unknown) {
    return this.chaves.validar(dados);
  }

  @MessagePattern(PATTERNS.empresa.obter)
  obter(@Contexto() ctx: Ctx) {
    return this.empresa.obter(ctx);
  }

  @MessagePattern(PATTERNS.empresa.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.empresa.atualizar(ctx, dados);
  }

  @MessagePattern(PATTERNS.empresa.obterLogo)
  obterLogo(@Contexto() ctx: Ctx) {
    return this.empresa.obterLogo(ctx);
  }

  @MessagePattern(PATTERNS.empresa.salvarLogo)
  salvarLogo(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.empresa.salvarLogo(ctx, dados);
  }

  @MessagePattern(PATTERNS.empresa.removerLogo)
  removerLogo(@Contexto() ctx: Ctx) {
    return this.empresa.removerLogo(ctx);
  }

  @MessagePattern(PATTERNS.empresa.criarEstabelecimento)
  criarEstabelecimento(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.empresa.criarEstabelecimento(ctx, dados);
  }

  @MessagePattern(PATTERNS.empresa.atualizarEstabelecimento)
  atualizarEstabelecimento(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.empresa.atualizarEstabelecimento(ctx, dados);
  }

  @MessagePattern(PATTERNS.empresa.inativarEstabelecimento)
  inativarEstabelecimento(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.empresa.inativarEstabelecimento(ctx, dados);
  }

  @MessagePattern(PATTERNS.empresa.reativarEstabelecimento)
  reativarEstabelecimento(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.empresa.reativarEstabelecimento(ctx, dados);
  }

  @MessagePattern(PATTERNS.empresa.recursos)
  recursos(@Contexto() ctx: Ctx) {
    return this.empresa.recursos(ctx);
  }

  @MessagePattern(PATTERNS.empresa.salvarRecursos)
  salvarRecursos(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.empresa.salvarRecursos(ctx, dados);
  }

  @MessagePattern(PATTERNS.empresa.ligarRecursos)
  ligarRecursos(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.empresa.ligarRecursos(ctx, dados);
  }
}
