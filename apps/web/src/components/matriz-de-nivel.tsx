"use client";

import { CLASSES_RO, classeDoRo, type ClasseRo } from "@davinci/types";

/** Fundo do quadrado pelo nível (interface.md §5.4: a cor fica no marcador; o número em `texto`). */
const FUNDO: Record<ClasseRo, string> = {
  baixa: "bg-nivel-baixo/15",
  media: "bg-nivel-medio/20",
  alta: "bg-nivel-alto/20",
};
const AMOSTRA: Record<ClasseRo, string> = {
  baixa: "bg-nivel-baixo",
  media: "bg-nivel-medio",
  alta: "bg-nivel-alto",
};
const LINHAS = [5, 4, 3, 2, 1];
const COLUNAS = [1, 2, 3, 4, 5];

/**
 * Matriz 5×5 do formulário de risco e oportunidade (interface.md §8). Cada quadrado mostra o produto dos
 * eixos; clicar escolhe os dois valores de uma vez. A classificação vem de `classeDoRo` (regra do domínio).
 */
export function MatrizDeNivel({
  eixoA,
  eixoB,
  a,
  b,
  aoEscolher,
}: {
  /** Eixo vertical (probabilidade ou benefício). */
  eixoA: string;
  /** Eixo horizontal (impacto ou viabilidade). */
  eixoB: string;
  a: number | null;
  b: number | null;
  aoEscolher: (a: number, b: number) => void;
}) {
  return (
    <div className="rounded-md border border-borda bg-superficie p-3">
      <div
        role="grid"
        aria-label={`Matriz ${eixoA} × ${eixoB}`}
        className="grid grid-cols-[1rem_1rem_repeat(5,minmax(0,1fr))] gap-0.5"
      >
        <span
          aria-hidden
          className="row-span-5 flex items-center justify-center text-xs text-texto-3 [writing-mode:vertical-rl] rotate-180"
        >
          {eixoA}
        </span>
        {LINHAS.map((p) => (
          <div key={p} role="row" className="contents">
            <span
              aria-hidden
              className="flex items-center justify-center font-mono text-xs text-texto-3"
            >
              {p}
            </span>
            {COLUNAS.map((i) => {
              const classe = classeDoRo(p, i);
              const marcado = a === p && b === i;
              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  aria-selected={marcado}
                  aria-label={`${eixoA} ${p}, ${eixoB} ${i}: ${p * i}, ${CLASSES_RO[classe]}`}
                  onClick={() => aoEscolher(p, i)}
                  className={`flex h-9 items-center justify-center rounded-xs font-mono text-sm text-texto tabular-nums transition-colors hover:outline-1 hover:outline-borda-forte ${FUNDO[classe]} ${marcado ? "font-semibold outline-2 outline-texto" : ""}`}
                >
                  {p * i}
                </button>
              );
            })}
          </div>
        ))}
        <span aria-hidden />
        <span aria-hidden />
        {COLUNAS.map((i) => (
          <span
            key={i}
            aria-hidden
            className="flex h-5 items-center justify-center font-mono text-xs text-texto-3"
          >
            {i}
          </span>
        ))}
        <span aria-hidden />
        <span aria-hidden />
        <span
          aria-hidden
          className="col-span-5 text-center text-xs text-texto-3"
        >
          {eixoB}
        </span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-2">
        {(Object.keys(FUNDO) as ClasseRo[]).map((c) => (
          <li key={c} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-xs ${AMOSTRA[c]}`} />
            {CLASSES_RO[c]}
          </li>
        ))}
      </ul>
    </div>
  );
}
