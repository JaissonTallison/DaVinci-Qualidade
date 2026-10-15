import { Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';
import {
  buscaSchema,
  horizonteSchema,
  modulosDaBusca,
  modulosVisiveis,
  PATTERNS,
  SERVICES,
  type Busca,
  type Contexto,
  type PainelDeVencimentos,
  type ResultadoDosAvisos,
} from '@davinci/types';
import { Permissao, SoLogin } from '../auth/decoradores.js';
import { ContextoHttp, type RequisicaoComContexto } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

/** Painel de vencimentos de todos os módulos. docs/05-modulos/paineis.md */
@Controller('paineis')
export class PaineisController {
  constructor(private readonly mensageria: MensageriaService) {}

  /** Só os módulos que a pessoa vê (permissão e módulo ligado): o painel nunca mostra prazo de módulo alheio. */
  @Get('vencimentos')
  @Permissao('paineis.ver')
  vencimentos(
    @ContextoHttp() ctx: Contexto,
    @Req() req: RequisicaoComContexto,
    @Query() q: Record<string, unknown>,
  ) {
    validarEntrada(horizonteSchema, q, ctx.rastreioId);
    const modulos = modulosVisiveis(req.permissoes ?? [], req.recursos ?? []);
    return this.mensageria.enviar<PainelDeVencimentos>(
      SERVICES.PAINEIS,
      PATTERNS.paineis.vencimentos,
      { modulos, dias: q.dias ?? 30 },
      ctx,
      20_000,
    );
  }

  /** Pesquisa geral (Ctrl+K): só nos módulos que a pessoa vê. Qualquer pessoa logada pesquisa. */
  @Get('busca')
  @SoLogin()
  buscar(
    @ContextoHttp() ctx: Contexto,
    @Req() req: RequisicaoComContexto,
    @Query() q: Record<string, unknown>,
  ) {
    validarEntrada(buscaSchema, q, ctx.rastreioId);
    const modulos = modulosDaBusca(req.permissoes ?? [], req.recursos ?? []);
    return this.mensageria.enviar<Busca>(
      SERVICES.PAINEIS,
      PATTERNS.paineis.buscar,
      { termo: q.termo, modulos },
      ctx,
      10_000,
    );
  }

  /** Manda agora o aviso por e-mail da empresa (o automático sai todo dia às 7h). */
  @Post('avisos/enviar')
  @Permissao('empresa.gerenciar')
  @HttpCode(200)
  enviarAvisos(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<ResultadoDosAvisos>(
      SERVICES.PAINEIS,
      PATTERNS.paineis.enviarAvisos,
      {},
      ctx,
      60_000,
    );
  }
}
