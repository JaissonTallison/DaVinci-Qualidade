import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Dados } from '@davinci/shared';
import { PATTERNS } from '@davinci/types';
import { RecuperacaoService } from './recuperacao.service.js';

/** Recuperar senha (rotas públicas no gateway) e a lista de revogações recentes (para o gateway). */
@Controller()
export class RecuperacaoController {
  constructor(private readonly recuperacao: RecuperacaoService) {}

  @MessagePattern(PATTERNS.identidade.recuperarSenha)
  solicitar(@Dados() dados: unknown) {
    return this.recuperacao.solicitar(dados);
  }

  @MessagePattern(PATTERNS.identidade.redefinirSenha)
  redefinir(@Dados() dados: unknown) {
    return this.recuperacao.redefinir(dados);
  }

  @MessagePattern(PATTERNS.identidade.revogacoesRecentes)
  revogacoesRecentes() {
    return this.recuperacao.revogacoesRecentes();
  }
}
