"use client";

import { Contador } from "../contador";

/** Anel de progresso (0 a 100) que se completa ao aparecer. Pensado para o destaque escuro do início. */
export function Anel({
  valor,
  rotulo,
}: {
  valor: number | null;
  rotulo: string;
}) {
  const R = 64;
  const C = 2 * Math.PI * R;
  const v = valor === null ? 0 : Math.max(0, Math.min(100, valor));
  return (
    <div className="relative size-40 shrink-0">
      <svg
        viewBox="0 0 160 160"
        className="size-full -rotate-90"
        role="img"
        aria-label={`${rotulo}: ${valor === null ? "sem dados" : `${v}%`}`}
      >
        <circle
          cx={80}
          cy={80}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={12}
        />
        <circle
          cx={80}
          cy={80}
          r={R}
          fill="none"
          stroke="var(--color-ouro-claro)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - v / 100)}
          className="dv-anel"
          style={{ "--circunferencia": `${C}` } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold">
          {valor === null ? (
            "—"
          ) : (
            <>
              <Contador valor={v} />%
            </>
          )}
        </span>
        <span className="text-xs tracking-wide uppercase opacity-80">
          {rotulo}
        </span>
      </div>
    </div>
  );
}
