import { Injectable } from '@nestjs/common';
import { hojeEmBrasilia, somarDias, validar } from '@davinci/shared';
import {
  horizonteSchema,
  prazo,
  TIPOS_LICENCA,
  type Contexto,
  type Prazo,
} from '@davinci/types';
import { AmbientalService } from '../ambiental/ambiental.service.js';

/** Prazos de Meio Ambiente: renovação e validade de licença, condicionante, avaliação de requisito, ação de aspecto e CDF. */
@Injectable()
export class PrazosService {
  constructor(private readonly ambiental: AmbientalService) {}

  /** `dias`: horizonte pedido pelo painel (30, 90 ou 365). */
  async prazos(ctx: Contexto, dados?: unknown): Promise<Prazo[]> {
    const { dias } = validar(horizonteSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const limite = somarDias(hoje, dias);
    const [ls, rs, as, ss] = await Promise.all([
      this.ambiental.listarLicencas(ctx),
      this.ambiental.listarRequisitos(ctx, {}),
      this.ambiental.listarAspectos(ctx, {}),
      this.ambiental.listarSaidas(ctx, { semCdf: 'sim' }),
    ]);
    const lista: Prazo[] = [];
    for (const l of ls) {
      const nome = `${TIPOS_LICENCA[l.tipo]} nº ${l.numero}`;
      if (l.situacao === 'em_renovacao') {
        if (l.validade <= limite)
          lista.push(
            prazo(
              {
                modulo: 'ambiental',
                tipo: 'Validade de licença',
                descricao: `${nome} (renovação protocolada)`,
                data: l.validade,
                href: `/ambiental/licencas/${l.id}`,
              },
              hoje,
            ),
          );
      } else if (l.renovarAte <= limite)
        lista.push(
          prazo(
            {
              modulo: 'ambiental',
              tipo: 'Renovação de licença',
              descricao: nome,
              data: l.renovarAte,
              href: `/ambiental/licencas/${l.id}`,
            },
            hoje,
          ),
        );
      for (const c of l.condicionantes)
        if (!c.cumpridaEm && c.prazo && c.prazo <= limite)
          lista.push(
            prazo(
              {
                modulo: 'ambiental',
                tipo: 'Condicionante',
                descricao: `${c.descricao} · ${nome}`,
                data: c.prazo,
                href: `/ambiental/licencas/${l.id}`,
              },
              hoje,
            ),
          );
    }
    for (const r of rs)
      if (r.proximaAvaliacao ? r.proximaAvaliacao <= limite : true)
        lista.push(
          prazo(
            {
              modulo: 'ambiental',
              tipo: 'Avaliação de requisito legal',
              descricao: r.norma,
              data: r.proximaAvaliacao ?? hoje,
              href: `/ambiental/requisitos/${r.id}`,
            },
            hoje,
          ),
        );
    for (const a of as)
      if (a.significativo && a.prazo && a.prazo <= limite)
        lista.push(
          prazo(
            {
              modulo: 'ambiental',
              tipo: 'Ação de aspecto ambiental',
              descricao: `${a.atividade} · ${a.aspecto}`,
              data: a.prazo,
              href: `/ambiental/aspectos/${a.id}`,
            },
            hoje,
          ),
        );
    for (const s of ss) {
      const limiteCdf = somarDias(s.data, 30);
      if (limiteCdf <= limite)
        lista.push(
          prazo(
            {
              modulo: 'ambiental',
              tipo: 'CDF de resíduo',
              descricao: `MTR ${s.mtr} · ${s.residuoNome}`,
              data: limiteCdf,
              href: '/ambiental/residuos',
            },
            hoje,
          ),
        );
    }
    return lista;
  }
}
