"use client";

import type { CSSProperties } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { DadosDoNo } from "./elementos";

export type NoProcesso = Node<DadosDoNo, "no">;

/** Cor de destaque por tipo de elemento (borda). Petróleo é o padrão. */
const ACENTO: Record<string, string> = {
  inicio: "#0F766E",
  fim: "#334155",
  decisao: "#B45309",
  nao_conformidade: "#B45309",
  risco: "#B45309",
  acao_corretiva: "#0F766E",
  aprovacao: "#0F766E",
  inspecao: "#0F766E",
  anotacao: "#94A3B8",
};

const PADRAO = "#102A43";
const TAM_PONTO = { width: 8, height: 8, background: "#102A43", border: "none" };

export function NoDoProcesso({ data, selected }: NodeProps<NoProcesso>) {
  const acento = ACENTO[data.categoria] ?? PADRAO;
  const anel = selected ? "0 0 0 2px #0F766E" : undefined;
  const rotulo = data.forma === "qualidade" ? data.rotulo : null;
  const texto = data.nome || data.rotulo;

  const base: CSSProperties = {
    boxShadow: anel,
    borderColor: acento,
  };

  const conteudo = (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 text-center">
      {rotulo && (
        <span className="text-[10px] font-semibold tracking-[0.04em] text-texto-2 uppercase">
          {rotulo}
        </span>
      )}
      <span className="text-[13px] leading-tight font-medium text-texto">
        {texto}
      </span>
    </div>
  );

  return (
    <div className="relative" style={{ minWidth: 120 }}>
      <Handle type="target" position={Position.Top} style={TAM_PONTO} />

      {data.forma === "decisao" ? (
        <div
          className="flex items-center justify-center bg-superficie"
          style={{
            ...base,
            width: 140,
            height: 96,
            borderWidth: 2,
            borderStyle: "solid",
            clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
          }}
        >
          <div className="max-w-[88px] text-center text-[12px] leading-tight font-medium text-texto">
            {texto}
          </div>
        </div>
      ) : data.forma === "dados" ? (
        <div
          className="bg-superficie"
          style={{
            ...base,
            borderWidth: 2,
            borderStyle: "solid",
            clipPath:
              "polygon(14% 0, 100% 0, 86% 100%, 0 100%)",
          }}
        >
          {conteudo}
        </div>
      ) : (
        <div
          className="bg-superficie"
          style={{
            ...base,
            borderWidth: data.forma === "subprocesso" ? undefined : 2,
            borderStyle: data.forma === "anotacao" ? "dashed" : "solid",
            borderRadius:
              data.forma === "terminal"
                ? 999
                : data.forma === "armazenamento"
                  ? 14
                  : 8,
            borderLeftWidth: data.forma === "qualidade" ? 4 : undefined,
            borderInlineWidth: data.forma === "subprocesso" ? 5 : undefined,
            borderBlockWidth: data.forma === "subprocesso" ? 2 : undefined,
            borderTopWidth: data.forma === "documento" ? 2 : undefined,
            borderBottomWidth: data.forma === "documento" ? 4 : undefined,
          }}
        >
          {conteudo}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={TAM_PONTO} />
      {data.forma === "decisao" && (
        <>
          <Handle
            id="sim"
            type="source"
            position={Position.Right}
            style={TAM_PONTO}
          />
          <Handle
            id="nao"
            type="source"
            position={Position.Left}
            style={TAM_PONTO}
          />
        </>
      )}
    </div>
  );
}
