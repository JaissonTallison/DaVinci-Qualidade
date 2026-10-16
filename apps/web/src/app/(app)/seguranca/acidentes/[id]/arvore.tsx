import type { ReactNode } from "react";
import { COMPONENTES_ITMA, type InvestigacaoDoAcidente } from "@davinci/types";

type Fato = InvestigacaoDoAcidente["fatos"][number];

/** Árvore de causas a partir do fato 1 (a lesão), descendo pelos antecedentes. Um fato já mostrado vira referência. */
export function ArvoreDeCausas({ fatos }: { fatos: Fato[] }) {
  if (!fatos.length) return null;
  const vistos = new Set<number>();
  const ramo = (n: number): ReactNode => {
    const f = fatos[n - 1];
    if (!f) return null;
    if (vistos.has(n))
      return (
        <li key={`${n}-ref`} className="text-texto-2">
          ver fato {n}
        </li>
      );
    vistos.add(n);
    return (
      <li key={n}>
        <span className="font-mono text-xs text-texto-3">{n}</span> {f.fato}{" "}
        <span className="text-xs text-texto-2">
          · {COMPONENTES_ITMA[f.componente]}
        </span>
        {f.antecedentes.length > 0 && (
          <ul className="mt-1 ml-4 border-l border-borda pl-3">
            {f.antecedentes.map(ramo)}
          </ul>
        )}
      </li>
    );
  };
  const raiz = ramo(1);
  const soltos = fatos.map((_, i) => i + 1).filter((n) => !vistos.has(n));
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {raiz}
      {soltos.length > 0 && (
        <li className="mt-2 text-texto-2">
          Fatos sem ligação com a lesão: {soltos.join(", ")}
        </li>
      )}
    </ul>
  );
}
