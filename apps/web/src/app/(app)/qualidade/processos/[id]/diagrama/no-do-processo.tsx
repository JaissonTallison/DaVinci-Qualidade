"use client";

import type { CSSProperties } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  ACENTO_DO_NO as ACENTO,
  ACENTO_PADRAO as PADRAO,
  ALTURA_DO_NO as ALTURA,
  LARGURA_DO_NO as LARGURA,
  type DadosDoNo,
  type FormaDoNo,
} from "./elementos";

export type NoProcesso = Node<DadosDoNo, "no">;

const SELECIONADO = "#0F766E";
const PONTO: CSSProperties = {
  width: 9,
  height: 9,
  background: "#102A43",
  border: "2px solid var(--color-superficie)",
};

const COM_SVG: FormaDoNo[] = ["decisao", "documento", "dados", "armazenamento"];

export function NoDoProcesso({ data, selected }: NodeProps<NoProcesso>) {
  const acento = ACENTO[data.categoria] ?? PADRAO;
  const cor = selected ? SELECIONADO : acento;
  const w = LARGURA[data.forma];
  const h = ALTURA[data.forma];
  const texto = data.nome || data.rotulo;
  const usaSvg = COM_SVG.includes(data.forma);

  return (
    <div className="relative" style={{ width: w, height: h }}>
      <Handle type="target" position={Position.Top} style={PONTO} />

      {usaSvg ? (
        <FormaSvg forma={data.forma} cor={cor} w={w} h={h} />
      ) : (
        <div
          className="absolute inset-0 bg-superficie transition-shadow"
          style={estiloDaCaixa(data.forma, cor, Boolean(selected))}
        />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-3 text-center">
        {data.forma === "qualidade" && (
          <span className="text-[10px] font-semibold tracking-[0.04em] text-texto-2 uppercase">
            {data.rotulo}
          </span>
        )}
        <span
          className="leading-tight font-medium text-texto"
          style={{ fontSize: data.forma === "decisao" ? 12 : 13.5 }}
        >
          {texto}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} style={PONTO} />
      {data.forma === "decisao" && (
        <>
          <Handle
            id="sim"
            type="source"
            position={Position.Right}
            style={PONTO}
          />
          <Handle
            id="nao"
            type="source"
            position={Position.Left}
            style={PONTO}
          />
        </>
      )}
    </div>
  );
}

function estiloDaCaixa(
  forma: FormaDoNo,
  cor: string,
  selecionado: boolean,
): CSSProperties {
  const base: CSSProperties = {
    borderColor: cor,
    borderStyle: forma === "anotacao" ? "dashed" : "solid",
    borderWidth: 2,
    boxShadow: selecionado
      ? "0 0 0 3px rgba(15,118,110,0.22)"
      : "0 1px 2px rgb(16 42 67 / 0.05)",
  };
  if (forma === "terminal") return { ...base, borderRadius: 999 };
  if (forma === "subprocesso")
    return { ...base, borderRadius: 8, borderLeftWidth: 6, borderRightWidth: 6 };
  if (forma === "qualidade")
    return { ...base, borderRadius: 8, borderLeftWidth: 5 };
  if (forma === "armazenamento") return { ...base, borderRadius: 14 };
  return { ...base, borderRadius: 8 };
}

/** Formas com contorno limpo (decisão, documento, dados, banco de dados). */
function FormaSvg({
  forma,
  cor,
  w,
  h,
}: {
  forma: FormaDoNo;
  cor: string;
  w: number;
  h: number;
}) {
  const comum = {
    style: {
      fill: "var(--color-superficie)",
      stroke: cor,
      strokeWidth: 2,
      strokeLinejoin: "round" as const,
    },
  };
  return (
    <svg
      className="absolute inset-0"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
    >
      {forma === "decisao" && (
        <polygon
          points={`${w / 2},2 ${w - 2},${h / 2} ${w / 2},${h - 2} 2,${h / 2}`}
          {...comum}
        />
      )}
      {forma === "dados" && (
        <polygon
          points={`16,2 ${w - 2},2 ${w - 16},${h - 2} 2,${h - 2}`}
          {...comum}
        />
      )}
      {forma === "documento" && (
        <>
          <path
            d={`M2,2 L${w - 16},2 L${w - 2},16 L${w - 2},${h - 2} L2,${h - 2} Z`}
            {...comum}
          />
          <path
            d={`M${w - 16},2 L${w - 16},16 L${w - 2},16`}
            fill="none"
            stroke={cor}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </>
      )}
      {forma === "armazenamento" && (
        <>
          <path
            d={`M2,11 L2,${h - 11} A ${w / 2 - 2} 9 0 0 0 ${w - 2},${h - 11} L${w - 2},11`}
            {...comum}
          />
          <ellipse
            cx={w / 2}
            cy={11}
            rx={w / 2 - 2}
            ry={9}
            {...comum}
          />
        </>
      )}
    </svg>
  );
}
