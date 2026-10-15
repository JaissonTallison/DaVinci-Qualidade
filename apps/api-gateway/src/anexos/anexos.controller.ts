import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  filtroAnexosSchema,
  novoAnexoSchema,
  PATTERNS,
  permissaoDoAnexo,
  REGISTROS_COM_ANEXO,
  SERVICES,
  type Anexo,
  type ConteudoDoAnexo,
  type Contexto,
  type RegistroComAnexo,
} from '@davinci/types';
import { SoLogin } from '../auth/decoradores.js';
import { SEM_PERMISSAO } from '../auth/guarda.js';
import { ContextoHttp, type RequisicaoComContexto } from '../contexto.js';
import { ErroDoServico, MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

const P = PATTERNS.anexos;

/**
 * Anexos (serviço plataforma). A permissão é a do módulo dono do registro: anexo de NC exige qualidade.ver
 * para ver e qualidade.editar para anexar ou remover. docs/05-modulos/anexos.md
 */
@Controller('anexos')
@SoLogin()
export class AnexosController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  listar(
    @ContextoHttp() ctx: Contexto,
    @Req() req: RequisicaoComContexto,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroAnexosSchema, filtro, ctx.rastreioId);
    exigir(req, filtro.registro as RegistroComAnexo, 'ver');
    return this.mensageria.enviar<Anexo[]>(
      SERVICES.PLATAFORMA,
      P.listar,
      filtro,
      ctx,
    );
  }

  @Post()
  anexar(
    @ContextoHttp() ctx: Contexto,
    @Req() req: RequisicaoComContexto,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(novoAnexoSchema, dados, ctx.rastreioId);
    exigir(req, dados.registro as RegistroComAnexo, 'editar');
    return this.mensageria.enviar<Anexo>(
      SERVICES.PLATAFORMA,
      P.anexar,
      dados,
      ctx,
      30_000,
    );
  }

  /** O arquivo em si, com o nome original. */
  @Get(':id/conteudo')
  async conteudo(
    @ContextoHttp() ctx: Contexto,
    @Req() req: RequisicaoComContexto,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const a = await this.mensageria.enviar<ConteudoDoAnexo>(
      SERVICES.PLATAFORMA,
      P.conteudo,
      { id },
      ctx,
      30_000,
    );
    exigir(req, a.registro, 'ver');
    res
      .status(200)
      .setHeader('content-type', a.tipo)
      .setHeader(
        'content-disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(a.nome)}`,
      )
      .setHeader('x-content-type-options', 'nosniff')
      .send(Buffer.from(a.base64, 'base64'));
  }

  @Post(':id/remover')
  @HttpCode(200)
  async remover(
    @ContextoHttp() ctx: Contexto,
    @Req() req: RequisicaoComContexto,
    @Param('id') id: string,
  ) {
    const a = await this.mensageria.enviar<Anexo>(
      SERVICES.PLATAFORMA,
      P.obter,
      { id },
      ctx,
    );
    exigir(req, a.registro, 'editar');
    return this.mensageria.enviar<Anexo>(
      SERVICES.PLATAFORMA,
      P.remover,
      { id },
      ctx,
    );
  }
}

function exigir(
  req: RequisicaoComContexto,
  registro: RegistroComAnexo,
  acao: 'ver' | 'editar',
): void {
  const modulo = REGISTROS_COM_ANEXO[registro].modulo;
  const ok =
    req.permissoes?.includes(permissaoDoAnexo(registro, acao)) &&
    (req.recursos ?? []).includes(modulo);
  if (!ok)
    throw new ErroDoServico({
      codigo: 'SEM_PERMISSAO',
      mensagem: SEM_PERMISSAO,
      rastreioId: req.rastreioId,
    });
}
