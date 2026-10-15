import { Injectable } from '@nestjs/common';
import { hojeEmBrasilia, somarDias, validar } from '@davinci/shared';
import {
  horizonteSchema,
  prazo,
  type Contexto,
  type Prazo,
} from '@davinci/types';
import { TemasService } from '../temas/temas.service.js';

/** Prazos da Agenda ESG: meta de tema material ainda abaixo de 100%. */
@Injectable()
export class PrazosService {
  constructor(private readonly temas: TemasService) {}

  /** `dias`: horizonte pedido pelo painel (30, 90 ou 365). */
  async prazos(ctx: Contexto, dados?: unknown): Promise<Prazo[]> {
    const { dias } = validar(horizonteSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const limite = somarDias(hoje, dias);
    return (await this.temas.listar(ctx))
      .filter(
        (t) =>
          t.material &&
          t.prazoMeta &&
          t.prazoMeta <= limite &&
          t.progresso < 100,
      )
      .map((t) =>
        prazo(
          {
            modulo: 'esg',
            tipo: 'Meta ESG',
            descricao: `${t.nome} · ${t.progresso}% atingido`,
            data: t.prazoMeta!,
            href: `/esg/temas/${t.id}`,
          },
          hoje,
        ),
      );
  }
}
