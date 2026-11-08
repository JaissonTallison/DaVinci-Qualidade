import type { Metadata } from "next";
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
import { Selo } from "@/components/selo";
import {
  botaoPrimario,
  painel,
  sobretitulo,
  subtituloDaPagina,
  tituloDaPagina,
} from "@/lib/estilos";

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
  const [
    painel,
    inspecoesMes,
    ncs,
    planos,
    cal,
    sgi,
    sst,
    pgr,
    pts,
    venc,
    amb,
  ] = [
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
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 max-w-xl">
          <h1 className={tituloDaPagina}>
            {saudacao}, {eu.usuario.nome.split(" ")[0]}
          </h1>
          <p className={subtituloDaPagina}>
            {eu.empresa.nome} · resumo do que pede ação hoje
          </p>
        </div>
        <RelogioDoDia inicialISO={agora.toISOString()} />
      </header>

      <div
        className="dv-entrar"
        style={{ "--atraso": "60ms" } as CSSProperties}
      >
        <section
          className={`${painel} flex flex-col gap-4 px-5 py-4 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-5`}
          aria-label="Resumo do dia"
        >
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-4">
            <div className="min-w-[8.5rem]">
              <span className={sobretitulo}>Resumo de hoje</span>
              <strong className="mt-0.5 block font-semibold text-texto">
                {eu.empresa.nome}
              </strong>
            </div>

            {painelIndisponivel ? (
              <p className="text-sm text-texto-2">
                Prazos vencidos indisponíveis agora — recarregue em instantes.
              </p>
            ) : (
              <div className="flex gap-3.5">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-12 w-[3.25rem] items-center justify-center rounded-md border text-2xl font-semibold tabular-nums ${vencidos ? "border-nao-conforme-borda bg-nao-conforme-suave text-nao-conforme-texto" : "border-conforme-borda bg-conforme-suave text-conforme-texto"}`}
                  >
                    {vencidos}
                  </span>
                  <span className="text-xs text-texto-2">
                    {vencidos === 1 ? "prazo vencido" : "prazos vencidos"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-12 w-[3.25rem] items-center justify-center rounded-md border text-2xl font-semibold tabular-nums ${nestaSemana ? "border-atencao-borda bg-atencao-suave text-atencao-texto" : "border-borda bg-superficie-2 text-texto-2"}`}
                  >
                    {nestaSemana}
                  </span>
                  <span className="text-xs text-texto-2">vencem em 7 dias</span>
                </div>
              </div>
            )}

            {pior && pior.pct < 100 ? (
              <div className="max-w-[13rem] max-sm:max-w-none">
                <Selo tom="perigo">Prioridade</Selo>
                <p className="mt-1.5 text-sm text-texto">
                  {pior.nome}: {pior.detalhe}.
                </p>
              </div>
            ) : (
              <p className="text-sm font-medium text-conforme-texto">
                Todos os indicadores em 100%. Nada pede ação agora.
              </p>
            )}

            {pior && pior.pct < 100 && (
              <Link
                href={pior.href}
                className={`${botaoPrimario} shrink-0 max-sm:w-full`}
              >
                Resolver
                <ArrowRight aria-hidden size={16} strokeWidth={1.75} />
              </Link>
            )}
          </div>

          {componentes.length > 0 && (
            <div className="flex items-center gap-3.5 lg:ml-auto">
              <AnelCompacto valor={saude} />
              <div className="min-w-[9.5rem]">
                <p className="text-sm font-semibold text-texto">
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
                          className={`font-semibold tabular-nums ${c.pct < 100 ? "text-nao-conforme" : "text-texto"}`}
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

      {auditoriasPanorama && <AuditoriasPanorama dados={auditoriasPanorama} />}

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
 * Saúde em anel (faixa do resumo): trilho cinza e progresso na cor do estado, sem degradê nem relevo.
 * Sucesso ≥ 90 %, atenção 70–89 %, perigo abaixo; preenche ao abrir.
 */
function AnelCompacto({ valor }: { valor: number | null }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const v = valor ?? 0;
  const cor =
    valor === null
      ? "var(--color-borda-forte)"
      : v >= 90
        ? "var(--color-conforme)"
        : v >= 70
          ? "var(--color-atencao)"
          : "var(--color-nao-conforme)";
  return (
    <div
      className="relative size-[4.5rem] shrink-0"
      role="img"
      aria-label={
        valor === null
          ? "Saúde sem dados"
          : `Saúde do sistema de gestão: ${valor}%`
      }
    >
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke="var(--color-afundado)"
          strokeWidth={9}
        />
        <g transform="rotate(-90 50 50)">
          <circle
            cx={50}
            cy={50}
            r={r}
            fill="none"
            stroke={cor}
            strokeWidth={9}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - v / 100)}
            className="dv-anel"
            style={{ "--circunferencia": c } as CSSProperties}
          />
        </g>
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-md font-semibold text-texto tabular-nums">
          {valor === null ? "—" : `${valor}%`}
        </span>
        <span className="mt-1 text-xs text-texto-2">saúde</span>
      </span>
    </div>
  );
}
