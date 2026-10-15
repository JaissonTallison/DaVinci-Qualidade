import { Controller, Get, Query } from '@nestjs/common';
import {
  PATTERNS,
  SERVICES,
  type AtividadeCnae,
  type Banco,
  type Contexto,
  type Setor,
} from '@davinci/types';
import { ContextoHttp } from '../contexto.js';
import { MensageriaService } from '../mensageria.service.js';

/** Tabelas oficiais (CNAE/IBGE, setores, bancos/BCB): só exigem login (dados públicos, iguais para todos). */
@Controller('referencias')
export class ReferenciasController {
  constructor(private readonly mensageria: MensageriaService) {}

  @Get('cnaes')
  cnaes(
    @ContextoHttp() ctx: Contexto,
    @Query('busca') busca?: string,
    @Query('setor') setor?: string,
    @Query('codigos') codigos?: string,
  ) {
    const dados = codigos
      ? { codigos: codigos.split(',').slice(0, 100) }
      : { busca, setor };
    return this.mensageria.enviar<AtividadeCnae[]>(
      SERVICES.CODEX,
      PATTERNS.referencias.cnaes,
      dados,
      ctx,
    );
  }

  @Get('setores')
  setores(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<Setor[]>(
      SERVICES.CODEX,
      PATTERNS.referencias.setores,
      {},
      ctx,
    );
  }

  @Get('bancos')
  bancos(@ContextoHttp() ctx: Contexto) {
    return this.mensageria.enviar<Banco[]>(
      SERVICES.CODEX,
      PATTERNS.referencias.bancos,
      {},
      ctx,
    );
  }
}
