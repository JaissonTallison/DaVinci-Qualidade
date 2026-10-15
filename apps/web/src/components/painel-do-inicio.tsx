"use client";

import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { useMemo, useState, useTransition, type CSSProperties } from "react";
import {
  MODULOS_DO_PAINEL,
  type IndicadorDoMes,
  type ModuloDoPainel,
  type NcsDoMes,
  type Prazo,
} from "@davinci/types";
import { dadosDoPeriodo, type Periodo } from "@/lib/acoes-inicio";
import { Contador } from "./contador";
import { LinhaDePrazo, type TomDoSelo } from "./linha-de-prazo";
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

export interface Indicador {
  rotulo: string;
  valor: number | null;
  href: string;
  /** Número que pede ação quando maior que zero. */
  alerta?: boolean;
  sufixo?: string;
}

export interface Atencao {
  titulo: string;
  detalhe: string;
  href: string;
  /** Tela cujo ícone representa o assunto. */
  icone: string;
  selo: string;
  tom: TomDoSelo;
}

export type Aba =
  | "geral"
  | "qualidade"
  | "seguranca"
  | "sgi"
  | "servicos"
  | "ambiental"
  | "esg";
const NOME_DA_ABA: Record<Aba, string> = {
  geral: "Visão geral",
  qualidade: "Qualidade",
  seguranca: "Segurança do Trabalho",
  sgi: "Gestão do SGI",
  servicos: "Serviços",
  ambiental: "Meio Ambiente",
  esg: "Agenda ESG",
};

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
  abas,
  inicial,
  sst,
  indicadores,
  atencao,
}: {
  hoje: string;
  abas: Aba[];
  inicial: { prazos: Prazo[]; ncsPorMes: NcsDoMes[] | null };
  sst: IndicadorDoMes[] | null;
  indicadores: Partial<Record<Exclude<Aba, "geral">, Indicador[]>>;
  atencao: Atencao[];
}) {
  const [aba, setAba] = useState<Aba>("geral");
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const [dados, setDados] = useState(inicial);
  const [carregando, iniciar] = useTransition();
  const [destaque, setDestaque] = useState<string | null>(null);

  const trocarPeriodo = (dias: Periodo) => {
    setPeriodo(dias);
    iniciar(async () =>
      setDados(await dadosDoPeriodo(dias, abas.includes("qualidade"))),
    );
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

  return (
    <section
      className="dv-entrar flex flex-col gap-4"
      style={{ "--atraso": "120ms" } as CSSProperties}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-borda">
        <nav
          role="tablist"
          aria-label="Assuntos"
          className="-mb-px flex flex-wrap gap-1"
        >
          {abas.map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={aba === a}
              onClick={() => setAba(a)}
              className={`border-b-2 px-3 pb-2.5 text-base transition-colors ${aba === a ? "border-primaria font-semibold text-texto" : "border-transparent text-texto-2 hover:text-texto"}`}
            >
              {NOME_DA_ABA[a]}
            </button>
          ))}
        </nav>
        <div
          role="group"
          aria-label="Período"
          className="mb-2 flex rounded-sm border border-borda bg-superficie p-0.5"
        >
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              type="button"
              aria-pressed={periodo === p.dias}
              onClick={() => trocarPeriodo(p.dias)}
              className={`rounded-xs px-3 py-1 text-sm transition-colors ${periodo === p.dias ? "bg-primaria font-semibold text-primaria-texto" : "text-texto-2 hover:bg-superficie-2 hover:text-texto"}`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div
        key={aba}
        className={`dv-entrar flex flex-col gap-4 transition-opacity ${carregando ? "opacity-60" : ""}`}
        aria-busy={carregando}
      >
        {aba === "geral" && (
          <>
            <div className="grid gap-4 xl:grid-cols-3">
              <Quadro
                titulo="Prazos por semana"
                subtitulo={
                  periodo === 365
                    ? "Vencidos e os próximos 12 meses, por mês"
                    : `Vencidos e as próximas semanas (${periodo} dias)`
                }
                classe="xl:col-span-2"
              >
                <div onMouseLeave={() => setDestaque(null)}>
                  <ColunasEmpilhadas
                    categorias={categorias}
                    series={seriesPresentes}
                    destaque={destaque}
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
        )}

        {aba !== "geral" && indicadores[aba] && (
          <FaixaDeNumeros itens={indicadores[aba]!} />
        )}

        {aba === "qualidade" && dados.ncsPorMes && (
          <Quadro
            titulo="Não conformidades por mês"
            subtitulo="Abertas e encerradas em cada mês. Clique para ver a lista."
          >
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
                    valor: dados.ncsPorMes.reduce((t, m) => t + m.abertas, 0),
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
          </Quadro>
        )}

        {aba === "seguranca" && sst && (
          <Quadro
            titulo="Taxa de frequência de acidentes (TF)"
            subtitulo={`Acidentes com afastamento por milhão de horas trabalhadas, mês a mês em ${hoje.slice(0, 4)} (NBR 14280)`}
          >
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
          </Quadro>
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
      className={`rounded-md border border-borda bg-superficie p-5 ${classe}`}
    >
      <h2 className="text-lg text-texto">{titulo}</h2>
      <p className="mb-3 text-sm text-texto-2">{subtitulo}</p>
      {children}
    </div>
  );
}

function FaixaDeNumeros({ itens }: { itens: Indicador[] }) {
  return (
    <div
      className={`grid grid-cols-2 overflow-hidden rounded-md border border-borda bg-superficie sm:grid-cols-3 ${itens.length === 6 ? "" : itens.length === 5 ? "xl:grid-cols-5" : itens.length >= 4 ? "xl:grid-cols-4" : ""}`}
    >
      {itens.map((i, k) => {
        const ruim = i.alerta && (i.valor ?? 0) > 0;
        return (
          <Link
            key={i.rotulo}
            href={i.href}
            className="dv-entrar group flex flex-col gap-1 border-r border-b border-borda p-4 transition-colors hover:bg-superficie-2"
            style={{ "--atraso": `${k * 50}ms` } as CSSProperties}
          >
            <span className="text-sm text-texto-2">{i.rotulo}</span>
            <span
              className={`flex items-baseline gap-1 text-2xl font-semibold ${ruim ? "text-nao-conforme" : "text-texto"}`}
            >
              {ruim && (
                <CircleAlert
                  aria-hidden
                  size={18}
                  strokeWidth={2}
                  className="self-center"
                />
              )}
              {i.valor === null ? "—" : <Contador valor={i.valor} />}
              {i.sufixo && i.valor !== null && (
                <span className="text-base font-normal text-texto-2">
                  {i.sufixo}
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-info opacity-0 transition-opacity group-hover:opacity-100">
              Abrir <ArrowRight aria-hidden size={14} strokeWidth={2} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function ListaDeAtencao({ itens }: { itens: Atencao[] }) {
  if (!itens.length) return null;
  return (
    <div className="rounded-md border border-borda bg-superficie">
      <div className="flex items-baseline justify-between border-b border-borda px-5 py-3">
        <h2 className="text-lg text-texto">
          Precisa da sua atenção{" "}
          <span className="text-texto-2">({itens.length})</span>
        </h2>
        <Link
          href="/paineis/vencimentos"
          className="text-sm font-semibold text-info hover:underline"
        >
          Painel de vencimentos
        </Link>
      </div>
      <ul className="divide-y divide-borda">
        {itens.slice(0, 6).map((a, i) => (
          <li
            key={`${a.href}-${i}`}
            className="dv-entrar"
            style={{ "--atraso": `${i * 40}ms` } as CSSProperties}
          >
            <LinhaDePrazo
              href={a.href}
              icone={a.icone}
              titulo={a.titulo}
              detalhe={a.detalhe}
              selo={a.selo}
              tom={a.tom}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
