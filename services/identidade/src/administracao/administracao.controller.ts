import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { PerfisService } from './perfis.service.js';
import { UsuariosService } from './usuarios.service.js';

/** Usuários e perfis da empresa do contexto. A permissão (usuarios/perfis.gerenciar) é conferida no gateway. */
@Controller()
export class AdministracaoController {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly perfis: PerfisService,
  ) {}

  @MessagePattern(PATTERNS.usuarios.listar)
  listarUsuarios(@Contexto() ctx: Ctx) {
    return this.usuarios.listar(ctx);
  }

  @MessagePattern(PATTERNS.usuarios.obter)
  obterUsuario(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.usuarios.obter(ctx, dados);
  }

  @MessagePattern(PATTERNS.usuarios.criar)
  criarUsuario(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.usuarios.criar(ctx, dados);
  }

  @MessagePattern(PATTERNS.usuarios.alterarPerfil)
  alterarPerfil(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.usuarios.alterarPerfil(ctx, dados);
  }

  @MessagePattern(PATTERNS.usuarios.removerAcesso)
  removerAcesso(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.usuarios.removerAcesso(ctx, dados);
  }

  @MessagePattern(PATTERNS.usuarios.devolverAcesso)
  devolverAcesso(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.usuarios.devolverAcesso(ctx, dados);
  }

  @MessagePattern(PATTERNS.usuarios.redefinirSenha)
  redefinirSenha(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.usuarios.redefinirSenha(ctx, dados);
  }

  @MessagePattern(PATTERNS.usuarios.desativar2fa)
  desativar2fa(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.usuarios.desativar2fa(ctx, dados);
  }

  @MessagePattern(PATTERNS.perfis.exige2fa)
  exige2fa(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.perfis.exige2fa(ctx, dados);
  }

  @MessagePattern(PATTERNS.perfis.listar)
  listarPerfis(@Contexto() ctx: Ctx) {
    return this.perfis.listar(ctx);
  }

  @MessagePattern(PATTERNS.perfis.obter)
  obterPerfil(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.perfis.obter(ctx, dados);
  }

  @MessagePattern(PATTERNS.perfis.criar)
  criarPerfil(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.perfis.criar(ctx, dados);
  }

  @MessagePattern(PATTERNS.perfis.atualizar)
  atualizarPerfil(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.perfis.atualizar(ctx, dados);
  }

  @MessagePattern(PATTERNS.perfis.inativar)
  inativarPerfil(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.perfis.inativar(ctx, dados);
  }

  @MessagePattern(PATTERNS.perfis.reativar)
  reativarPerfil(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.perfis.reativar(ctx, dados);
  }
}
