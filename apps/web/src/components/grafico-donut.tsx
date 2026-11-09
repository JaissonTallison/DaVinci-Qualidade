/** Fatia de um donut: rótulo, valor e a cor (um token, ex.: "var(--color-serie-1)"). */
export type FatiaDonut = { rotulo: string; valor: number; cor: string };

/**
 * Gráfico de rosca (donut) do design system: anel com os segmentos na ordem dada, o total no centro e a
 * legenda ao lado com o quadradinho de cor e o número. Sem degradê, sem animação.
 */
export function GraficoDonut({
  fatias,
  rotuloCentro = "total",
}: {
  fatias: FatiaDonut[];
  rotuloCentro?: string;
}) {
  const total = fatias.reduce((t, f) => t + f.valor, 0);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const comprimento = (v: number) => (total > 0 ? (v / total) * circ : 0);
  const visiveis = fatias.filter((f) => f.valor > 0);
  const arcos = visiveis.map((f, i) => ({
    rotulo: f.rotulo,
    cor: f.cor,
    traco: Math.max(comprimento(f.valor) - 1.5, 0.5),
    deslocamento: -visiveis
      .slice(0, i)
      .reduce((t, x) => t + comprimento(x.valor), 0),
  }));
  return (
    <div className="flex items-center gap-5">
      <div className="relative size-28 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle
            cx={50}
            cy={50}
            r={r}
            fill="none"
            strokeWidth={16}
            className="stroke-superficie-2"
          />
          {arcos.map((a) => (
            <circle
              key={a.rotulo}
              cx={50}
              cy={50}
              r={r}
              fill="none"
              strokeWidth={16}
              stroke={a.cor}
              strokeDasharray={`${a.traco} ${circ - a.traco}`}
              strokeDashoffset={a.deslocamento}
            />
          ))}
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-xl font-semibold text-texto tabular-nums">
            {total}
          </span>
          <span className="text-xs text-texto-2">{rotuloCentro}</span>
        </span>
      </div>
      <ul className="min-w-0 flex-1 text-sm">
        {fatias.map((f) => (
          <li key={f.rotulo} className="flex items-center gap-2 py-0.5">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-xs"
              style={{ background: f.cor }}
            />
            <span className="min-w-0 truncate text-texto-2">{f.rotulo}</span>
            <span className="ml-auto font-semibold text-texto tabular-nums">
              {f.valor}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
