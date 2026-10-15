"use client";

import { useState } from "react";
import {
  FONTES_DE_CONSUMO,
  UNIDADE_DA_FONTE,
  type ConsumoDoMes,
  type FonteDeConsumo,
} from "@davinci/types";
import { Linha } from "@/components/graficos";
import { campoCompacto } from "@/lib/estilos";

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

/** Uma fonte por vez (unidades diferentes não dividem o mesmo eixo). Mês sem leitura quebra a linha. */
export function GraficoDeConsumo({
  ano,
  consumos,
  fontes,
}: {
  ano: number;
  consumos: ConsumoDoMes[];
  fontes: FonteDeConsumo[];
}) {
  const [fonte, setFonte] = useState<FonteDeConsumo>(fontes[0]!);
  const pontos = MESES.map((rotulo, i) => {
    const c = consumos.find(
      (x) =>
        x.fonte === fonte &&
        x.competencia === `${ano}-${String(i + 1).padStart(2, "0")}`,
    );
    return {
      rotulo,
      detalhe: `${rotulo} de ${ano}`,
      valor: c ? c.quantidade : null,
    };
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-texto-2">
          {FONTES_DE_CONSUMO[fonte]} por mês, em {UNIDADE_DA_FONTE[fonte]}
        </p>
        {fontes.length > 1 && (
          <select
            value={fonte}
            onChange={(e) => setFonte(e.target.value as FonteDeConsumo)}
            aria-label="Fonte do gráfico"
            className={campoCompacto}
          >
            {fontes.map((f) => (
              <option key={f} value={f}>
                {FONTES_DE_CONSUMO[f]}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mt-3">
        <Linha
          pontos={pontos}
          cor="var(--color-serie-6)"
          formato={(v) =>
            `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${UNIDADE_DA_FONTE[fonte]}`
          }
        />
      </div>
    </div>
  );
}
