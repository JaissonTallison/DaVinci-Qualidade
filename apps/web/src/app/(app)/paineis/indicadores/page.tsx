import {
  Briefcase,
  CalendarClock,
  ChevronRight,
  Globe,
  HardHat,
  Leaf,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "@/components/icones";
import type { Metadata } from "next";
import Link from "next/link";
import {
  META_ISC,
  MODULOS_DO_PAINEL,
  type DadosDoUsuario,
  type IndicadoresSst,
  type PainelDeVencimentos,
  type ResumoAmbiental,
  type ResumoCalibracao,
  type ResumoNcs,
  type ResumoPgr,
  type ResumoPlanos,
  type ResumoPts,
  type ResumoServicos,
  type ResumoSgi,
  type ResumoVencimentos,
} from "@davinci/types";
import { chamarApi, type Resultado } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import { painel, tituloDaPagina } from "@/lib/estilos";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";
import { Botao } from "@/components/botao";
import { GraficoDonut, type FatiaDonut } from "@/components/grafico-donut";

export const metadata: Metadata = { title: "Indicadores gerais" };

const ok = <T,>(r: Resultado<T> | null): T | null => (r?.ok ? r.dados : null);

type Item = {
  rotulo: string;
  valor: number | null;
  alerta?: boolean;
  href?: string;
};
type Area = { titulo: string; href: string; itens: Item[] };

/** Ícone Lucide de cada área, para o tile do cabeçalho da seção. */
const ICONE_DA_AREA: Record<string, LucideIcon> = {
  "Prazos (próximos 30 dias)": CalendarClock,
  Qualidade: ShieldCheck,
  "Segurança do Trabalho": HardHat,
  "Gestão do SGI": Target,
  Serviços: Briefcase,
  "Meio Ambiente": Leaf,
  "Agenda ESG": Globe,
};

/** Cores dos segmentos do donut, na ordem das séries do tema. */
const CORES_SERIE = [
  "var(--color-serie-1)",
  "var(--color-serie-2)",
  "var(--color-serie-3)",
  "var(--color-serie-6)",
  "var(--color-serie-7)",
  "var(--color-serie-4)",
  "var(--color-serie-5)",
];

/** Um indicador: rótulo, número (vermelho quando pede atenção) e a célula inteira clicável. */
function Tile({ rotulo, valor, alerta, href }: Item) {
  const corpo = (
    <>
      <dt className="text-xs text-texto-2">{rotulo}</dt>
      <dd
        className={`mt-1 text-xl font-semibold tabular-nums ${alerta ? "text-nao-conforme" : "text-texto"}`}
      >
        {valor === null ? "—" : valor.toLocaleString("pt-BR")}
      </dd>
    </>
  );
  const base =
    "flex flex-col border-r border-b border-borda px-5 py-3.5 min-w-0";
  return href ? (
    <Link href={href} className={`${base} transition-colors hover:bg-campo`}>
      {corpo}
    </Link>
  ) : (
    <div className={base}>{corpo}</div>
  );
}

export default async function IndicadoresGerais() {
  const r = await chamarApi<DadosDoUsuario>("/auth/eu");
  if (!r.ok) return <h1 className={tituloDaPagina}>Indicadores gerais</h1>;
  const eu = r.dados;
  const pode = (p: string) => eu.permissoes.includes(p as never);
  const hoje = hojeEmBrasilia();

  const [
    painelR,
    ncsR,
    planosR,
    calR,
    sgiR,
    sstR,
    pgrR,
    ptsR,
    vencR,
    ambR,
    servR,
  ] = await Promise.all([
    pode("paineis.ver")
      ? chamarApi<PainelDeVencimentos>("/paineis/vencimentos?dias=30")
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
    pode("servicos.ver") ? chamarApi<ResumoServicos>("/servicos/resumo") : null,
  ]);

  const painelV = ok(painelR);
  const ncs = ok(ncsR);
  const planos = ok(planosR);
  const cal = ok(calR);
  const sgi = ok(sgiR);
  const sst = ok(sstR);
  const pgr = ok(pgrR);
  const pts = ok(ptsR);
  const venc = ok(vencR);
  const amb = ok(ambR);
  const serv = ok(servR);

  const vencidos =
    painelV?.prazos.filter((p) => p.situacao === "vencido").length ?? null;
  const proximos =
    painelV?.prazos.filter((p) => p.situacao === "vence_em_breve").length ??
    null;
  const pos = (n: number | null | undefined) => (n ?? 0) > 0;

  // Distribuição dos prazos vencidos por módulo (donut do topo).
  const porModulo = new Map<string, number>();
  for (const p of painelV?.prazos ?? []) {
    if (p.situacao !== "vencido") continue;
    porModulo.set(
      MODULOS_DO_PAINEL[p.modulo],
      (porModulo.get(MODULOS_DO_PAINEL[p.modulo]) ?? 0) + 1,
    );
  }
  const fatiasVencidos: FatiaDonut[] = [...porModulo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([rotulo, valor], i) => ({
      rotulo,
      valor,
      cor: CORES_SERIE[i % CORES_SERIE.length]!,
    }));

  const areas: (Area | null)[] = [
    pode("paineis.ver")
      ? {
          titulo: "Prazos (próximos 30 dias)",
          href: "/paineis/vencimentos",
          itens: [
            {
              rotulo: "Vencidos",
              valor: vencidos,
              alerta: pos(vencidos),
              href: "/paineis/vencimentos",
            },
            {
              rotulo: "Vencem em breve",
              valor: proximos,
              href: "/paineis/vencimentos",
            },
          ],
        }
      : null,
    pode("qualidade.ver")
      ? {
          titulo: "Qualidade",
          href: "/qualidade/nao-conformidades",
          itens: [
            {
              rotulo: "NCs abertas",
              valor: ncs?.abertas ?? null,
              href: "/qualidade/nao-conformidades",
            },
            {
              rotulo: "NCs vencidas",
              valor: ncs?.vencidas ?? null,
              alerta: pos(ncs?.vencidas),
              href: "/qualidade/nao-conformidades",
            },
            {
              rotulo: "Planos atrasados",
              valor: planos?.atrasados ?? null,
              alerta: pos(planos?.atrasados),
              href: "/qualidade/planos-de-acao",
            },
            {
              rotulo: "Instrumentos vencidos",
              valor: cal?.vencidos ?? null,
              alerta: pos(cal?.vencidos),
              href: "/qualidade/calibracao",
            },
          ],
        }
      : null,
    pode("seguranca.ver")
      ? {
          titulo: "Segurança do Trabalho",
          href: "/seguranca/pgr",
          itens: [
            {
              rotulo: "Riscos críticos",
              valor: pgr?.criticos ?? null,
              alerta: pos(pgr?.criticos),
              href: "/seguranca/pgr?nivel=critico",
            },
            {
              rotulo: "Ações do PGR vencidas",
              valor: pgr?.acoesVencidas ?? null,
              alerta: pos(pgr?.acoesVencidas),
              href: "/seguranca/pgr",
            },
            {
              rotulo: "Revisões do PGR vencidas",
              valor: pgr?.revisoesVencidas ?? null,
              alerta: pos(pgr?.revisoesVencidas),
              href: "/seguranca/pgr",
            },
            {
              rotulo: "PTs vencidas",
              valor: pts?.vencidas ?? null,
              alerta: pos(pts?.vencidas),
              href: "/seguranca/permissoes-de-trabalho",
            },
            {
              rotulo: "ASO/treino vencidos",
              valor: venc?.vencidos ?? null,
              alerta: pos(venc?.vencidos),
              href: "/seguranca/vencimentos",
            },
            {
              // Conta só acidentes COM afastamento (NBR 14280 / lost-time); o rótulo deixa isso claro (DV)
              rotulo: "Dias sem acidente com afastamento",
              valor: sst?.diasSemAcidente ?? null,
              href: "/seguranca/indicadores",
            },
          ],
        }
      : null,
    pode("sgi.ver")
      ? {
          titulo: "Gestão do SGI",
          href: "/sgi/riscos",
          itens: [
            {
              rotulo: "Riscos altos abertos",
              valor: sgi?.rosAltosAbertos ?? null,
              alerta: pos(sgi?.rosAltosAbertos),
              href: "/sgi/riscos",
            },
            {
              rotulo: "R&O com prazo vencido",
              valor: sgi?.rosComPrazoVencido ?? null,
              alerta: pos(sgi?.rosComPrazoVencido),
              href: "/sgi/riscos",
            },
            {
              rotulo: "Objetivos fora da meta",
              valor: sgi?.objetivosFora ?? null,
              alerta: pos(sgi?.objetivosFora),
              href: "/sgi/objetivos",
            },
            {
              rotulo: "Inovações aguardando",
              valor: sgi?.mudancasAguardandoDecisao ?? null,
              href: "/sgi/inovacao",
            },
          ],
        }
      : null,
    pode("servicos.ver")
      ? {
          titulo: "Serviços",
          href: "/servicos/ordens",
          itens: [
            {
              rotulo: "OS abertas",
              valor: serv?.osAbertas ?? null,
              href: "/servicos/ordens",
            },
            {
              rotulo: "OS atrasadas",
              valor: serv?.osAtrasadas ?? null,
              alerta: pos(serv?.osAtrasadas),
              href: "/servicos/ordens",
            },
            {
              rotulo: "Satisfação ISC (%)",
              valor: serv?.satisfacao12Meses ?? null,
              alerta:
                serv?.satisfacao12Meses != null &&
                serv.satisfacao12Meses < META_ISC,
              href: "/servicos/nps",
            },
            {
              rotulo: "Fornecedores reprovados",
              valor: serv?.fornecedoresReprovados ?? null,
              alerta: pos(serv?.fornecedoresReprovados),
              href: "/servicos/fornecedores",
            },
          ],
        }
      : null,
    pode("ambiental.ver")
      ? {
          titulo: "Meio Ambiente",
          href: "/ambiental/requisitos",
          itens: [
            {
              rotulo: "Requisitos não atendidos",
              valor: amb?.requisitosNaoAtendidos ?? null,
              alerta: pos(amb?.requisitosNaoAtendidos),
              href: "/ambiental/requisitos",
            },
            {
              rotulo: "Licenças a renovar",
              valor: amb?.licencasParaRenovar ?? null,
              alerta: pos(amb?.licencasParaRenovar),
              href: "/ambiental/licencas",
            },
            {
              rotulo: "Licenças vencidas",
              valor: amb?.licencasVencidas ?? null,
              alerta: pos(amb?.licencasVencidas),
              href: "/ambiental/licencas",
            },
            {
              rotulo: "FDS vencidas",
              valor: amb?.fdsVencidas ?? null,
              alerta: pos(amb?.fdsVencidas),
              href: "/ambiental/produtos-quimicos",
            },
          ],
        }
      : null,
  ];
  const visiveis = areas.filter((a): a is Area => a !== null);

  return (
    <>
      <CabecalhoDaPagina
        titulo="Indicadores gerais"
        descricao="Visão consolidada dos indicadores de cada módulo que você acompanha. Clique em um número para abrir a tela de origem."
      />
      {fatiasVencidos.length > 0 && (
        <section className={`${painel} mt-6 p-5`}>
          <h2 className="text-md font-semibold text-texto">
            Prazos vencidos por módulo
          </h2>
          <p className="text-sm text-texto-2">
            Onde estão os {fatiasVencidos.reduce((t, f) => t + f.valor, 0)}{" "}
            prazos vencidos.
          </p>
          <div className="mt-4 max-w-md">
            <GraficoDonut fatias={fatiasVencidos} rotuloCentro="vencidos" />
          </div>
        </section>
      )}
      {visiveis.map((area) => {
        const Icone = ICONE_DA_AREA[area.titulo];
        return (
          <section
            key={area.titulo}
            className={`${painel} mt-6 overflow-hidden`}
          >
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {Icone && (
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-afundado text-texto-2 shadow-xs">
                    <Icone aria-hidden size={16} strokeWidth={1.75} />
                  </span>
                )}
                <h2 className="min-w-0 truncate text-sm font-semibold tracking-[0.04em] text-texto-2 uppercase">
                  {area.titulo}
                </h2>
              </div>
              <Botao
                href={area.href}
                variante="secundario"
                tamanho="pequeno"
                iconeDireita={ChevronRight}
              >
                Abrir
              </Botao>
            </div>
            <div className="-mr-px -mb-px grid grid-cols-2 border-t border-borda sm:grid-cols-3 lg:grid-cols-4">
              {area.itens.map((it) => (
                <Tile key={it.rotulo} {...it} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
