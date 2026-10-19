import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AtalhosDeModulos } from "@/components/atalhos-de-modulos";
import { RelogioDoDia } from "@/components/relogio-do-dia";
import { botaoPrimario } from "@/lib/estilos";
import type { CSSProperties } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  MODULOS_DO_PAINEL,
  type DadosDoUsuario,
  type IndicadoresSst,
  type NcsDoMes,
  type PainelDeVencimentos,
  type ResumoAmbiental,
  type ResumoCalibracao,
  type ResumoNcs,
  type ResumoPgr,
  type ResumoPlanos,
  type ResumoPts,
  type ResumoSgi,
  type ResumoVencimentos,
} from "@davinci/types";
import { PainelDoInicio, type Atencao } from "@/components/painel-do-inicio";
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
    calR,
    sgiR,
    sstR,
    pgrR,
    ptsR,
    vencR,
    ambR,
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
      ? chamarApi<ResumoCalibracao>("/instrumentos/resumo")
      : null,
    pode("sgi.ver") ? chamarApi<ResumoSgi>("/sgi/resumo") : null,
    pode("seguranca.ver")
      ? chamarApi<IndicadoresSst>(
          `/acidentes/indicadores?ano=${hoje.slice(0, 4)}`,
        )
      : null,
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
  ]);
  const [painel, ncsMes, ncs, planos, cal, sgi, sst, pgr, pts, venc, amb] = [
    ok(painelR),
    ok(ncsMesR),
    ok(ncsR),
    ok(planosR),
    ok(calR),
    ok(sgiR),
    ok(sstR),
    ok(pgrR),
    ok(ptsR),
    ok(vencR),
    ok(ambR),
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


  const agora = new Date();
  const hora = Number(
    agora
      .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
      .slice(11, 13),
  );
  const saudacao =
    hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
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
        className="relative isolate overflow-hidden rounded-md border border-borda shadow-cartao"
        aria-label="DaVinci Qualidade"
      >
        <Image
          src="/acesso/fundo.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover object-[30%_center]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-marinho/85" />
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-5">
          <div className="min-w-0 max-w-xl">
            <h1 className="text-2xl font-semibold text-primaria-texto">
              {saudacao}, {eu.usuario.nome.split(" ")[0]}
            </h1>
            <p className="mt-1 text-base text-primaria-texto/80">
              Gestão integrada para uma empresa mais segura, eficiente e
              sustentável.
            </p>
          </div>
          <RelogioDoDia inicialISO={agora.toISOString()} />
        </div>
      </section>

      <section
        className="dv-entrar overflow-hidden rounded-md border border-borda bg-superficie shadow-cartao md:grid md:grid-cols-[minmax(0,1fr)_auto]"
        aria-label="Resumo do dia"
      >
        <div className="flex min-w-0 flex-col p-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-texto-3 uppercase">
            Resumo de hoje · {eu.empresa.nome}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold tabular-nums ${vencidos ? "text-nao-conforme" : "text-conforme"}`}
              >
                {vencidos}
              </span>
              <span className="text-sm text-texto-2">
                {vencidos === 1 ? "prazo vencido" : "prazos vencidos"}
              </span>
            </div>
            <span aria-hidden className="h-8 w-px bg-borda" />
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold tabular-nums ${nestaSemana ? "text-atencao" : "text-texto-2"}`}
              >
                {nestaSemana}
              </span>
              <span className="text-sm text-texto-2">vencem em 7 dias</span>
            </div>
          </div>
          {pior && pior.pct < 100 ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md border border-borda bg-campo p-3.5">
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
            <p className="mt-4 rounded-md border border-conforme/30 bg-conforme/8 p-3.5 text-base text-conforme">
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

      <AtalhosDeModulos permissoes={eu.permissoes} />

      <PainelDoInicio
        hoje={hoje}
        temNcs={pode("qualidade.ver")}
        inicial={{ prazos: painel?.prazos ?? [], ncsPorMes: ncsMes }}
        sst={
          sst?.meses.filter((m) => m.competencia <= hoje.slice(0, 7)) ?? null
        }
        atencao={atencao}
      />
    </div>
  );
}

/** Saúde em anel compacto: verde a partir de 90%, âmbar de 70 a 89%, vermelho abaixo; preenche ao abrir. */
function Anel({ valor }: { valor: number | null }) {
  const r = 34;
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
      className="relative size-28 shrink-0"
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
          strokeWidth={15}
          className="stroke-borda"
        />
        <circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          strokeWidth={15}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className={`dv-anel ${cor}`}
          style={{ "--circunferencia": c } as CSSProperties}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-2xl font-bold text-texto tabular-nums">
          {valor === null ? "—" : `${valor}%`}
        </span>
        <span className="mt-1 text-[0.625rem] font-semibold tracking-[0.1em] text-texto-3 uppercase">
          saúde
        </span>
      </span>
    </div>
  );
}
