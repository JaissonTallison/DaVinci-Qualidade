"use client";

import { useState } from "react";
import { Dica, LinhaDaDica, TabelaDosDados } from "./dica";

/** Linha de uma série só (o título diz o que é; sem legenda). Mês sem dado fica sem ponto, nunca zero. */
export function Linha({
  rotulos,
  valores,
  cor,
  nome,
  formato = (v) => v.toLocaleString("pt-BR"),
}: {
  rotulos: string[];
  valores: (number | null)[];
  cor: string;
  nome: string;
  formato?: (v: number) => string;
}) {
  const [foco, setFoco] = useState<number | null>(null);
  const L = 640;
  const A = 200;
  const m = { esq: 36, dir: 12, topo: 14, base: 28 };
  const reais = valores.filter((v): v is number => v !== null);
  const topo = Math.max(1, Math.ceil(Math.max(0, ...reais) * 1.15));
  const x = (i: number) =>
    m.esq + ((L - m.esq - m.dir) * i) / Math.max(1, rotulos.length - 1);
  const y = (v: number) => m.topo + (A - m.topo - m.base) * (1 - v / topo);
  const trechos: string[] = [];
  let atual = "";
  valores.forEach((v, i) => {
    if (v === null) {
      if (atual) trechos.push(atual);
      atual = "";
    } else atual += `${atual ? "L" : "M"}${x(i)},${y(v)} `;
  });
  if (atual) trechos.push(atual);
  const marcas = [0, topo / 2, topo];
  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${L} ${A}`}
          className="h-auto w-full"
          role="img"
          aria-label={nome}
          onMouseLeave={() => setFoco(null)}
        >
          {marcas.map((v) => (
            <g key={v}>
              <line
                x1={m.esq}
                x2={L - m.dir}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--color-borda)"
                strokeWidth={1}
              />
              <text
                x={m.esq - 6}
                y={y(v) + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--color-texto-3)"
              >
                {formato(Math.round(v * 10) / 10)}
              </text>
            </g>
          ))}
          {trechos.map((d, i) => (
            <path
              key={i}
              d={d}
              pathLength={1}
              className="dv-tracar"
              fill="none"
              stroke={cor}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {valores.map((v, i) =>
            v === null ? null : (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r={foco === i ? 6 : 4}
                fill={cor}
                stroke="var(--color-superficie)"
                strokeWidth={2}
                className="dv-entrar transition-[r]"
                style={
                  { "--atraso": `${400 + i * 40}ms` } as React.CSSProperties
                }
              />
            ),
          )}
          {rotulos.map((r, i) => (
            <g key={r}>
              <text
                x={x(i)}
                y={A - 8}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-texto-3)"
              >
                {r}
              </text>
              <rect
                x={x(i) - (L - m.esq - m.dir) / rotulos.length / 2}
                y={m.topo}
                width={(L - m.esq - m.dir) / rotulos.length}
                height={A - m.topo - m.base}
                fill="transparent"
                onMouseEnter={() => setFoco(i)}
              />
            </g>
          ))}
          {foco !== null && (
            <line
              x1={x(foco)}
              x2={x(foco)}
              y1={m.topo}
              y2={A - m.base}
              stroke="var(--color-borda-forte)"
              strokeWidth={1}
            />
          )}
        </svg>
        {foco !== null && (
          <Dica
            x={(x(foco) / L) * 100}
            y={valores[foco] === null ? 40 : (y(valores[foco]!) / A) * 100}
          >
            <p className="mb-1 font-semibold">{rotulos[foco]}</p>
            <LinhaDaDica
              cor={cor}
              rotulo={nome}
              valor={
                valores[foco] === null ? "sem dados" : formato(valores[foco]!)
              }
            />
          </Dica>
        )}
      </div>
      <TabelaDosDados
        cabecalho={["Mês", nome]}
        linhas={rotulos.map((r, i) => [
          r,
          valores[i] === null ? "—" : formato(valores[i]!),
        ])}
      />
    </div>
  );
}
