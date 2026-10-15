import { Controller, Get, Param } from '@nestjs/common';
import {
  PATTERNS,
  SERVICES,
  type ConsultaCep,
  type ConsultaCnpj,
  type Contexto,
} from '@davinci/types';
import { Permissao } from '../auth/decoradores.js';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';

/**
 * Consultas públicas (Integrações): preenchem cadastros. Quem pode cadastrar parceiros
 * ou alterar os dados da empresa pode consultar. A fonte externa pode demorar: prazo maior.
 */
@Controller('consultas')
@Permissao('parceiros.editar', 'empresa.gerenciar')
export class ConsultasController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get('cnpj/:cnpj')
  cnpj(@ContextoHttp() ctx: Contexto, @Param('cnpj') cnpj: string) {
    return this.mensageria.enviar<ConsultaCnpj>(
      SERVICES.INTEGRACOES,
      PATTERNS.consultas.cnpj,
      { cnpj },
      ctx,
      20_000,
    );
  }

  @Get('cep/:cep')
  cep(@ContextoHttp() ctx: Contexto, @Param('cep') cep: string) {
    return this.mensageria.enviar<ConsultaCep>(
      SERVICES.INTEGRACOES,
      PATTERNS.consultas.cep,
      { cep },
      ctx,
      15_000,
    );
  }
}
