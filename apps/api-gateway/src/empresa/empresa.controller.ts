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
  RECURSOS,
  SERVICES,
  recursosEfetivos,
  salvarRecursosSchema,
  type PendenciaDeRecurso,
  type Recurso,
  type RecursosDaEmpresa,
  type ServiceName,
  atualizarEstabelecimentoSchema,
  dadosDaEmpresaSchema,
  estabelecimentoSchema,
  logoSchema,
  situacaoDoEstabelecimentoSchema,
  type Contexto,
  type DadosDaEmpresa,
  type Estabelecimento,
  type Logo,
} from '@davinci/types';
import { Permissao, SoLogin } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { ErroDoServico, MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

/** Dados da empresa atual, estabelecimentos (matriz e filiais) e logo (Identidade). */
@Controller('empresa')
@Permissao('empresa.gerenciar')
export class EmpresaController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  obter(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<DadosDaEmpresa>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.obter,
      {},
      ctx,
    );
  }

  @Put()
  atualizar(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(dadosDaEmpresaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<DadosDaEmpresa>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.atualizar,
      dados,
      ctx,
    );
  }

  /** Qualquer pessoa logada vê a logo da própria empresa (menu, relatórios). */
  @Get('logo')
  @SoLogin()
  obterLogo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<Logo>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.obterLogo,
      {},
      ctx,
    );
  }

  @Put('logo')
  salvarLogo(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(logoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<{ logoVersao: string }>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.salvarLogo,
      dados,
      ctx,
    );
  }

  @Post('logo/remover')
  @HttpCode(200)
  removerLogo(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<{ removida: true }>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.removerLogo,
      {},
      ctx,
    );
  }

  @Post('estabelecimentos')
  criarEstabelecimento(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(estabelecimentoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Estabelecimento>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.criarEstabelecimento,
      dados,
      ctx,
    );
  }

  @Put('estabelecimentos/:id')
  atualizarEstabelecimento(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(atualizarEstabelecimentoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Estabelecimento>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.atualizarEstabelecimento,
      { ...dados, id },
      ctx,
    );
  }

  @Post('estabelecimentos/:id/inativar')
  @HttpCode(200)
  inativar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(situacaoDoEstabelecimentoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Estabelecimento>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.inativarEstabelecimento,
      { ...dados, id },
      ctx,
    );
  }

  @Post('estabelecimentos/:id/reativar')
  @HttpCode(200)
  reativar(
    @ContextoHttp() ctx: Contexto,
    @Param('id') id: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(situacaoDoEstabelecimentoSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<Estabelecimento>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.reativarEstabelecimento,
      { ...dados, id },
      ctx,
    );
  }

  // ---------------------------------------------------------------- recursos (A122)

  @Get('recursos')
  recursos(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<RecursosDaEmpresa>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.recursos,
      {},
      ctx,
    );
  }

  /** Liga e desliga módulos. Os dados de um módulo desligado ficam guardados e voltam ao religar. */
  @Put('recursos')
  async salvarRecursos(@ContextoHttp() ctx: Contexto, @Body() dados: unknown) {
    validarEntrada(salvarRecursosSchema, dados, ctx.rastreioId);
    const novos = recursosEfetivos((dados as { recursos: Recurso[] }).recursos);
    return this.mensageria.enviar<RecursosDaEmpresa>(
      SERVICES.IDENTIDADE,
      PATTERNS.empresa.salvarRecursos,
      { recursos: novos },
      ctx,
    );
  }
}
