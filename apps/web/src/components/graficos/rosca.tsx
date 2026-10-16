"use client";

import { useState } from "react";
import { Legenda, TabelaDosDados } from "./dica";

export interface Fatia {
  chave: string;
  rotulo: string;
  cor: string;
  valor: number;
}

/** Rosca com o total no centro. Passar o mouse destaca a fatia e troca o centro; clicar filtra (`aoEscolher`). */
export function Rosca({
  fatias,
  rotuloDoTotal,
  escolhida,
  aoEscolher,
}: {
  fatias: Fatia[];
  rotuloDoTotal: string;
  escolhida?: string | null;
  aoEscolher?: (chave: string | null) => void;
}) {
  const [foco, setFoco] = useState<string | null>(null);
  const total = fatias.reduce((t, f) => t + f.valor, 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  const ativa = foco ?? escolhida ?? null;
  const emFoco = fatias.find((f) => f.chave === ativa);
  let acumulado = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative size-44 shrink-0">
        <svg
          viewBox="0 0 180 180"
          className="size-full -rotate-90"
          role="img"
          aria-label={`${rotuloDoTotal}: ${total}`}
        >
          <circle
            cx={90}
            cy={90}
            r={R}
            fill="none"
            stroke="var(--color-superficie-2)"
            strokeWidth={22}
          />
          {total > 0 &&
            fatias
              .filter((f) => f.valor > 0)
              .map((f, i) => {
                const parte = (f.valor / total) * C;
                const desloc = -acumulado;
                acumulado += parte;
                const apagada = ativa !== null && ativa !== f.chave;
                return (
                  <circle
                    key={f.chave}
                    cx={90}
                    cy={90}
                    r={R}
                    fill="none"
                    stroke={f.cor}
                    strokeWidth={ativa === f.chave ? 26 : 22}
                    strokeDasharray={`${Math.max(parte - 2, 0.5)} ${C}`}
                    strokeDashoffset={desloc}
                    opacity={apagada ? 0.35 : 1}
                    className="dv-entrar cursor-pointer transition-[opacity,stroke-width]"
                    style={{ "--atraso": `${i * 90}ms` } as React.CSSProperties}
                    onMouseEnter={() => setFoco(f.chave)}
                    onMouseLeave={() => setFoco(null)}
                    onClick={() =>
                      aoEscolher?.(escolhida === f.chave ? null : f.chave)
                    }
                  />
                );
              })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-semibold text-texto tabular-nums">
            {emFoco ? emFoco.valor : total}
          </span>
          <span className="max-w-28 text-xs text-texto-2">
            {emFoco ? emFoco.rotulo : rotuloDoTotal}
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <Legenda
          itens={fatias.map((f) => ({
            cor: f.cor,
            rotulo: `${f.rotulo} · ${f.valor}`,
          }))}
        />
        {aoEscolher && (
          <p className="mt-2 text-xs text-texto-3">
            {escolhida
              ? "Clique de novo na fatia para ver tudo."
              : "Clique numa fatia para filtrar a lista."}
          </p>
        )}
        <TabelaDosDados
          cabecalho={["Módulo", "Pendências"]}
          linhas={fatias.map((f) => [f.rotulo, f.valor])}
        />
      </div>
    </div>
  );
}
