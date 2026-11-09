import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  PATTERNS,
  SERVICES,
  login2faSchema,
  loginExternoSchema,
  loginSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
  renovarSchema,
  trocarEmpresaSchema,
  trocarSenhaSchema,
  type Contexto,
  type OrigemDoAcesso,
  type RespostaLogin,
  type Sessao,
} from '@davinci/types';
import { ContextoHttp, OrigemHttp, RastreioHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';
import { LiberadaComPendencia, Publica, SoLogin } from './decoradores.js';
import { LIMITE_LOGIN, LIMITE_SENHA, Limite } from './limite-de-tentativas.js';

/**
 * Login e sessão (serviço Identidade). Login, renovar, sair e trocar de empresa
 * são autorizados pelo próprio token de renovação; senha e "eu" exigem o token de acesso.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Post('login')
  @Publica()
  @Limite(LIMITE_LOGIN)
  @HttpCode(200)
  login(
    @RastreioHttp() rastreioId: string,
    @OrigemHttp() origem: OrigemDoAcesso,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(loginSchema, dados, rastreioId);
    return this.mensageria.enviar<RespostaLogin>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.autenticar,
      { ...dados, origem },
      { rastreioId },
    );
  }

  /** Segunda etapa (2FA): o desafio da 1ª etapa + o código. */
  @Post('login/2fa')
  @Publica()
  @Limite(LIMITE_LOGIN)
  @HttpCode(200)
  login2fa(
    @RastreioHttp() rastreioId: string,
    @OrigemHttp() origem: OrigemDoAcesso,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(login2faSchema, dados, rastreioId);
    return this.mensageria.enviar<Sessao>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.autenticar2fa,
      { ...dados, origem },
      { rastreioId },
    );
  }

  /** "Entrar com Microsoft/Google": o web já trocou o código do provedor pelo id_token. */
  @Post('login/externo')
  @Publica()
  @Limite(LIMITE_LOGIN)
  @HttpCode(200)
  loginExterno(
    @RastreioHttp() rastreioId: string,
    @OrigemHttp() origem: OrigemDoAcesso,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(loginExternoSchema, dados, rastreioId);
    return this.mensageria.enviar<RespostaLogin>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.autenticarExterno,
      { ...dados, origem },
      { rastreioId },
    );
  }

  @Post('renovar')
  @Publica()
  @HttpCode(200)
  renovar(@RastreioHttp() rastreioId: string, @Body() dados: unknown) {
    validarEntrada(renovarSchema, dados, rastreioId);
    return this.mensageria.enviar<Sessao>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.renovar,
      dados,
      { rastreioId },
    );
  }

  /** "Esqueci minha senha": responde sempre igual (não revela se o e-mail existe). */
  @Post('recuperar-senha')
  @Publica()
  @Limite(LIMITE_SENHA)
  @HttpCode(200)
  recuperarSenha(
    @RastreioHttp() rastreioId: string,
    @OrigemHttp() origem: OrigemDoAcesso,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(recuperarSenhaSchema, dados, rastreioId);
    return this.mensageria.enviar<{ enviado: true }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.recuperarSenha,
      { ...dados, origem },
      { rastreioId },
    );
  }

  @Post('redefinir-senha')
  @Publica()
  @Limite(LIMITE_SENHA)
  @HttpCode(200)
  redefinirSenha(
    @RastreioHttp() rastreioId: string,
    @OrigemHttp() origem: OrigemDoAcesso,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(redefinirSenhaSchema, dados, rastreioId);
    return this.mensageria.enviar<{ redefinida: true }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.redefinirSenha,
      { ...dados, origem },
      { rastreioId },
    );
  }

  @Post('sair')
  @Publica()
  @HttpCode(200)
  sair(@RastreioHttp() rastreioId: string, @Body() dados: unknown) {
    validarEntrada(renovarSchema, dados, rastreioId);
    return this.mensageria.enviar<{ encerrada: true }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.encerrar,
      dados,
      { rastreioId },
    );
  }

  @Post('empresa')
  @Publica()
  @HttpCode(200)
  trocarEmpresa(@RastreioHttp() rastreioId: string, @Body() dados: unknown) {
    validarEntrada(trocarEmpresaSchema, dados, rastreioId);
    return this.mensageria.enviar<Sessao>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.trocarEmpresa,
      dados,
      { rastreioId },
    );
  }

  @Post('senha')
  @LiberadaComPendencia()
  @HttpCode(200)
  trocarSenha(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(trocarSenhaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<{ alterada: true }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.trocarSenha,
      dados,
      ctx,
    );
  }

  @Get('eu')
  @LiberadaComPendencia()
  eu(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.eu,
      {},
      ctx,
    );
  }

  /** Convite para outra empresa: a própria pessoa aceita (basta estar logada). */
  @Post('convites/:id/aceitar')
  @SoLogin()
  @HttpCode(200)
  aceitarConvite(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<{ aceito: true }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.aceitarConvite,
      { id },
      ctx,
    );
  }

  @Post('convites/:id/recusar')
  @SoLogin()
  @HttpCode(200)
  recusarConvite(@ContextoHttp() ctx: Contexto, @Param('id') id: string) {
    return this.mensageria.enviar<{ recusado: true }>(
      SERVICES.IDENTIDADE,
      PATTERNS.identidade.recusarConvite,
      { id },
      ctx,
    );
  }
}
