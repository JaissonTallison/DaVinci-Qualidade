"use client";

import { aba as estiloDaAba, trilho } from "@/lib/estilos";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useMemo, useState, useTransition, type CSSProperties } from "react";
import {
  MODULOS_DO_PAINEL,
  type IndicadorDoMes,
  type ModuloDoPainel,
  type NcsDoMes,
  type Prazo,
} from "@davinci/types";
import { dadosDoPeriodo, type Periodo } from "@/lib/acoes-inicio";
import { type TomDoSelo } from "./linha-de-prazo";
import { IconeDaTela } from "./icones-do-menu";
import {
  ColunasAgrupadas,
  ColunasEmpilhadas,
  Legenda,
  Linha,
  Rosca,
  type Serie,
} from "./graficos";

/** Cor de cada módulo nos gráficos: ordem fixa, nunca muda com filtro (skill dataviz). */
const COR_DO_MODULO: Record<ModuloDoPainel, string> = {
  qualidade: "var(--color-serie-1)",
  seguranca: "var(--color-serie-2)",
  funcionarios: "var(--color-serie-3)",
  sgi: "var(--color-serie-4)",
  servicos: "var(--color-serie-5)",
  ambiental: "var(--color-serie-6)",
  esg: "var(--color-serie-7)",
};
const SERIES: Serie[] = (Object.keys(COR_DO_MODULO) as ModuloDoPainel[]).map(
  (m) => ({ id: m, rotulo: MODULOS_DO_PAINEL[m], cor: COR_DO_MODULO[m] }),
);
const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export interface Atencao {
  titulo: string;
  detalhe: string;
  href: string;
  /** Tela cujo ícone representa o assunto. */
  icone: string;
  selo: string;
  tom: TomDoSelo;
}


const PERIODOS: { dias: Periodo; rotulo: string }[] = [
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
  { dias: 365, rotulo: "12 meses" },
];

/** Segunda-feira da semana de uma data AAAA-MM-DD. */
function semanaDe(data: string): string {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
const br = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const somar = (d: string, dias: number) => {
  const x = new Date(`${d}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + dias);
  return x.toISOString().slice(0, 10);
};

/** Vencidos numa coluna; depois semanas (30 e 90 dias) ou meses (12 meses) até o horizonte. */
function agrupar(prazos: Prazo[], hoje: string, dias: Periodo) {
  const cats: {
    rotulo: string;
    detalhe: string;
    href: string;
    valores: Record<string, number>;
  }[] = [
    {
      rotulo: "Vencidos",
      detalhe: "Já vencidos",
      href: "/paineis/vencimentos",
      valores: {},
    },
  ];
  const chave = new Map<string, number>();
  if (dias === 365) {
    for (let i = 0; i < 12; i++) {
      const d = new Date(`${hoje.slice(0, 7)}-01T12:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + i);
      const k = d.toISOString().slice(0, 7);
      chave.set(k, cats.length);
      cats.push({
        rotulo: MESES[d.getUTCMonth()]!,
        detalhe: `${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`,
        href: "/paineis/vencimentos",
        valores: {},
      });
    }
  } else {
    for (let s = semanaDe(hoje); s <= somar(hoje, dias); s = somar(s, 7)) {
      chave.set(s, cats.length);
      cats.push({
        rotulo: br(s),
        detalhe: `Semana de ${br(s)} a ${br(somar(s, 6))}`,
        href: "/paineis/vencimentos",
        valores: {},
      });
    }
  }
  for (const p of prazos) {
    const i =
      p.situacao === "vencido"
        ? 0
        : chave.get(dias === 365 ? p.data.slice(0, 7) : semanaDe(p.data));
    if (i === undefined) continue;
    cats[i]!.valores[p.modulo] = (cats[i]!.valores[p.modulo] ?? 0) + 1;
  }
  return cats;
}

