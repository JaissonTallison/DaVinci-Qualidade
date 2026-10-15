import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  PATTERNS,
  SERVICES,
  alterarPerfilDoUsuarioSchema,
  devolverAcessoSchema,
  novoUsuarioSchema,
  removerAcessoSchema,
  type Contexto,
  type SenhaRedefinida,
  type UsuarioCriado,
  type UsuarioDaEmpresa,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

/** Usuários da empresa atual (Identidade). Contrato: docs/05-modulos/identidade.md */
@Controller('usuarios')
@Permissao('usuarios.gerenciar')
export class UsuariosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  listar(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<UsuarioDaEmpresa[]>(
      SERVICES.IDENTIDADE,
      PATTERNS.usuarios.listar,
      {},
      ctx,
    );
  }

  @Get(':id')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<UsuarioDaEmpresa>(
      SERVICES.IDENTIDADE,
      PATTERNS.usuarios.obter,
      { id },
      ctx,
    );
  }

  @Post()
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoUsuarioSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<UsuarioCriado>(
      SERVICES.IDENTIDADE,
      PATTERNS.usuarios.criar,
      dados,
      ctx,
    );
  }

  @Put(':id/perfil')
  alterarPerfil(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(alterarPerfilDoUsuarioSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<UsuarioDaEmpresa>(
      SERVICES.IDENTIDADE,
      PATTERNS.usuarios.alterarPerfil,
      { ...dados, id },
      ctx,
    );
  }

  @Post(':id/remover-acesso')
  @HttpCode(200)
  removerAcesso(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(removerAcessoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<UsuarioDaEmpresa>(
      SERVICES.IDENTIDADE,
      PATTERNS.usuarios.removerAcesso,
      { ...dados, id },
      ctx,
    );
  }

  @Post(':id/devolver-acesso')
  @HttpCode(200)
  devolverAcesso(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(devolverAcessoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<UsuarioDaEmpresa>(
      SERVICES.IDENTIDADE,
      PATTERNS.usuarios.devolverAcesso,
      { ...dados, id },
      ctx,
    );
  }

  @Post(':id/desativar-2fa')
  @HttpCode(200)
  desativar2fa(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<{ desativado: true }>(
      SERVICES.IDENTIDADE,
      PATTERNS.usuarios.desativar2fa,
      { id },
      ctx,
    );
  }

  @Post(':id/redefinir-senha')
  @HttpCode(200)
  redefinirSenha(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<SenhaRedefinida>(
      SERVICES.IDENTIDADE,
      PATTERNS.usuarios.redefinirSenha,
      { id },
      ctx,
    );
  }
}
