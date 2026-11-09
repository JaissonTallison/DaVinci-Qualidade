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
import { cabecalhoDoPainel, painel, tituloDoPainel } from "@/lib/estilos";
import { Botao } from "@/components/botao";
import {
  CabecalhoDaPagina,
  type ItemDaRegua,
} from "@/components/cabecalho-da-pagina";

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
    vencimentos,
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
    vencimentos?.prazos.filter((p) => p.situacao === "vencido").length ?? 0;
  const emSeteDias = diasDepois(hoje, 7);
  const nestaSemana =
    vencimentos?.prazos.filter(
      (p) => p.situacao !== "vencido" && p.data <= emSeteDias,
    ).length ?? 0;

  const temRegua = !painelIndisponivel && vencimentos !== null;
  const regua: ItemDaRegua[] = [
    ...(temRegua
      ? [
          {
            rotulo: "Prazos vencidos",
            valor: vencidos,
            tom: vencidos ? ("perigo" as const) : ("sucesso" as const),
            href: "/paineis/vencimentos",
          },
          {
            rotulo: "Vencem em 7 dias",
            valor: nestaSemana,
            tom: nestaSemana ? ("atencao" as const) : undefined,
            href: "/paineis/vencimentos",
          },
        ]
      : []),
    ...(ncs
      ? [
          {
            rotulo: "NCs em aberto",
            valor: ncs.abertas,
            detalhe: ncs.vencidas
              ? plural(ncs.vencidas, "vencida", "vencidas")
              : "nenhuma vencida",
            href: "/qualidade/nao-conformidades",
          },
        ]
      : []),
    ...(planos
      ? [
          {
            rotulo: "Planos em execução",
            valor: planos.emExecucao,
            detalhe: planos.atrasados
              ? plural(planos.atrasados, "atrasado", "atrasados")
              : "nenhum atrasado",
            href: "/qualidade/planos-de-acao",
          },
        ]
      : []),
    ...(saude !== null
      ? [
          {
            rotulo: "Saúde do SGI",
            valor: `${saude}%`,
            tom: tomDaSaude(saude),
            detalhe: `média de ${plural(componentes.length, "componente", "componentes")}`,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaPagina
        titulo={`${saudacao}, ${eu.usuario.nome.split(" ")[0]}`}
        descricao={`${eu.empresa.nome} · resumo do que pede ação hoje`}
        acoes={<RelogioDoDia inicialISO={agora.toISOString()} />}
        regua={regua.length ? regua : undefined}
      >
        {painelIndisponivel && (
          <p className="mt-2 text-sm text-texto-2">
            Prazos indisponíveis agora; recarregue em instantes.
          </p>
        )}
      </CabecalhoDaPagina>

      {componentes.length > 0 && (
        <div
          className="dv-entrar grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
          style={{ "--atraso": "60ms" } as CSSProperties}
        >
          <section
            className={`${painel} flex flex-col`}
            aria-labelledby="saude-titulo"
          >
            <header className={`${cabecalhoDoPainel} justify-between`}>
              <div className="min-w-0">
                <h2 id="saude-titulo" className={tituloDoPainel}>
                  Saúde do sistema de gestão
                </h2>
                <p className="text-sm text-texto-2">
                  Quanto de cada componente está em dia. Abaixo de 90%, pede
                  atenção; abaixo de 70%, ação.
                </p>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-6 p-5 sm:flex-row sm:items-center">
              <AnelDaSaude valor={saude} />
              <ul className="min-w-0 flex-1 divide-y divide-borda">
                {componentes.map((c) => (
                  <li key={c.nome}>
                    <Link
                      href={c.href}
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 py-2.5"
                    >
                      <span className="truncate text-base font-medium text-texto group-hover:underline">
                        {c.nome}
                      </span>
                      <span
                        className={`text-right text-base font-semibold tabular-nums ${COR_DO_TOM[tomDaSaude(c.pct)]}`}
                      >
                        {c.pct}%
                      </span>
                      <span className="col-span-2 text-sm text-texto-2">
                        {c.detalhe}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section
            className={`${painel} flex flex-col`}
            aria-labelledby="prioridade-titulo"
          >
            <header className={cabecalhoDoPainel}>
              <div className="min-w-0">
                <h2 id="prioridade-titulo" className={tituloDoPainel}>
                  Prioridade agora
                </h2>
                <p className="text-sm text-texto-2">
                  O componente mais baixo e onde resolver.
                </p>
              </div>
            </header>
            <div className="flex flex-1 flex-col p-5">
              {pior && pior.pct < 100 ? (
                <>
                  <Selo tom={pior.pct < 70 ? "perigo" : "atencao"}>
                    {pior.nome} · {pior.pct}% em dia
                  </Selo>
                  <p className="mt-3 text-md text-texto">
                    {pior.detalhe.charAt(0).toUpperCase() +
                      pior.detalhe.slice(1)}
                    .
                  </p>
                  <p className="mt-1 text-sm text-texto-2">
                    É o componente mais baixo da saúde do sistema de gestão.
                    Resolver aqui sobe a média mais depressa.
                  </p>
                  <span aria-hidden className="block min-h-5 flex-1" />
                  <Botao
                    href={pior.href}
                    variante="primario"
                    tamanho="grande"
                    iconeDireita={ArrowRight}
                    className="mt-auto w-full"
                  >
                    Resolver agora
                  </Botao>
                </>
              ) : (
                <>
                  <Selo tom="sucesso">Tudo em dia</Selo>
                  <p className="mt-3 text-md text-texto">
                    Todos os componentes estão em 100%.
                  </p>
                  <p className="mt-1 text-sm text-texto-2">
                    Nada pede ação agora. Os próximos prazos aparecem no painel
                    de vencimentos.
                  </p>
                  <span aria-hidden className="block min-h-5 flex-1" />
                  <Botao
                    href="/paineis/vencimentos"
                    tamanho="grande"
                    iconeDireita={ArrowRight}
                    className="mt-auto w-full"
                  >
                    Ver vencimentos
                  </Botao>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      <AtalhosDeModulos permissoes={eu.permissoes} />

      {auditoriasPanorama && <AuditoriasPanorama dados={auditoriasPanorama} />}

      <PendenciasCriticas prazos={vencimentos?.prazos ?? []} hoje={hoje} />

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

type Tom = "perigo" | "atencao" | "sucesso";
/** Sucesso a partir de 90 %, atenção de 70 a 89 %, perigo abaixo de 70 %. */
function tomDaSaude(v: number): Tom {
  return v >= 90 ? "sucesso" : v >= 70 ? "atencao" : "perigo";
}
const COR_DO_TOM: Record<Tom, string> = {
  sucesso: "text-conforme-texto",
  atencao: "text-atencao-texto",
  perigo: "text-nao-conforme-texto",
};

/** Saúde em anel: trilho cinza e o progresso na cor do estado, sem degradê nem relevo. */
function AnelDaSaude({ valor }: { valor: number | null }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const v = valor ?? 0;
  const cor =
    valor === null
      ? "var(--color-borda-forte)"
      : `var(--color-${{ sucesso: "conforme", atencao: "atencao", perigo: "nao-conforme" }[tomDaSaude(v)]})`;
  return (
    <div
      className="relative mx-auto size-32 shrink-0 sm:mx-0"
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
          strokeWidth={8}
        />
        <g transform="rotate(-90 50 50)">
          <circle
            cx={50}
            cy={50}
            r={r}
            fill="none"
            stroke={cor}
            strokeWidth={8}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - v / 100)}
            className="dv-anel"
            style={{ "--circunferencia": c } as CSSProperties}
          />
        </g>
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-3xl font-semibold text-texto tabular-nums">
          {valor === null ? "—" : `${valor}%`}
        </span>
        <span className="mt-1.5 text-xs text-texto-2">em dia</span>
      </span>
    </div>
  );
}
