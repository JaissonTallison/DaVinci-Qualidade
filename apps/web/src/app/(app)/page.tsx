import type { Metadata } from "next";
import Link from "next/link";
import { IconeDaTela } from "@/components/icones-do-menu";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import {
  MODULOS_DO_PAINEL,
  type DadosDoUsuario,
  type IndicadoresSst,
  type NcsDoMes,
  type PainelDeVencimentos,
  type ResumoAcidentes,
  type ResumoAmbiental,
  type ResumoEsg,
  type ResumoAuditorias,
  type ResumoCalibracao,
  type ResumoEpis,
  type ResumoInspecoes,
  type ResumoNcs,
  type ResumoPgr,
  type ResumoPlanos,
  type ResumoPts,
  type ResumoServicos,
  type ResumoSgi,
  type ResumoVencimentos,
} from "@davinci/types";
import { atalhosVisiveis } from "@/components/navegacao";
import {
  PainelDoInicio,
  type Aba,
  type Atencao,
  type Indicador,
} from "@/components/painel-do-inicio";
import { chamarApi, type Resultado } from "@/lib/api";
import { hojeEmBrasilia, prazoRelativo } from "@/lib/datas";
import { telaDoIcone, textoDoSelo } from "@/components/linha-de-prazo";

export const metadata: Metadata = { title: "Início" };

/** Um componente da saúde do sistema de gestão: percentual em dia e onde resolver. */
interface Componente {
  nome: string;
  pct: number;
  detalhe: string;
  href: string;
}

