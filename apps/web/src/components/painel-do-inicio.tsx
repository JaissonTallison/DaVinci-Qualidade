"use client";

import { aba as estiloDaAba, trilho } from "@/lib/estilos";
import { useState, type CSSProperties } from "react";
import { type IndicadorDoMes, type InspecoesDoMes } from "@davinci/types";
import { ColunasAgrupadas, Legenda, Linha } from "./graficos";

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

/** Gráfico mensal do Início: inspeções por mês (e acidentes/TF quando o SST estiver disponível). */
export function PainelDoInicio({
  hoje,
  inspecoesPorMes,
  sst,
}: {
  hoje: string;
  inspecoesPorMes: InspecoesDoMes[] | null;
  sst: IndicadorDoMes[] | null;
}) {
  const [graficoMensal, setGraficoMensal] = useState<"insp" | "tf">("insp");

  const graficosMensais = [
    ...(inspecoesPorMes ? (["insp"] as const) : []),
    ...(sst ? (["tf"] as const) : []),
  ];
  const mensalAtivo = graficosMensais.includes(graficoMensal)
    ? graficoMensal
    : graficosMensais[0];
  if (!mensalAtivo) return null;

  return (
    <div
      className="dv-entrar rounded-md bg-superficie p-5 shadow-cartao"
      style={{ "--atraso": "150ms" } as CSSProperties}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg text-texto">
            {mensalAtivo === "insp"
              ? "Inspeções por mês"
              : "Taxa de frequência de acidentes (TF)"}
          </h2>
          <p className="text-sm text-texto-2">
            {mensalAtivo === "insp"
              ? "Aprovadas e reprovadas em cada mês. Clique para ver a lista."
              : `Acidentes com afastamento por milhão de horas trabalhadas, mês a mês em ${hoje.slice(0, 4)} (NBR 14280)`}
          </p>
        </div>
        {graficosMensais.length > 1 && (
          <div role="group" aria-label="Gráfico" className={trilho}>
            <button
              type="button"
              aria-pressed={mensalAtivo === "insp"}
              onClick={() => setGraficoMensal("insp")}
              className={estiloDaAba(mensalAtivo === "insp", true)}
            >
              Inspeções
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
        {mensalAtivo === "insp" && inspecoesPorMes ? (
          <>
            <ColunasAgrupadas
              href="/qualidade/inspecoes"
              series={[
                {
                  id: "aprovadas",
                  rotulo: "Aprovadas",
                  cor: "var(--color-conforme)",
                },
                {
                  id: "reprovadas",
                  rotulo: "Reprovadas",
                  cor: "var(--color-nao-conforme)",
                },
              ]}
              categorias={inspecoesPorMes.map((m) => ({
                rotulo: MESES[Number(m.mes.slice(5, 7)) - 1]!,
                detalhe: `${MESES[Number(m.mes.slice(5, 7)) - 1]} de ${m.mes.slice(0, 4)}`,
                valores: [m.aprovadas, m.reprovadas],
              }))}
            />
            <div className="mt-2">
              <Legenda
                itens={[
                  {
                    rotulo: "Aprovadas",
                    cor: "var(--color-conforme)",
                    valor: inspecoesPorMes.reduce((t, m) => t + m.aprovadas, 0),
                  },
                  {
                    rotulo: "Reprovadas",
                    cor: "var(--color-nao-conforme)",
                    valor: inspecoesPorMes.reduce(
                      (t, m) => t + m.reprovadas,
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
  );
}
