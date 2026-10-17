import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  atualizarItemDeListaSchema,
  filtroCadastroSimplesSchema,
  novoItemDeListaSchema,
  PATTERNS,
  SERVICES,
  situacaoDoCadastroSchema,
  type Contexto,
  type ItemDeLista,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';
import { validarEntrada } from '../validacao.js';

/** Listas auxiliares de cadastro (serviço codex): a lista (processo, causa_nc…) vem na rota. */
@Controller('listas/:lista')
export class ListasController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get()
  @Permissao('funcionarios.ver')
  listar(
    @ContextoHttp() ctx: Contexto,
    @Param('lista') lista: string,
    @Query() filtro: Record<string, unknown>,
  ) {
    validarEntrada(filtroCadastroSimplesSchema, filtro, ctx.rastreioId);
    return this.mensageria.enviar<ItemDeLista[]>(
      SERVICES.CODEX,
      PATTERNS.listasCadastro.listar,
      { ...filtro, lista },
      ctx,
    );
  }

  @Post()
  @Permissao('funcionarios.editar')
  criar(
    @ContextoHttp() ctx: Contexto,
    @Param('lista') lista: string,
    @Body() dados: Record<string, unknown>,
  ) {
    validarEntrada(novoItemDeListaSchema, dados, ctx.rastreioId);
    return this.mensageria.enviar<ItemDeLista>(
      SERVICES.CODEX,
      PATTERNS.listasCadastro.criar,
      { ...dados, lista },
      ctx,
    );
  }

  @Put(':id')
  @Permissao('funcionarios.editar')
  atualizar(
    @ContextoHttp() ctx: Contexto,
    @Param('lista') lista: string,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(atualizarItemDeListaSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<ItemDeLista>(
      SERVICES.CODEX,
      PATTERNS.listasCadastro.atualizar,
      { lista, id, alteracoes },
      ctx,
    );
  }

  @Post(':id/situacao')
  @Permissao('funcionarios.editar')
  @HttpCode(200)
  mudarSituacao(
    @ContextoHttp() ctx: Contexto,
    @Param('lista') lista: string,
    @Param('id') id: string,
    @Body() alteracoes: unknown,
  ) {
    validarEntrada(situacaoDoCadastroSchema, alteracoes, ctx.rastreioId);
    return this.mensageria.enviar<ItemDeLista>(
      SERVICES.CODEX,
      PATTERNS.listasCadastro.mudarSituacao,
      { lista, id, alteracoes },
      ctx,
    );
  }
}
