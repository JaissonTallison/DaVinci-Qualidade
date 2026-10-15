import { Injectable } from '@nestjs/common';
import {
  horizonteSchema,
  prazo,
  type Contexto,
  type Prazo,
} from '@davinci/types';
import { hojeEmBrasilia, validar, somarDias } from '@davinci/shared';
import { ExamesETreinamentosService } from '../exames-e-treinamentos/exames-e-treinamentos.service.js';

/** Prazos do cadastro: ASO e treinamentos vencidos ou vencendo em até 30 dias. */
@Injectable()
export class PrazosService {
  constructor(private readonly exames: ExamesETreinamentosService) {}

  /** `dias`: horizonte pedido pelo painel (30, 90 ou 365). */
  async prazos(ctx: Contexto, dados?: unknown): Promise<Prazo[]> {
    const { dias } = validar(horizonteSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const lista = await this.exames.vencimentos(ctx, {});
    return lista
      .filter((v) => v.validade <= somarDias(hoje, dias))
      .map((v) =>
        prazo(
          {
            modulo: 'funcionarios',
            tipo: v.tipo === 'aso' ? 'ASO' : 'Treinamento',
            descricao: `${v.descricao} · ${v.funcionarioNome}`,
            data: v.validade,
            href: `/cadastros/funcionarios/${v.funcionarioId}`,
          },
          hoje,
        ),
      );
  }
}
