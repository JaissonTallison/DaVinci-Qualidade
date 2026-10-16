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
import { MonitoramentosService } from '../monitoramentos/monitoramentos.service.js';
import { QuimicosService } from '../quimicos/quimicos.service.js';
import { GestaoAmbientalService } from '../gestao/gestao.service.js';

/**
 * Prazos de Meio Ambiente: renovação e validade de licença, condicionante, avaliação de requisito, ação de aspecto,
 * CDF, revisão de FDS e próxima coleta de monitoramento.
 */
@Injectable()
export class PrazosService {
  constructor(
    private readonly ambiental: AmbientalService,
    private readonly quimicos: QuimicosService,
    private readonly monitoramentos: MonitoramentosService,
    private readonly gestao: GestaoAmbientalService,
  ) {}

  /** `dias`: horizonte pedido pelo painel (30, 90 ou 365). */
  async prazos(ctx: Contexto, dados?: unknown): Promise<Prazo[]> {
    const { dias } = validar(horizonteSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const limite = somarDias(hoje, dias);
    const [ls, rs, as, ss, ps, ms] = await Promise.all([
      this.ambiental.listarLicencas(ctx),
      this.ambiental.listarRequisitos(ctx, {}),
      this.ambiental.listarAspectos(ctx, {}),
      this.ambiental.listarSaidas(ctx, { semCdf: 'sim' }),
      this.quimicos.listar(ctx, {}),
      this.monitoramentos.listar(ctx),
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
    for (const p of ps)
      if (p.proximaRevisaoFds <= limite)
        lista.push(
          prazo(
            {
              modulo: 'ambiental',
              tipo: 'Revisão de FDS',
              descricao: `${p.nome} · ${p.fabricante}`,
              data: p.proximaRevisaoFds,
              href: `/ambiental/produtos-quimicos/${p.id}`,
            },
            hoje,
          ),
        );
    for (const m of ms)
      if (m.proximaColeta <= limite)
        lista.push(
          prazo(
            {
              modulo: 'ambiental',
              tipo: 'Coleta de monitoramento',
              descricao: `${m.parametro} · ${m.ponto}`,
              data: m.proximaColeta,
              href: `/ambiental/monitoramentos/${m.id}`,
            },
            hoje,
          ),
        );
    const [obrigs, ocors, dests] = await Promise.all([
      this.gestao.listarObrigacoes(ctx),
      this.gestao.listarOcorrencias(ctx),
      this.gestao.listarDestinadores(ctx),
    ]);
    for (const o of obrigs)
      if (o.proximoVencimento && o.proximoVencimento <= limite)
        lista.push(
          prazo(
            {
              modulo: 'ambiental',
              tipo: 'Obrigação legal',
              descricao: `${o.nome} · ${o.orgao}`,
              data: o.proximoVencimento,
              href: '/ambiental/obrigacoes',
            },
            hoje,
          ),
        );
    for (const o of ocors)
      if (o.prazoComunicacao && !o.comunicacao && o.status === 'aberta')
        lista.push(
          prazo(
            {
              modulo: 'ambiental',
              tipo: 'Comunicação de ocorrência',
              descricao: `${o.numero} · ${o.substancia}`,
              data: o.prazoComunicacao,
              href: `/ambiental/ocorrencias/${o.id}`,
            },
            hoje,
          ),
        );
    for (const d of dests)
      if (d.licencaValidade <= limite)
        lista.push(
          prazo(
            {
              modulo: 'ambiental',
              tipo: 'Licença de destinador',
              descricao: `${d.nome} · ${d.licencaNumero}`,
              data: d.licencaValidade,
              href: '/ambiental/destinadores',
            },
            hoje,
          ),
        );
    return lista;
  }
}
