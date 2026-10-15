import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Contexto, Dados } from '@davinci/shared';
import { PATTERNS, type Contexto as Ctx } from '@davinci/types';
import { EstruturaService } from './estrutura.service.js';
import { FuncionariosService } from './funcionarios.service.js';

const F = PATTERNS.funcionarios;
const S = PATTERNS.setoresEmpresa;
const C = PATTERNS.funcoes;
type ComId = { id?: unknown; alteracoes?: unknown };

/** Funcionários, setores e funções, pela fila davinci.codex. Toda regra está nos services. */
@Controller()
export class FuncionariosController {
  constructor(
    private readonly funcionarios: FuncionariosService,
    private readonly estrutura: EstruturaService,
  ) {}

  @MessagePattern(F.listar)
  listar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.funcionarios.listar(ctx, dados);
  }

  @MessagePattern(F.obter)
  obter(@Contexto() ctx: Ctx, @Dados() dados: { id?: unknown }) {
    return this.funcionarios.obter(ctx, dados);
  }

  @MessagePattern(F.criar)
  criar(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.funcionarios.criar(ctx, dados);
  }

  @MessagePattern(F.atualizar)
  atualizar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.funcionarios.atualizar(ctx, dados);
  }

  @MessagePattern(F.desligar)
  desligar(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.funcionarios.desligar(ctx, dados);
  }

  @MessagePattern(F.readmitir)
  readmitir(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.funcionarios.readmitir(ctx, dados);
  }

  @MessagePattern(S.listar)
  listarSetores(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.estrutura.listarSetores(ctx, dados);
  }

  @MessagePattern(S.criar)
  criarSetor(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.estrutura.criarSetor(ctx, dados);
  }

  @MessagePattern(S.atualizar)
  atualizarSetor(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.estrutura.atualizarSetor(ctx, dados);
  }

  @MessagePattern(S.mudarSituacao)
  mudarSituacaoDoSetor(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.estrutura.mudarSituacaoDoSetor(ctx, dados);
  }

  @MessagePattern(C.listar)
  listarFuncoes(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.estrutura.listarFuncoes(ctx, dados);
  }

  @MessagePattern(C.criar)
  criarFuncao(@Contexto() ctx: Ctx, @Dados() dados: unknown) {
    return this.estrutura.criarFuncao(ctx, dados);
  }

  @MessagePattern(C.atualizar)
  atualizarFuncao(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.estrutura.atualizarFuncao(ctx, dados);
  }

  @MessagePattern(C.mudarSituacao)
  mudarSituacaoDaFuncao(@Contexto() ctx: Ctx, @Dados() dados: ComId) {
    return this.estrutura.mudarSituacaoDaFuncao(ctx, dados);
  }
}
