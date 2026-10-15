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
  atualizarPerfilSchema,
  exige2faSchema,
  novoPerfilSchema,
  situacaoDoPerfilSchema,
  type Contexto,
  type Perfil,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

/** Perfis de acesso da empresa atual (Identidade). */
@Controller('perfis')
@Permissao('perfis.gerenciar')
export class PerfisController {
  constructor(private readonly mensageria: MensageriaService) {}

  /** Quem gerencia usuários também lê os perfis (para escolher o de cada pessoa). */
  @Get()
  @Permissao('perfis.gerenciar', 'usuarios.gerenciar')
  listar(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<Perfil[]>(
      SERVICES.IDENTIDADE,
      PATTERNS.perfis.listar,
      {},
      ctx,
    );
  }

  @Get(':id')
  obter(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<Perfil>(
      SERVICES.IDENTIDADE,
      PATTERNS.perfis.obter,
      { id },
      ctx,
    );
  }

  @Post()
  criar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(novoPerfilSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Perfil>(
      SERVICES.IDENTIDADE,
      PATTERNS.perfis.criar,
      dados,
      ctx,
    );
  }

  @Put(':id')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(atualizarPerfilSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Perfil>(
      SERVICES.IDENTIDADE,
      PATTERNS.perfis.atualizar,
      { ...dados, id },
      ctx,
    );
  }

  @Put(':id/exige-2fa')
  exige2fa(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(exige2faSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Perfil>(
      SERVICES.IDENTIDADE,
      PATTERNS.perfis.exige2fa,
      { ...dados, id },
      ctx,
    );
  }

  @Post(':id/inativar')
  @HttpCode(200)
  inativar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(situacaoDoPerfilSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Perfil>(
      SERVICES.IDENTIDADE,
      PATTERNS.perfis.inativar,
      { ...dados, id },
      ctx,
    );
  }

  @Post(':id/reativar')
  @HttpCode(200)
  reativar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(situacaoDoPerfilSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Perfil>(
      SERVICES.IDENTIDADE,
      PATTERNS.perfis.reativar,
      { ...dados, id },
      ctx,
    );
  }
}