export function PainelDoInicio({
  hoje,
  temNcs,
  inicial,
  sst,
  atencao,
}: {
  hoje: string;
  /** O usuário vê Qualidade: busca o gráfico de NCs por mês ao trocar o período. */
  temNcs: boolean;
  inicial: { prazos: Prazo[]; ncsPorMes: NcsDoMes[] | null };
  sst: IndicadorDoMes[] | null;
  atencao: Atencao[];
}) {
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const [dados, setDados] = useState(inicial);
  const [carregando, iniciar] = useTransition();
  const [destaque, setDestaque] = useState<string | null>(null);
  const [graficoMensal, setGraficoMensal] = useState<"nc" | "tf">("nc");

  const trocarPeriodo = (dias: Periodo) => {
    setPeriodo(dias);
    iniciar(async () => setDados(await dadosDoPeriodo(dias, temNcs)));
  };

  const categorias = useMemo(
    () => agrupar(dados.prazos, hoje, periodo),
    [dados.prazos, hoje, periodo],
  );
  const porModulo = useMemo(() => {
    const t: Record<string, number> = {};
    for (const p of dados.prazos) t[p.modulo] = (t[p.modulo] ?? 0) + 1;
    return t;
  }, [dados.prazos]);
  const seriesPresentes = SERIES.filter((s) => porModulo[s.id]);
  const graficosMensais = [
    ...(dados.ncsPorMes ? (["nc"] as const) : []),
    ...(sst ? (["tf"] as const) : []),
  ];
  const mensalAtivo = graficosMensais.includes(graficoMensal)
    ? graficoMensal
    : graficosMensais[0];

  return (
    <section
      className="dv-entrar flex flex-col gap-4"
      style={{ "--atraso": "120ms" } as CSSProperties}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg text-texto">Visão geral</h2>
        <div role="group" aria-label="Período" className={trilho}>
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              type="button"
              aria-pressed={periodo === p.dias}
              onClick={() => trocarPeriodo(p.dias)}
              className={estiloDaAba(periodo === p.dias, true)}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`dv-entrar flex flex-col gap-4 transition-opacity ${carregando ? "opacity-60" : ""}`}
        aria-busy={carregando}
      >
        <>
            <div className="grid gap-4 xl:grid-cols-3">
              <Quadro
                titulo="Prazos por semana"
                subtitulo={
                  periodo === 365
                    ? "Vencidos e os próximos 12 meses, por mês"
                    : `Vencidos e as próximas semanas (${periodo} dias)`
                }
                classe="flex flex-col xl:col-span-2"
              >
                <div
                  className="min-h-38 flex-1"
                  onMouseLeave={() => setDestaque(null)}
                >
                  <ColunasEmpilhadas
                    categorias={categorias}
                    series={seriesPresentes}
                    destaque={destaque}
                    preencher
                  />
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-texto-2">
                  {seriesPresentes.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setDestaque(s.id)}
                        onMouseLeave={() => setDestaque(null)}
                        className={`flex items-center gap-1.5 ${destaque && destaque !== s.id ? "opacity-40" : ""}`}
                      >
                        <span
                          aria-hidden
                          className="size-2.5 rounded-xs"
                          style={{ background: s.cor }}
                        />
                        {s.rotulo}
                        <span className="font-semibold text-texto tabular-nums">
                          {porModulo[s.id]}
                        </span>
                      </button>
                    </li>
                  ))}
                  {seriesPresentes.length === 0 && (
                    <li>Nenhum prazo no período.</li>
                  )}
                </ul>
              </Quadro>
              <Quadro
                titulo="Onde estão os prazos"
                subtitulo="Por módulo, no período"
              >
                <Rosca
                  centro={dados.prazos.length}
                  rotuloDoCentro="prazos"
                  fatias={SERIES.filter((s) => porModulo[s.id]).map((s) => ({
                    id: s.id,
                    rotulo: s.rotulo,
                    valor: porModulo[s.id]!,
                    cor: s.cor,
                    href: "/paineis/vencimentos",
                  }))}
                />
              </Quadro>
            </div>
            <ListaDeAtencao itens={atencao} />
        </>

        {mensalAtivo && (
          <div className="rounded-md border border-borda bg-superficie p-5 shadow-cartao">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg text-texto">
                  {mensalAtivo === "nc"
                    ? "Não conformidades por mês"
                    : "Taxa de frequência de acidentes (TF)"}
                </h2>
                <p className="text-sm text-texto-2">
                  {mensalAtivo === "nc"
                    ? "Abertas e encerradas em cada mês. Clique para ver a lista."
                    : `Acidentes com afastamento por milhão de horas trabalhadas, mês a mês em ${hoje.slice(0, 4)} (NBR 14280)`}
                </p>
              </div>
              {graficosMensais.length > 1 && (
                <div role="group" aria-label="Gráfico" className={trilho}>
                  <button
                    type="button"
                    aria-pressed={mensalAtivo === "nc"}
                    onClick={() => setGraficoMensal("nc")}
                    className={estiloDaAba(mensalAtivo === "nc", true)}
                  >
                    Não conformidades
                  </button>
                  <button
                    type="button"
                    aria-pressed={mensalAtivo === "tf"}
                    onClick={() => setGraficoMensal("tf")}
                    className={estiloDaAba(mensalAtivo === "tf", true)}
                  >
                    Acidentes (TF)
                  </button>
                </div>
              )}
            </div>
            <div className="mt-3">
              {mensalAtivo === "nc" && dados.ncsPorMes ? (
                <>
                  <ColunasAgrupadas
                    href="/qualidade/nao-conformidades"
                    series={[
                      {
                        id: "abertas",
                        rotulo: "Abertas",
                        cor: "var(--color-serie-1)",
                      },
                      {
                        id: "encerradas",
                        rotulo: "Encerradas",
                        cor: "var(--color-serie-2)",
                      },
                    ]}
                    categorias={dados.ncsPorMes.map((m) => ({
                      rotulo: MESES[Number(m.mes.slice(5, 7)) - 1]!,
                      detalhe: `${MESES[Number(m.mes.slice(5, 7)) - 1]} de ${m.mes.slice(0, 4)}`,
                      valores: [m.abertas, m.encerradas],
                    }))}
                  />
                  <div className="mt-2">
                    <Legenda
                      itens={[
                        {
                          rotulo: "Abertas",
                          cor: "var(--color-serie-1)",
                          valor: dados.ncsPorMes.reduce(
                            (t, m) => t + m.abertas,
                            0,
                          ),
                        },
                        {
                          rotulo: "Encerradas",
                          cor: "var(--color-serie-2)",
                          valor: dados.ncsPorMes.reduce(
                            (t, m) => t + m.encerradas,
                            0,
                          ),
                        },
                      ]}
                    />
                  </div>
                </>
              ) : (
                sst && (
                  <>
                    <Linha
                      cor="var(--color-serie-2)"
                      pontos={sst.map((m) => ({
                        rotulo: MESES[Number(m.competencia.slice(5, 7)) - 1]!,
                        detalhe: `${MESES[Number(m.competencia.slice(5, 7)) - 1]} de ${m.competencia.slice(0, 4)}`,
                        valor: m.tf,
                      }))}
                    />
                    <p className="mt-2 text-xs text-texto-3">
                      Mês sem horas lançadas fica em branco. Lance as horas em
                      Indicadores de SST.
                    </p>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Quadro({
  titulo,
  subtitulo,
  classe = "",
  children,
}: {
  titulo: string;
  subtitulo: string;
  classe?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-md border border-borda bg-superficie p-5 shadow-cartao ${classe}`}
    >
      <h2 className="text-lg text-texto">{titulo}</h2>
      <p className="mb-3 text-sm text-texto-2">{subtitulo}</p>
      {children}
    </div>
  );
}

/** Cor da situação: só o texto (sem badge cheio), conforme o guia de design. */
const COR_DA_SITUACAO: Record<TomDoSelo, string> = {
  vencido: "text-nao-conforme",
  proximo: "text-atencao",
  aguardando: "text-texto-2",
};

/** Linha premium do "Precisa da sua atenção": avatar tingido pela situação, assunto e selo em chip. */
function ItemDeAtencao({ a, atraso }: { a: Atencao; atraso: number }) {
  const sep = a.titulo.indexOf(": ");
  const assunto = sep > 0 ? a.titulo.slice(sep + 2) : a.titulo;
  const contexto = [sep > 0 ? a.titulo.slice(0, sep) : null, a.detalhe]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      href={a.href}
      className="dv-entrar group flex h-full flex-col rounded-md border border-borda bg-campo p-5 shadow-cartao transition-colors hover:bg-superficie"
      style={{ "--atraso": `${atraso}ms` } as CSSProperties}
    >
      <span className="text-marinho">
        <IconeDaTela href={a.icone} size={24} />
      </span>
      <span className="mt-3 text-base font-semibold text-texto">{assunto}</span>
      {contexto && (
        <span className="mt-1 text-sm text-texto-2">{contexto}</span>
      )}
      <span className={`mt-1 text-sm font-semibold ${COR_DA_SITUACAO[a.tom]}`}>
        {a.selo}
      </span>
      <span className="mt-auto pt-4">
        <span className="inline-flex h-9 items-center gap-2 rounded-campo border border-borda-campo bg-superficie px-4 text-base font-semibold text-texto transition-colors group-hover:bg-campo">
          Abrir
          <ArrowRight
            aria-hidden
            size={16}
            strokeWidth={2}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </span>
    </Link>
  );
}

function ListaDeAtencao({ itens }: { itens: Atencao[] }) {
  if (!itens.length) return null;
  const vencidos = itens.filter((a) => a.tom === "vencido").length;
  const acompanhar = itens.length - vencidos;
  return (
    <div className="rounded-md border border-borda bg-superficie shadow-cartao">
      <div className="flex items-center justify-between gap-3 border-b border-borda px-5 py-3.5">
        <div>
          <h2 className="text-lg text-texto">Precisa da sua atenção</h2>
          <p className="text-sm text-texto-2">
            {vencidos > 0 && (
              <span className="font-semibold text-nao-conforme">
                {vencidos} {vencidos === 1 ? "vencido" : "vencidos"}
              </span>
            )}
            {vencidos > 0 && acompanhar > 0 && " · "}
            {acompanhar > 0 &&
              `${acompanhar} a acompanhar`}
          </p>
        </div>
        <Link
          href="/paineis/vencimentos"
          className="inline-flex items-center gap-1 text-sm font-semibold text-acao hover:underline"
        >
          Painel de vencimentos
          <ChevronRight aria-hidden size={14} strokeWidth={2} />
        </Link>
      </div>
      <ul className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {itens.slice(0, 6).map((a, i) => (
          <li key={`${a.href}-${i}`}>
            <ItemDeAtencao a={a} atraso={i * 40} />
          </li>
        ))}
      </ul>
      {itens.length > 6 && (
        <Link
          href="/paineis/vencimentos"
          className="block border-t border-borda px-5 py-2.5 text-center text-sm font-semibold text-acao hover:bg-campo"
        >
          Ver mais {itens.length - 6} no painel de vencimentos
        </Link>
      )}
    </div>
  );
}
