"use client";

import { useEffect, useState } from "react";

/** Número que sobe de 0 até o valor em ~700 ms ao aparecer. Com "reduzir movimento", vai direto ao valor. */
export function Contador({ valor }: { valor: number }) {
  const [atual, setAtual] = useState(0);
  useEffect(() => {
    const direto = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const inicio = performance.now();
    let quadro = 0;
    const passo = (agora: number) => {
      const t = direto ? 1 : Math.min((agora - inicio) / 700, 1);
      setAtual(Math.round(valor * (1 - (1 - t) ** 3)));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor]);
  return <span className="tabular-nums">{atual.toLocaleString("pt-BR")}</span>;
}
