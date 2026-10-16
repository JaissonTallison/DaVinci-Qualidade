"use client";

import type { ReactNode } from "react";

/** Caixa de valores ao passar o mouse, presa à posição do ponto (x e y em % do gráfico). */
export function Dica({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 -translate-y-full rounded-sm border border-borda bg-superficie px-3 py-2 text-sm text-texto shadow-sm"
      style={{ left: `${x}%`, top: `calc(${y}% - 8px)` }}
    >
      {children}
    </div>
  );
}

export function LinhaDaDica({
  cor,
  rotulo,
  valor,
}: {
  cor: string;
  rotulo: string;
  valor: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-xs"
        style={{ background: cor }}
      />
      <span className="flex-1 text-texto-2">{rotulo}</span>
      <span className="font-semibold tabular-nums">{valor}</span>
    </span>
  );
}

/** Legenda: identidade nunca só pela cor (marca colorida + texto na cor do texto). */
export function Legenda({
  itens,
}: {
  itens: { cor: string; rotulo: string }[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-texto-2">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-xs"
            style={{ background: i.cor }}
          />
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}

/** A mesma informação em tabela: obrigatória (três cores das séries ficam abaixo de 3:1 no fundo claro). */
export function TabelaDosDados({
  cabecalho,
  linhas,
}: {
  cabecalho: string[];
  linhas: (string | number)[][];
}) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-texto-2 hover:text-texto">
        Ver dados
      </summary>
      <div className="relative mt-2 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-superficie-2 text-xs text-texto-2">
            <tr>
              {cabecalho.map((c) => (
                <th key={c} className="px-3 py-1.5 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {linhas.map((l, i) => (
              <tr key={i}>
                {l.map((c, j) => (
                  <td key={j} className="px-3 py-1.5 tabular-nums">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