const ok = <T,>(r: Resultado<T> | null): T | null => (r?.ok ? r.dados : null);
const plural = (n: number, um: string, varios: string) =>
  `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;
const pct = (bons: number, total: number) =>
  Math.round((Math.max(bons, 0) / total) * 100);

const ORDEM_DOS_ATALHOS = [
  "/qualidade/nao-conformidades/nova",
  "/seguranca/acidentes/novo",
  "/qualidade/inspecoes/nova",
  "/seguranca/permissoes-de-trabalho/nova",
  "/servicos/ordens/nova",
];

export default async function Inicio() {
  const r = await chamarApi<DadosDoUsuario>("/auth/eu");
  if (!r.ok) return <h1 className="text-2xl text-texto">Início</h1>;
  const eu = r.dados;
  const pode = (p: string) => eu.permissoes.includes(p as never);
  const hoje = hojeEmBrasilia();
  const [
    painelR,
    ncsMesR,
    ncsR,
    planosR,
    inspR,
    calR,
    audR,
    sgiR,
    servR,
    acidR,
    sstR,
    episR,
    pgrR,
    ptsR,
    vencR,
    ambR,
    esgR,
  ] = await Promise.all([
    pode("paineis.ver")
      ? chamarApi<PainelDeVencimentos>("/paineis/vencimentos?dias=30")
      : null,
    pode("qualidade.ver")
      ? chamarApi<NcsDoMes[]>("/nao-conformidades/por-mes?meses=3")
      : null,
    pode("qualidade.ver")
      ? chamarApi<ResumoNcs>("/nao-conformidades/resumo")
      : null,
    pode("qualidade.ver")
      ? chamarApi<ResumoPlanos>("/planos-de-acao/resumo")
      : null,
    pode("qualidade.ver")
      ? chamarApi<ResumoInspecoes>("/inspecoes/resumo")
      : null,
    pode("qualidade.ver")
      ? chamarApi<ResumoCalibracao>("/instrumentos/resumo")
      : null,
    pode("auditorias.ver")
      ? chamarApi<ResumoAuditorias>("/auditorias/resumo")
      : null,
    pode("sgi.ver") ? chamarApi<ResumoSgi>("/sgi/resumo") : null,
    pode("servicos.ver") ? chamarApi<ResumoServicos>("/servicos/resumo") : null,
    pode("seguranca.ver")
      ? chamarApi<ResumoAcidentes>("/acidentes/resumo")
      : null,
    pode("seguranca.ver")
      ? chamarApi<IndicadoresSst>(
          `/acidentes/indicadores?ano=${hoje.slice(0, 4)}`,
        )
      : null,
    pode("seguranca.ver") ? chamarApi<ResumoEpis>("/epis/resumo") : null,
    pode("seguranca.ver") ? chamarApi<ResumoPgr>("/riscos/resumo") : null,
    pode("seguranca.ver")
      ? chamarApi<ResumoPts>("/permissoes-de-trabalho/resumo")
      : null,
    pode("seguranca.ver") && pode("funcionarios.ver")
      ? chamarApi<ResumoVencimentos>("/vencimentos/resumo")
      : null,
    pode("ambiental.ver")
      ? chamarApi<ResumoAmbiental>("/ambiental/resumo")
      : null,
    pode("esg.ver") ? chamarApi<ResumoEsg>("/esg/resumo") : null,
  ]);
  const [
    painel,
    ncsMes,
    ncs,
    planos,
    insp,
    cal,
    aud,
    sgi,
    serv,
    acid,
    sst,
    epis,
    pgr,
    pts,
    venc,
    amb,
    esgRes,
  ] = [
    ok(painelR),
    ok(ncsMesR),
    ok(ncsR),
    ok(planosR),
    ok(inspR),
    ok(calR),
    ok(audR),
    ok(sgiR),
    ok(servR),
    ok(acidR),
    ok(sstR),
    ok(episR),
    ok(pgrR),
    ok(ptsR),
    ok(vencR),
    ok(ambR),
    ok(esgR),
  ];

  // ---------------------------------------------------------------- saúde do sistema de gestão
  const componentes: Componente[] = [];
  if (ncs?.abertas)
    componentes.push({
      nome: "NCs no prazo",
      pct: pct(ncs.abertas - ncs.vencidas, ncs.abertas),
      detalhe: `${plural(ncs.vencidas, "NC vencida", "NCs vencidas")} de ${ncs.abertas} em aberto`,
      href: "/qualidade/nao-conformidades?vencidas=true",
    });
  if (planos?.emExecucao)
    componentes.push({
      nome: "Planos sem atraso",
      pct: pct(planos.emExecucao - planos.atrasados, planos.emExecucao),
      detalhe: `${plural(planos.atrasados, "plano com tarefa vencida", "planos com tarefa vencida")}`,
      href: "/qualidade/planos-de-acao?atrasados=true",
    });
  if (cal?.emUso)
    componentes.push({
      nome: "Calibração em dia",
      pct: pct(cal.emUso - cal.vencidos - cal.reprovados, cal.emUso),
      detalhe: `${plural(cal.vencidos + cal.reprovados, "instrumento vencido ou reprovado", "instrumentos vencidos ou reprovados")} de ${cal.emUso} em uso`,
      href: "/qualidade/calibracao?situacao=vencido",
    });
  if (venc?.total)
    componentes.push({
      nome: "ASO e treinamentos em dia",
      pct: pct(venc.total - venc.vencidos, venc.total),
      detalhe: `${plural(venc.vencidos, "vencido", "vencidos")} de ${venc.total}`,
      href: "/seguranca/vencimentos?situacao=vencido",
    });
  if (sgi?.objetivosMedidos)
    componentes.push({
      nome: "Objetivos na meta",
      pct: pct(sgi.objetivosMedidos - sgi.objetivosFora, sgi.objetivosMedidos),
      detalhe: `${plural(sgi.objetivosFora, "objetivo fora da meta", "objetivos fora da meta")} de ${sgi.objetivosMedidos}`,
      href: "/sgi/objetivos",
    });
  if (amb?.licencas)
    componentes.push({
      nome: "Licenças vigentes",
      pct: pct(amb.licencas - amb.licencasVencidas, amb.licencas),
      detalhe: `${plural(amb.licencasVencidas, "licença vencida", "licenças vencidas")} de ${amb.licencas}`,
      href: "/ambiental/licencas",
    });
  const saude = componentes.length
    ? Math.round(
        componentes.reduce((t, c) => t + c.pct, 0) / componentes.length,
      )
    : null;
  const pior = [...componentes].sort((a, b) => a.pct - b.pct)[0];

  // ---------------------------------------------------------------- precisa da sua atenção
  const atencao: Atencao[] = [];
  for (const p of painel?.prazos ?? [])
    if (p.situacao === "vencido")
      atencao.push({
        titulo: `${p.tipo}: ${p.descricao}`,
        detalhe: MODULOS_DO_PAINEL[p.modulo],
        href: p.href,
        icone: telaDoIcone(p.tipo, p.href),
        selo: textoDoSelo(prazoRelativo(p.data)),
        tom: "vencido",
      });
  if (pts?.aguardandoLiberacao && pode("seguranca.liberar-pt"))
    atencao.push({
      titulo: `${plural(pts.aguardandoLiberacao, "permissão de trabalho aguardando", "permissões de trabalho aguardando")} liberação`,
      detalhe: "Segurança do Trabalho · o serviço só começa depois de liberar",
      href: "/seguranca/permissoes-de-trabalho?status=solicitada",
      icone: telaDoIcone(
        undefined,
        "/seguranca/permissoes-de-trabalho?status=solicitada",
      ),
      selo: "Aguardando",
      tom: "aguardando",
    });
  if (sgi?.mudancasAguardandoDecisao && pode("sgi.excluir"))
    atencao.push({
      titulo: `${plural(sgi.mudancasAguardandoDecisao, "mudança aguardando", "mudanças aguardando")} decisão`,
      detalhe: "Gestão do SGI · aprovar ou rejeitar",
      href: "/sgi/mudancas?status=proposta",
      icone: telaDoIcone(undefined, "/sgi/mudancas?status=proposta"),
      selo: "Aguardando",
      tom: "aguardando",
    });
  if (pgr?.criticos)
    atencao.push({
      titulo: `${plural(pgr.criticos, "risco crítico", "riscos críticos")} no PGR`,
      detalhe: "Segurança do Trabalho · acompanhe as medidas",
      href: "/seguranca/pgr?nivel=critico",
      icone: telaDoIcone(undefined, "/seguranca/pgr?nivel=critico"),
      selo: "Crítico",
      tom: "vencido",
    });
  if (sgi?.analiseCriticaAtrasada)
    atencao.push({
      titulo: sgi.proximaAnaliseCritica
        ? "Análise crítica pela direção atrasada"
        : "Análise crítica pela direção ainda não registrada",
      detalhe: "Gestão do SGI · ISO 9001, 9.3",
      href: "/sgi/analises-criticas",
      icone: telaDoIcone(undefined, "/sgi/analises-criticas"),
      selo: Boolean(sgi.proximaAnaliseCritica) ? "Atrasada" : "Pendente",
      tom: Boolean(sgi.proximaAnaliseCritica) ? "vencido" : "aguardando",
    });

  // ---------------------------------------------------------------- números de cada aba
  const indicadores: Partial<Record<Exclude<Aba, "geral">, Indicador[]>> = {};
  if (ncs || planos || insp || cal)
    indicadores.qualidade = [
      ...(ncs
        ? [
            {
              rotulo: "NCs em aberto",
              valor: ncs.abertas,
              href: "/qualidade/nao-conformidades",
            },
            {
              rotulo: "NCs altas ou críticas",
              valor: ncs.graves,
              href: "/qualidade/nao-conformidades",
              alerta: true,
            },
          ]
        : []),
      ...(planos
        ? [
            {
              rotulo: "Planos com tarefa vencida",
              valor: planos.atrasados,
              href: "/qualidade/planos-de-acao?atrasados=true",
              alerta: true,
            },
          ]
        : []),
      ...(insp
        ? [
            {
              rotulo: "Aprovação das inspeções (30 dias)",
              valor: insp.taxaDeAprovacao30Dias,
              sufixo: "%",
              href: "/qualidade/inspecoes",
            },
          ]
        : []),
      ...(cal
        ? [
            {
              rotulo: "Instrumentos vencidos",
              valor: cal.vencidos,
              href: "/qualidade/calibracao?situacao=vencido",
              alerta: true,
            },
          ]
        : []),
      ...(aud
        ? [
            {
              rotulo: "Auditorias planejadas",
              valor: aud.planejadas,
              href: "/auditorias?status=planejada",
            },
          ]
        : []),
    ];
  if (acid || epis || pgr || venc)
    indicadores.seguranca = [
      ...(acid
        ? [
            {
              rotulo: "Dias sem acidente com afastamento",
              valor: acid.diasSemAcidente,
              href: "/seguranca/indicadores",
            },
            {
              rotulo: "CATs atrasadas",
              valor: acid.catsAtrasadas,
              href: "/seguranca/acidentes",
              alerta: true,
            },
          ]
        : []),
      ...(pgr
        ? [
            {
              rotulo: "Riscos críticos no PGR",
              valor: pgr.criticos,
              href: "/seguranca/pgr?nivel=critico",
              alerta: true,
            },
          ]
        : []),
      ...(pts
        ? [
            {
              rotulo: "PTs aguardando liberação",
              valor: pts.aguardandoLiberacao,
              href: "/seguranca/permissoes-de-trabalho?status=solicitada",
            },
          ]
        : []),
      ...(epis
        ? [
            {
              rotulo: "Trocas de EPI vencidas",
              valor: epis.trocasVencidas,
              href: "/seguranca/entregas-de-epi?situacao=troca_vencida",
              alerta: true,
            },
          ]
        : []),
      ...(venc
        ? [
            {
              rotulo: "ASO e treinamentos vencidos",
              valor: venc.vencidos,
              href: "/seguranca/vencimentos?situacao=vencido",
              alerta: true,
            },
          ]
        : []),
    ];
  if (sgi)
    indicadores.sgi = [
      {
        rotulo: "Objetivos fora da meta",
        valor: sgi.objetivosFora,
        href: "/sgi/objetivos",
        alerta: true,
      },
      {
        rotulo: "Riscos e oportunidades altos",
        valor: sgi.rosAltosAbertos,
        href: "/sgi/riscos-e-oportunidades?classe=alta",
        alerta: true,
      },
      {
        rotulo: "Mudanças aguardando decisão",
        valor: sgi.mudancasAguardandoDecisao,
        href: "/sgi/mudancas?status=proposta",
      },
      {
        rotulo: "Objetivos sem medição",
        valor: sgi.objetivosSemMedicao,
        href: "/sgi/objetivos",
        alerta: true,
      },
    ];
  if (serv)
    indicadores.servicos = [
      {
        rotulo: "Ordens de serviço em aberto",
        valor: serv.osAbertas,
        href: "/servicos/ordens",
      },
      {
        rotulo: "OS atrasadas",
        valor: serv.osAtrasadas,
        href: "/servicos/ordens",
        alerta: true,
      },
      {
        rotulo: "NPS (12 meses)",
        valor: serv.nps12Meses,
        href: "/servicos/nps",
      },
      {
        rotulo: "Fornecedores reprovados",
        valor: serv.fornecedoresReprovados,
        href: "/servicos/fornecedores",
        alerta: true,
      },
    ];
  if (amb)
    indicadores.ambiental = [
      {
        rotulo: "Aspectos significativos",
        valor: amb.aspectosSignificativos,
        href: "/ambiental/aspectos?significativos=sim",
      },
      {
        rotulo: "Licenças a renovar ou vencidas",
        valor: amb.licencasParaRenovar + amb.licencasVencidas,
        href: "/ambiental/licencas",
        alerta: true,
      },
      {
        rotulo: "Condicionantes e CDFs atrasados",
        valor: amb.condicionantesVencidas + amb.cdfsAtrasados,
        href: "/paineis/vencimentos",
        alerta: true,
      },
      {
        rotulo: "Requisitos não atendidos",
        valor: amb.requisitosNaoAtendidos,
        href: "/ambiental/requisitos?atendimento=nao_atende",
        alerta: true,
      },
      {
        rotulo: "Monitoramentos fora do limite",
        valor: amb.foraDoLimite,
        href: "/ambiental/monitoramentos",
        alerta: true,
      },
      {
        rotulo: "FDS para revisar",
        valor: amb.fdsVencidas,
        href: "/ambiental/produtos-quimicos?fds=vencida",
        alerta: true,
      },
    ];
  if (esgRes)
    indicadores.esg = [
      {
        rotulo: "Temas materiais",
        valor: esgRes.materiais,
        href: "/esg/materialidade",
      },
      {
        rotulo: "Metas atrasadas",
        valor: esgRes.metasAtrasadas,
        href: "/esg/temas",
        alerta: true,
      },
      {
        rotulo: "Temas sem avaliação",
        valor: esgRes.semAvaliacao,
        href: "/esg/temas",
        alerta: true,
      },
      {
        rotulo: "ODS com tema material",
        valor: esgRes.odsComTemaMaterial,
        href: "/esg/ods",
      },
    ];
  const abas: Aba[] = [
    "geral",
    ...(
      ["qualidade", "seguranca", "sgi", "servicos", "ambiental", "esg"] as const
    ).filter((a) => indicadores[a]?.length),
  ];

  const agora = new Date();
  const hora = Number(
    agora
      .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
      .slice(11, 13),
  );
  const saudacao =
    hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const data = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(agora);
  const atalhos = atalhosVisiveis(eu.permissoes, eu.recursos)
    .filter((a) => ORDEM_DOS_ATALHOS.includes(a.href))
    .sort(
      (a, b) =>
        ORDEM_DOS_ATALHOS.indexOf(a.href) - ORDEM_DOS_ATALHOS.indexOf(b.href),
    )
    .slice(0, 4);
  const vencidos =
    painel?.prazos.filter((p) => p.situacao === "vencido").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <section
        className="dv-destaque dv-entrar relative overflow-hidden p-6 text-primaria-texto sm:p-8"
        aria-label="Saúde do sistema de gestão"
      >
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 md:flex-1">
            <p className="text-xs font-semibold tracking-[0.12em] text-primaria-texto/70 uppercase">
              DaVinci Qualidade · {data}
            </p>
            <h1 className="mt-2 font-serif text-3xl">
              {saudacao}, {eu.usuario.nome.split(" ")[0]}
            </h1>
            <p className="mt-1 text-base text-primaria-texto/80">
              {vencidos
                ? `${plural(vencidos, "prazo vencido", "prazos vencidos")} em ${eu.empresa.nome}.`
                : `Nenhum prazo vencido em ${eu.empresa.nome}.`}
            </p>

            {pior && pior.pct < 100 ? (
              <div className="dv-destaque-interno mt-5 max-w-xl p-4">
                <p className="text-base font-semibold">
                  Comece por: {pior.nome.toLowerCase()}
                </p>
                <p className="mt-0.5 text-sm text-primaria-texto/80">
                  Está em {pior.pct}%: {pior.detalhe}.
                </p>
                <Link
                  href={pior.href}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-sm bg-primaria-texto px-4 text-base font-semibold text-primaria transition-opacity hover:opacity-90"
                >
                  Resolver agora
                  <ArrowRight aria-hidden size={16} strokeWidth={2} />
                </Link>
              </div>
            ) : (
              <div className="dv-destaque-interno mt-5 max-w-xl p-4">
                <p className="text-base font-semibold">Tudo em dia</p>
                <p className="mt-0.5 text-sm text-primaria-texto/80">
                  Nenhum indicador abaixo de 100%. Bom trabalho.
                </p>
              </div>
            )}

            {atalhos.length > 0 && (
              <nav aria-label="Atalhos" className="mt-5 flex flex-wrap gap-2">
                {atalhos.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-primaria-texto/25 px-3 text-sm text-primaria-texto transition-colors hover:bg-primaria-texto/10"
                  >
                    <IconeDaTela href={a.href} />
                    {a.rotulo}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <Anel valor={saude} />
            {componentes.length > 0 && (
              <ul className="w-full max-w-xs space-y-1.5 text-xs text-primaria-texto/80 md:w-56">
                {componentes.map((c, i) => (
                  <li key={c.nome}>
                    <Link
                      href={c.href}
                      className="block rounded-xs hover:text-primaria-texto"
                    >
                      <span className="flex justify-between">
                        <span>{c.nome}</span>
                        <span className="font-semibold text-primaria-texto tabular-nums">
                          {c.pct}%
                        </span>
                      </span>
                      <span className="mt-0.5 block h-1 overflow-hidden rounded-xs bg-primaria-texto/15">
                        <span
                          className="dv-crescer block h-full bg-ouro-claro"
                          style={
                            {
                              width: `${c.pct}%`,
                              "--atraso": `${400 + i * 80}ms`,
                            } as CSSProperties
                          }
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <PainelDoInicio
        hoje={hoje}
        abas={abas}
        inicial={{ prazos: painel?.prazos ?? [], ncsPorMes: ncsMes }}
        sst={
          sst?.meses.filter((m) => m.competencia <= hoje.slice(0, 7)) ?? null
        }
        indicadores={indicadores}
        atencao={atencao}
      />
    </div>
  );
}

/** Anel da saúde: preenche até o valor ao abrir (animação de 1,1 s; parada com "reduzir movimento"). */
function Anel({ valor }: { valor: number | null }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const v = valor ?? 0;
  return (
    <div className="relative size-40">
      <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden>
        <circle
          cx={70}
          cy={70}
          r={r}
          fill="none"
          strokeWidth={10}
          className="stroke-primaria-texto/15"
        />
        <circle
          cx={70}
          cy={70}
          r={r}
          fill="none"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className="dv-anel stroke-ouro-claro"
          style={{ "--circunferencia": c } as CSSProperties}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        role="img"
        aria-label={
          valor === null
            ? "Saúde sem dados"
            : `Saúde do sistema de gestão: ${valor}%`
        }
      >
        <span className="text-3xl font-semibold tabular-nums">
          {valor === null ? "—" : `${valor}%`}
        </span>
        <span className="text-xs tracking-[0.12em] text-primaria-texto/70 uppercase">
          Saúde
        </span>
      </div>
    </div>
  );
}
