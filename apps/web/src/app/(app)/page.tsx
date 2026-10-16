import type { Metadata } from "next";
import Link from "next/link";
import { botaoPrimario } from "@/lib/estilos";
import type { CSSProperties } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
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
/** Data (AAAA-MM-DD) n dias depois. */
const diasDepois = (dia: string, n: number) =>
  new Date(Date.parse(`${dia}T00:00:00Z`) + n * 86_400_000)
    .toISOString()
    .slice(0, 10);
const pct = (bons: number, total: number) =>
  Math.round((Math.max(bons, 0) / total) * 100);

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
  const vencidos =
    painel?.prazos.filter((p) => p.situacao === "vencido").length ?? 0;
  const emSeteDias = diasDepois(hoje, 7);
  const nestaSemana =
    painel?.prazos.filter(
      (p) => p.situacao !== "vencido" && p.data <= emSeteDias,
    ).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <section
        className="dv-entrar overflow-hidden rounded-md border border-borda bg-superficie shadow-cartao md:grid md:grid-cols-[minmax(0,1fr)_auto]"
        aria-label="Resumo do dia"
      >
        <div className="min-w-0 p-5">
          <p className="text-sm text-texto-2 first-letter:uppercase">{data}</p>
          <h1 className="mt-0.5 text-2xl text-texto">
            {saudacao}, {eu.usuario.nome.split(" ")[0]}
          </h1>
          <p className="mt-1 text-base text-texto-2">
            {vencidos ? (
              <span className="font-semibold text-nao-conforme">
                {plural(vencidos, "prazo vencido", "prazos vencidos")}
              </span>
            ) : (
              "Nenhum prazo vencido"
            )}{" "}
            {nestaSemana > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="font-semibold text-atencao">
                  {plural(nestaSemana, "vence", "vencem")} nos próximos 7 dias
                </span>
              </>
            )}{" "}
            em {eu.empresa.nome}.
          </p>
          {pior && pior.pct < 100 ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-borda pt-3">
              <p className="min-w-0 flex-1 text-base text-texto">
                <span className="mr-2 text-xs font-semibold tracking-[0.08em] text-acao uppercase">
                  Prioridade
                </span>
                {pior.nome}: {pior.detalhe}.
              </p>
              <Link href={pior.href} className={botaoPrimario}>
                Resolver
                <ArrowRight aria-hidden size={16} strokeWidth={2} />
              </Link>
            </div>
          ) : (
            <p className="mt-4 border-t border-borda pt-3 text-base text-conforme">
              Todos os indicadores em 100%. Nada pede ação agora.
            </p>
          )}
        </div>

        {componentes.length > 0 && (
          <div className="flex items-center gap-5 border-t border-borda bg-campo p-5 md:border-t-0 md:border-l">
            <Anel valor={saude} />
            <div className="min-w-48">
              <p className="text-sm font-semibold text-texto">
                Saúde do sistema de gestão
              </p>
              <ul className="mt-1.5 space-y-0.5 text-sm">
                {componentes.map((c) => (
                  <li key={c.nome}>
                    <Link
                      href={c.href}
                      className="group -mx-2 flex items-center justify-between gap-4 rounded-sm px-2 py-0.5 text-texto-2 transition-colors hover:bg-superficie hover:text-texto"
                    >
                      <span className="truncate">{c.nome}</span>
                      <span className="flex items-center gap-1">
                        <span
                          className={`font-semibold tabular-nums ${c.pct < 100 ? "text-nao-conforme" : "text-texto"}`}
                        >
                          {c.pct}%
                        </span>
                        <ChevronRight
                          aria-hidden
                          size={14}
                          strokeWidth={2}
                          className="text-texto-3 opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
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

/** Saúde em anel compacto: verde a partir de 90%, âmbar de 70 a 89%, vermelho abaixo; preenche ao abrir. */
function Anel({ valor }: { valor: number | null }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const v = valor ?? 0;
  const cor =
    valor === null
      ? "stroke-borda"
      : v >= 90
        ? "stroke-conforme"
        : v >= 70
          ? "stroke-ambar"
          : "stroke-nao-conforme";
  return (
    <div
      className="relative size-[88px] shrink-0"
      role="img"
      aria-label={
        valor === null
          ? "Saúde sem dados"
          : `Saúde do sistema de gestão: ${valor}%`
      }
    >
      <svg viewBox="0 0 88 88" className="size-full -rotate-90" aria-hidden>
        <circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          strokeWidth={7}
          className="stroke-borda"
        />
        <circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className={`dv-anel ${cor}`}
          style={{ "--circunferencia": c } as CSSProperties}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-xl font-bold text-texto tabular-nums">
          {valor === null ? "—" : `${valor}%`}
        </span>
        <span className="mt-1 text-[0.625rem] font-semibold tracking-[0.1em] text-texto-3 uppercase">
          saúde
        </span>
      </span>
    </div>
  );
}
