import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { CatalogoService } from './catalogo.service.js';
import { ContratosService } from './contratos.service.js';
import { PesquisasService } from './pesquisas.service.js';
import { ReclamacoesService } from './reclamacoes.service.js';
import { ServicosService } from './servicos.service.js';

const P = PATTERNS.servicos;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Execução da OS, catálogo, contratos, reclamações e pesquisa por link, pela fila davinci.servicos. */
@Controller()
export class GestaoDeServicosController {
  constructor(
    private readonly os: ServicosService,
    private readonly catalogo: CatalogoService,
    private readonly contratos: ContratosService,
    private readonly reclamacoes: ReclamacoesService,
    private readonly pesquisas: PesquisasService,
  ) {}

  @MessagePattern(P.registrarExecucao)
  registrarExecucao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.os.registrarExecucao(ctx, d);
  }

  @MessagePattern(P.listarCatalogo)
  listarCatalogo(@Contexto() ctx: Ctx) {
    return this.catalogo.listar(ctx);
  }
  @MessagePattern(P.criarServico)
  criarServico(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.catalogo.criar(ctx, d);
  }
  @MessagePattern(P.atualizarServico)
  atualizarServico(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.catalogo.atualizar(ctx, d);
  }
  @MessagePattern(P.situacaoServico)
  situacaoServico(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.catalogo.mudarSituacao(ctx, d);
  }

  @MessagePattern(P.listarContratos)
  listarContratos(@Contexto() ctx: Ctx) {
    return this.contratos.listar(ctx);
  }
  @MessagePattern(P.obterContrato)
  obterContrato(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.contratos.obter(ctx, d);
  }
  @MessagePattern(P.criarContrato)
  criarContrato(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.contratos.criar(ctx, d);
  }
  @MessagePattern(P.atualizarContrato)
  atualizarContrato(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.contratos.atualizar(ctx, d);
  }
  @MessagePattern(P.encerrarContrato)
  encerrarContrato(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.contratos.encerrar(ctx, d);
  }

  @MessagePattern(P.listarReclamacoes)
  listarReclamacoes(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.reclamacoes.listar(ctx, d);
  }
  @MessagePattern(P.resumoReclamacoes)
  resumoReclamacoes(@Contexto() ctx: Ctx) {
    return this.reclamacoes.resumo(ctx);
  }
  @MessagePattern(P.obterReclamacao)
  obterReclamacao(@Contexto() ctx: Ctx, @Dados() d: { id?: unknown }) {
    return this.reclamacoes.obter(ctx, d);
  }
  @MessagePattern(P.criarReclamacao)
  criarReclamacao(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.reclamacoes.criar(ctx, d);
  }
  @MessagePattern(P.analisarReclamacao)
  analisarReclamacao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.reclamacoes.analisar(ctx, d);
  }
  @MessagePattern(P.responderReclamacao)
  responderReclamacao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.reclamacoes.responder(ctx, d);
  }
  @MessagePattern(P.encerrarReclamacao)
  encerrarReclamacao(@Contexto() ctx: Ctx, @Dados() d: ComId) {
    return this.reclamacoes.encerrar(ctx, d);
  }

  @MessagePattern(P.listarConvites)
  listarConvites(@Contexto() ctx: Ctx) {
    return this.pesquisas.listar(ctx);
  }
  @MessagePattern(P.criarConvite)
  criarConvite(@Contexto() ctx: Ctx, @Dados() d: unknown) {
    return this.pesquisas.criar(ctx, d);
  }
  /** Públicas: sem empresa no contexto; o token diz de quem é a pesquisa. */
  @MessagePattern(P.obterPesquisaPublica)
  obterPesquisaPublica(@Dados() d: unknown) {
    return this.pesquisas.obterPublica(d);
  }
  @MessagePattern(P.responderPesquisaPublica)
  responderPesquisaPublica(@Dados() d: unknown) {
    return this.pesquisas.responderPublica(d);
  }
}
