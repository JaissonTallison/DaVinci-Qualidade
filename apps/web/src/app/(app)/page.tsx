import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AtalhosDeModulos } from "@/components/atalhos-de-modulos";
import { RelogioDoDia } from "@/components/relogio-do-dia";
import type { CSSProperties } from "react";
import { ArrowRight } from "@/components/icones";
import {
  type DadosDoUsuario,
  type IndicadoresSst,
  type InspecoesDoMes,
  type PainelDeVencimentos,
  type PanoramaAuditorias,
  type ResumoAmbiental,
  type ResumoCalibracao,
  type ResumoNcs,
  type ResumoPgr,
  type ResumoPlanos,
  type ResumoPts,
  type ResumoSgi,
  type ResumoVencimentos,
} from "@davinci/types";
import { PainelDoInicio } from "@/components/painel-do-inicio";
import { AuditoriasPanorama } from "@/components/auditorias-panorama";
import { PendenciasCriticas } from "@/components/pendencias-criticas";
import { chamarApi, type Resultado } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";

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
    inspecoesMesR,
    ncsR,
    planosR,
    calR,
    sgiR,
    sstR,
    pgrR,
    ptsR,
    vencR,
    ambR,
    auditoriasPanoramaR,
  ] = await Promise.all([
    pode("paineis.ver")
      ? chamarApi<PainelDeVencimentos>("/paineis/vencimentos?dias=30")
      : null,
    pode("qualidade.ver")
      ? chamarApi<InspecoesDoMes[]>("/inspecoes/por-mes?meses=3")
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
    pode("auditorias.ver")
      ? chamarApi<PanoramaAuditorias>("/auditorias/panorama")
      : null,
  ]);
  const auditoriasPanorama = ok(auditoriasPanoramaR);
  const [painel, inspecoesMes, ncs, planos, cal, sgi, sst, pgr, pts, venc, amb] = [
    ok(painelR),
    ok(inspecoesMesR),
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
      nome: "NCs",
      pct: pct(ncs.abertas - ncs.vencidas, ncs.abertas),
      detalhe: `${plural(ncs.vencidas, "NC vencida", "NCs vencidas")} de ${ncs.abertas} em aberto`,
      href: "/qualidade/nao-conformidades?vencidas=true",
    });
  if (planos?.emExecucao)
    componentes.push({
      nome: "Planos de ação",
      pct: pct(planos.emExecucao - planos.atrasados, planos.emExecucao),
      detalhe: `${plural(planos.atrasados, "plano com tarefa vencida", "planos com tarefa vencida")}`,
      href: "/qualidade/planos-de-acao?atrasados=true",
    });
  if (cal?.emUso)
    componentes.push({
      nome: "Calibração",
      pct: pct(cal.emUso - cal.vencidos - cal.reprovados, cal.emUso),
      detalhe: `${plural(cal.vencidos + cal.reprovados, "instrumento vencido ou reprovado", "instrumentos vencidos ou reprovados")} de ${cal.emUso} em uso`,
      href: "/qualidade/calibracao?situacao=vencido",
    });
  if (venc?.total)
    componentes.push({
      nome: "ASO e treinamentos",
      pct: pct(venc.total - venc.vencidos, venc.total),
      detalhe: `${plural(venc.vencidos, "vencido", "vencidos")} de ${venc.total}`,
      href: "/seguranca/vencimentos?situacao=vencido",
    });
  if (sgi?.objetivosMedidos)
    componentes.push({
      nome: "Objetivos",
      pct: pct(sgi.objetivosMedidos - sgi.objetivosFora, sgi.objetivosMedidos),
      detalhe: `${plural(sgi.objetivosFora, "objetivo fora da meta", "objetivos fora da meta")} de ${sgi.objetivosMedidos}`,
      href: "/sgi/objetivos",
    });
  if (amb?.licencas)
    componentes.push({
      nome: "Licenças",
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


  const agora = new Date();
  const hora = Number(
    agora
      .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
      .slice(11, 13),
  );
  const saudacao =
    hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  // Painel de vencimentos pedido mas sem resposta (serviço fora do ar): não mostrar "0"
  // (falso "tudo em dia") — e sim que o número está indisponível agora.
  const painelIndisponivel = painelR !== null && !painelR.ok;
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
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(100deg, color-mix(in srgb, var(--color-menu) 94%, transparent) 0%, color-mix(in srgb, var(--color-menu) 82%, transparent) 42%, color-mix(in srgb, var(--color-menu) 42%, transparent) 72%, color-mix(in srgb, var(--color-menu) 12%, transparent) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(270deg, color-mix(in srgb, var(--color-menu) 80%, transparent) 0%, color-mix(in srgb, var(--color-menu) 45%, transparent) 18%, transparent 38%)",
          }}
        />
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

      <div
        className="dv-entrar relative"
        style={{ "--atraso": "60ms" } as CSSProperties}
      >
        {/* aba azul em fita à esquerda, com dobra (decisão de design do Início) */}
        <span
          aria-hidden
          className="absolute top-1 -bottom-0 -left-1.5 w-28 max-w-[32%] rounded-md"
          style={{
            background:
              "linear-gradient(180deg, var(--color-menu) 0%, color-mix(in srgb, var(--color-menu) 62%, #000) 100%)",
            boxShadow: "0 10px 22px rgb(16 31 120/.3)",
          }}
        />
        <span
          aria-hidden
          className="absolute -bottom-1.5 -left-1.5 size-5"
          style={{
            background: "color-mix(in srgb, var(--color-menu) 55%, #000)",
            clipPath: "polygon(0 0,100% 100%,0 100%)",
          }}
        />

        <section
          className="relative flex flex-col gap-4 rounded-md border border-borda bg-superficie py-4 pr-6 pl-7 shadow-cartao lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-5"
          aria-label="Resumo do dia"
        >
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-4">
          <div className="min-w-[8.5rem]">
            <span className="text-[0.7rem] font-bold tracking-[0.1em] text-texto-3 uppercase">
              Resumo de hoje
            </span>
            <strong className="mt-0.5 block font-bold text-texto">
              {eu.empresa.nome}
            </strong>
            <span
              aria-hidden
              className="mt-1.5 block h-[3px] w-11 rounded-full"
              style={{ background: "var(--color-menu)" }}
            />
          </div>

          {painelIndisponivel ? (
            <p className="text-sm text-texto-2">
              Prazos vencidos indisponíveis agora — recarregue em instantes.
            </p>
          ) : (
            <div className="flex gap-3.5">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-12 w-[3.25rem] items-center justify-center rounded-md text-2xl font-bold tabular-nums ${vencidos ? "bg-nao-conforme/10 text-nao-conforme" : "bg-conforme/10 text-conforme"}`}
                >
                  {vencidos}
                </span>
                <span className="text-xs text-texto-2">
                  {vencidos === 1 ? "prazo vencido" : "prazos vencidos"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-12 w-[3.25rem] items-center justify-center rounded-md text-2xl font-bold tabular-nums ${nestaSemana ? "bg-atencao/10 text-atencao" : "bg-campo text-texto-2"}`}
                >
                  {nestaSemana}
                </span>
                <span className="text-xs text-texto-2">vencem em 7 dias</span>
              </div>
            </div>
          )}

          {pior && pior.pct < 100 ? (
            <div className="max-w-[13rem] max-sm:max-w-none">
              <span className="inline-block rounded-md bg-nao-conforme/10 px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.07em] text-nao-conforme uppercase">
                Prioridade
              </span>
              <p className="mt-1.5 text-sm text-texto">
                {pior.nome}: {pior.detalhe}.
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-conforme">
              Todos os indicadores em 100%. Nada pede ação agora.
            </p>
          )}

          {pior && pior.pct < 100 && (
            <Link
              href={pior.href}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-campo px-4 text-base font-semibold text-white transition hover:brightness-110 max-sm:w-full max-sm:justify-center"
              style={{
                background: "var(--color-menu)",
                boxShadow: "0 6px 14px rgb(16 31 120/.3)",
              }}
            >
              Resolver
              <ArrowRight aria-hidden size={16} strokeWidth={2} />
            </Link>
          )}
          </div>

          {componentes.length > 0 && (
            <div className="flex items-center gap-3.5 lg:ml-auto">
              <AnelCompacto valor={saude} />
              <div className="min-w-[9.5rem]">
                <p className="text-sm font-bold text-texto">
                  Saúde do sistema de gestão
                </p>
                <ul className="mt-1.5 space-y-1">
                  {componentes.map((c) => (
                    <li key={c.nome}>
                      <Link
                        href={c.href}
                        className="flex items-center justify-between gap-6 text-sm transition-opacity hover:opacity-80"
                      >
                        <span className="text-texto">{c.nome}</span>
                        <span
                          className={`font-bold tabular-nums ${c.pct < 100 ? "text-nao-conforme" : "text-texto"}`}
                        >
                          {c.pct}%
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      <AtalhosDeModulos permissoes={eu.permissoes} />

      {auditoriasPanorama && (
        <AuditoriasPanorama dados={auditoriasPanorama} />
      )}

      <PendenciasCriticas prazos={painel?.prazos ?? []} hoje={hoje} />

      <PainelDoInicio
        hoje={hoje}
        inspecoesPorMes={inspecoesMes}
        sst={
          sst?.meses.filter((m) => m.competencia <= hoje.slice(0, 7)) ?? null
        }
      />
    </div>
  );
}

/**
 * Saúde em anel (faixa do resumo): anel encorpado com trilho em degradê suave, progresso com relevo
 * (degradê + sombra), "47%" em destaque e um risquinho na cor do estado. Verde ≥90%, âmbar 70–89%,
 * vermelho abaixo; preenche ao abrir.
 */
function AnelCompacto({ valor }: { valor: number | null }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const v = valor ?? 0;
  const tema =
    valor === null
      ? { a: "#cfd6e0", b: "#cfd6e0", sombra: "#aeb8c6", risco: "var(--color-texto-3)" }
      : v >= 90
        ? { a: "#16a07a", b: "#0b6a50", sombra: "#0b5a43", risco: "var(--color-conforme)" }
        : v >= 70
          ? { a: "#e0952b", b: "#b45309", sombra: "#8a3f07", risco: "var(--color-atencao)" }
          : { a: "#d9463d", b: "#a01f1a", sombra: "#8c1c17", risco: "var(--color-nao-conforme)" };
  return (
    <div
      className="relative size-[4.5rem] shrink-0"
      style={{ filter: "drop-shadow(0 6px 14px rgb(16 42 67 / 0.14))" }}
      role="img"
      aria-label={
        valor === null
          ? "Saúde sem dados"
          : `Saúde do sistema de gestão: ${valor}%`
      }
    >
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
        <defs>
          <linearGradient id="anel-trilho" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#eef1f6" />
            <stop offset="1" stopColor="#dde2ea" />
          </linearGradient>
          <linearGradient id="anel-progresso" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={tema.a} />
            <stop offset="1" stopColor={tema.b} />
          </linearGradient>
          <filter
            id="anel-sombra"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feDropShadow
              dx="0"
              dy="1.4"
              stdDeviation="1.6"
              floodColor={tema.sombra}
              floodOpacity="0.4"
            />
          </filter>
        </defs>
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke="url(#anel-trilho)"
          strokeWidth={11}
        />
        <g transform="rotate(-90 50 50)">
          <circle
            cx={50}
            cy={50}
            r={r}
            fill="none"
            stroke="url(#anel-progresso)"
            strokeWidth={11}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - v / 100)}
            filter="url(#anel-sombra)"
            className="dv-anel"
            style={{ "--circunferencia": c } as CSSProperties}
          />
        </g>
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[1.05rem] font-extrabold tracking-tight text-texto tabular-nums">
          {valor === null ? "—" : `${valor}%`}
        </span>
        <span className="mt-0.5 text-[0.5rem] font-semibold tracking-[0.12em] text-texto-3 uppercase">
          saúde
        </span>
        <span
          aria-hidden
          className="mt-[3px] h-[1.5px] w-3.5 rounded-full"
          style={{ background: tema.risco }}
        />
      </span>
    </div>
  );
}
