"use client";

import { useState } from "react";
import { Dica, Legenda, LinhaDaDica, TabelaDosDados } from "./dica";

export interface Serie {
  chave: string;
  rotulo: string;
  cor: string;
  valores: number[];
}

/**
 * Colunas empilhadas ou agrupadas, em SVG. Colunas de no máximo 24 px, canto de 4 px na ponta, 2 px de espaço
 * entre segmentos, grade fina e eixo com números redondos. Passar o mouse realça a coluna e mostra os valores;
 * clicar abre a lista daquela categoria, quando há `aoEscolher`.
 */
export function Colunas({
  categorias,
  series,
  empilhado = true,
  aoEscolher,
  rotuloDaCategoria = "Período",
}: {
  categorias: string[];
  series: Serie[];
  empilhado?: boolean;
  aoEscolher?: (indice: number) => void;
  rotuloDaCategoria?: string;
}) {
  const [foco, setFoco] = useState<number | null>(null);
  const L = 640;
  const A = 220;
  const margem = { esq: 32, dir: 8, topo: 12, base: 28 };
  const larg = L - margem.esq - margem.dir;
  const alt = A - margem.topo - margem.base;
  const totais = categorias.map((_, i) =>
    empilhado
      ? series.reduce((t, s) => t + (s.valores[i] ?? 0), 0)
      : Math.max(0, ...series.map((s) => s.valores[i] ?? 0)),
  );
  const maximo = Math.max(1, ...totais);
  const passo =
    maximo <= 4
      ? 1
      : Math.ceil(maximo / 4 / (maximo > 20 ? 5 : 1)) * (maximo > 20 ? 5 : 1);
  const topo = Math.ceil(maximo / passo) * passo;
  const marcas = Array.from({ length: topo / passo + 1 }, (_, i) => i * passo);
  const banda = larg / categorias.length;
  const largura = empilhado
    ? Math.min(24, banda * 0.55)
    : Math.min(16, (banda * 0.7) / series.length);
  const y = (v: number) => margem.topo + alt - (v / topo) * alt;

  return (
    <div>
      <Legenda itens={series.map((s) => ({ cor: s.cor, rotulo: s.rotulo }))} />
      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${L} ${A}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${series.map((s) => s.rotulo).join(", ")} por ${rotuloDaCategoria.toLowerCase()}`}
        >
          {marcas.map((m) => (
            <g key={m}>
              <line
                x1={margem.esq}
                x2={L - margem.dir}
                y1={y(m)}
                y2={y(m)}
                stroke="var(--color-borda)"
                strokeWidth={1}
              />
              <text
                x={margem.esq - 6}
                y={y(m) + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--color-texto-3)"
              >
                {m}
              </text>
            </g>
          ))}
          {categorias.map((c, i) => {
            const centro = margem.esq + banda * i + banda / 2;
            let base = 0;
            return (
              <g
                key={c}
                opacity={foco === null || foco === i ? 1 : 0.45}
                className="transition-opacity"
              >
                {series.map((s, k) => {
                  const v = s.valores[i] ?? 0;
                  if (!v) return null;
                  const x = empilhado
                    ? centro - largura / 2
                    : centro - (largura * series.length) / 2 + k * largura + 1;
                  const y0 = empilhado ? y(base) : y(0);
                  const y1 = empilhado ? y(base + v) : y(v);
                  base += v;
                  const h = Math.max(0, y0 - y1 - (empilhado ? 2 : 0));
                  const w = empilhado ? largura : largura - 2;
                  const ponta = empilhado
                    ? series.slice(k + 1).every((o) => !(o.valores[i] ?? 0))
                    : true;
                  const r = ponta ? Math.min(4, h, w / 2) : 0;
                  return (
                    <path
                      key={s.chave}
                      className="dv-crescer-y"
                      style={
                        { "--atraso": `${i * 35}ms` } as React.CSSProperties
                      }
                      d={`M${x},${y1 + h + (empilhado ? 0 : 0)} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + w - r} Q${x + w},${y1} ${x + w},${y1 + r} V${y1 + h} Z`}
                      fill={s.cor}
                    />
                  );
                })}
                <text
                  x={centro}
                  y={A - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--color-texto-3)"
                >
                  {c}
                </text>
                <rect
                  x={margem.esq + banda * i}
                  y={margem.topo}
                  width={banda}
                  height={alt}
                  fill="transparent"
                  className={aoEscolher ? "cursor-pointer" : ""}
                  onMouseEnter={() => setFoco(i)}
                  onMouseLeave={() => setFoco(null)}
                  onClick={() => aoEscolher?.(i)}
                />
              </g>
            );
          })}
        </svg>
        {foco !== null && (
          <Dica
            x={((margem.esq + banda * foco + banda / 2) / L) * 100}
            y={(y(totais[foco]!) / A) * 100}
          >
            <p className="mb-1 font-semibold">{categorias[foco]}</p>
            {series.map((s) => (
              <LinhaDaDica
                key={s.chave}
                cor={s.cor}
                rotulo={s.rotulo}
                valor={String(s.valores[foco] ?? 0)}
              />
            ))}
            {aoEscolher && (
              <p className="mt-1 text-xs text-texto-3">
                Clique para ver a lista
              </p>
            )}
          </Dica>
        )}
      </div>
      <TabelaDosDados
        cabecalho={[rotuloDaCategoria, ...series.map((s) => s.rotulo)]}
        linhas={categorias.map((c, i) => [
          c,
          ...series.map((s) => s.valores[i] ?? 0),
        ])}
      />
    </div>
  );
}
