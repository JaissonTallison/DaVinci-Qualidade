"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

/*
 * Gráficos do sistema, em SVG próprio (sem biblioteca). Regras (skill dataviz e interface.md):
 * cor por série em ordem fixa (tokens serie-1..5), colunas de no máximo 24 px com topo arredondado,
 * 2 px de respiro entre segmentos, grade fina, legenda sempre com os números, tooltip ao passar o mouse
 * e texto nunca na cor da série.
 */

export interface Serie {
  id: string;
  rotulo: string;
  /** Variável CSS da cor (ex.: "var(--color-serie-1)"). */
  cor: string;
}

const ALTURA = 200;
const MARGEM = { topo: 12, base: 28, esquerda: 40, direita: 8 };

/** Rótulo do eixo: a partir de 10 mil, abreviado ("20 mil", "1,5 mi") para caber na margem. */
const rotuloDoEixo = (v: number) =>
  v >= 10_000
    ? v.toLocaleString("pt-BR", {
        notation: "compact",
        maximumFractionDigits: 1,
      })
    : Math.round(v).toLocaleString("pt-BR");

/** Eixo com passos iguais e redondos: até 4, de 1 em 1; acima, 4 passos de 1, 2 ou 5 × 10^k. */
function escala(max: number): { teto: number; passos: number } {
  if (max <= 4)
    return {
      teto: Math.max(Math.ceil(max), 1),
      passos: Math.max(Math.ceil(max), 1),
    };
  const bruto = max / 4;
  const p = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 5, 10].map((m) => m * p).find((v) => v >= bruto)!;
  return { teto: passo * 4, passos: 4 };
}

/** Largura real do quadro, para o SVG desenhar 1:1 (texto sempre no mesmo tamanho). */
function useLargura(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(
      ([e]) => e && setLargura(Math.max(280, Math.round(e.contentRect.width))),
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, largura];
}

function Dica({
  pos,
  children,
}: {
  pos: { x: number; y: number } | null;
  children: ReactNode;
}) {
  if (!pos) return null;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 min-w-36 rounded-sm border border-borda bg-superficie px-3 py-2 text-sm text-texto shadow-sm"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, calc(-100% - 10px))",
      }}
    >
      {children}
    </div>
  );
}

export function Legenda({
  itens,
}: {
  itens: { rotulo: string; cor: string; valor?: number; destacado?: boolean }[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-texto-2">
      {itens.map((i) => (
        <li
          key={i.rotulo}
          className={`flex items-center gap-1.5 ${i.destacado === false ? "opacity-40" : ""}`}
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-xs"
            style={{ background: i.cor }}
          />
          {i.rotulo}
          {i.valor !== undefined && (
            <span className="font-semibold text-texto tabular-nums">
              {i.valor.toLocaleString("pt-BR")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Grade({
  largura,
  max,
  passos,
}: {
  largura: number;
  max: number;
  passos: number;
}) {
  return (
    <g>
      {Array.from({ length: passos + 1 }, (_, i) => {
        const v = (max / passos) * i;
        const y =
          MARGEM.topo + (ALTURA - MARGEM.topo - MARGEM.base) * (1 - v / max);
        return (
          <g key={i}>
            <line
              x1={MARGEM.esquerda}
              x2={largura - MARGEM.direita}
              y1={y}
              y2={y}
              stroke="var(--color-borda)"
              strokeWidth={1}
            />
            <text
              x={MARGEM.esquerda - 6}
              y={y}
              dy="0.32em"
              textAnchor="end"
              fontSize={11}
              fill="var(--color-texto-3)"
            >
              {rotuloDoEixo(v)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Coluna com topo arredondado (4 px) e base reta. */
function caminhoDaColuna(
  x: number,
  y: number,
  l: number,
  a: number,
  arredondar: boolean,
): string {
  if (a <= 0) return "";
  const r = arredondar ? Math.min(4, l / 2, a) : 0;
  return `M${x},${y + a} V${y + r} Q${x},${y} ${x + r},${y} H${x + l - r} Q${x + l},${y} ${x + l},${y + r} V${y + a} Z`;
}

/**
 * Colunas empilhadas por categoria (ex.: vencimentos por semana, por módulo). Clicar numa coluna abre `href`.
 * `destaque`: série realçada pela legenda (as outras ficam esmaecidas).
 */
export function ColunasEmpilhadas({
  categorias,
  series,
  destaque,
}: {
  categorias: {
    rotulo: string;
    detalhe?: string;
    href?: string;
    valores: Record<string, number>;
  }[];
  series: Serie[];
  destaque?: string | null;
}) {
  const router = useRouter();
  const [caixa, largura] = useLargura();
  const [foco, setFoco] = useState<{ i: number; x: number; y: number } | null>(
    null,
  );
  const totais = categorias.map((c) =>
    series.reduce((t, s) => t + (c.valores[s.id] ?? 0), 0),
  );
  const { teto: max, passos } = escala(Math.max(...totais, 1));
  const areaY = ALTURA - MARGEM.topo - MARGEM.base;
  const faixa =
    (largura - MARGEM.esquerda - MARGEM.direita) /
    Math.max(categorias.length, 1);
  const l = Math.min(24, faixa * 0.6);
  const mostrarRotulo = (i: number) => categorias.length <= 13 || i % 2 === 0;
  return (
    <div ref={caixa} className="relative">
      <svg
        viewBox={`0 0 ${largura} ${ALTURA}`}
        className="h-auto w-full"
        role="img"
        aria-label="Gráfico de colunas empilhadas"
      >
        <Grade largura={largura} max={max} passos={passos} />
        {categorias.map((c, i) => {
          const x = MARGEM.esquerda + faixa * i + (faixa - l) / 2;
          let acumulado = 0;
          const presentes = series.filter((s) => (c.valores[s.id] ?? 0) > 0);
          return (
            <g
              key={c.rotulo}
              className={c.href ? "cursor-pointer" : ""}
              onMouseMove={(e) => {
                const r = caixa.current!.getBoundingClientRect();
                setFoco({ i, x: e.clientX - r.left, y: e.clientY - r.top });
              }}
              onMouseLeave={() => setFoco(null)}
              onClick={() => c.href && router.push(c.href)}
            >
              <rect
                x={MARGEM.esquerda + faixa * i}
                y={MARGEM.topo}
                width={faixa}
                height={areaY}
                fill="transparent"
              />
              {presentes.map((s, k) => {
                const v = c.valores[s.id] ?? 0;
                const a = (v / max) * areaY;
                const y = MARGEM.topo + areaY - acumulado - a;
                acumulado += a;
                const topo = k === presentes.length - 1;
                return (
                  <path
                    key={s.id}
                    d={caminhoDaColuna(
                      x,
                      y + (topo ? 0 : 1),
                      l,
                      Math.max(a - (topo ? 0 : 2), 0),
                      topo,
                    )}
                    fill={s.cor}
                    opacity={
                      destaque && destaque !== s.id
                        ? 0.25
                        : foco && foco.i !== i
                          ? 0.55
                          : 1
                    }
                    className="dv-crescer-y transition-opacity"
                    style={{ "--atraso": `${i * 35}ms` } as CSSProperties}
                  />
                );
              })}
              {mostrarRotulo(i) && (
                <text
                  x={x + l / 2}
                  y={ALTURA - 10}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--color-texto-2)"
                >
                  {c.rotulo}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <Dica pos={foco}>
        {foco && (
          <>
            <p className="font-semibold">
              {categorias[foco.i]!.detalhe ?? categorias[foco.i]!.rotulo}
            </p>
            {series
              .filter((s) => (categorias[foco.i]!.valores[s.id] ?? 0) > 0)
              .map((s) => (
                <p
                  key={s.id}
                  className="flex items-center gap-1.5 text-texto-2"
                >
                  <span
                    aria-hidden
                    className="size-2 rounded-xs"
                    style={{ background: s.cor }}
                  />
                  {s.rotulo}{" "}
                  <span className="ml-auto pl-3 font-semibold text-texto tabular-nums">
                    {categorias[foco.i]!.valores[s.id]}
                  </span>
                </p>
              ))}
            {totais[foco.i] === 0 && (
              <p className="text-texto-3">Nenhum prazo</p>
            )}
          </>
        )}
      </Dica>
    </div>
  );
}

/** Colunas lado a lado por categoria (ex.: NCs abertas × encerradas por mês). */
export function ColunasAgrupadas({
  categorias,
  series,
  href,
}: {
  categorias: { rotulo: string; detalhe?: string; valores: number[] }[];
  series: Serie[];
  href?: string;
}) {
  const router = useRouter();
  const [caixa, largura] = useLargura();
  const [foco, setFoco] = useState<{ i: number; x: number; y: number } | null>(
    null,
  );
  const { teto: max, passos } = escala(
    Math.max(...categorias.flatMap((c) => c.valores), 1),
  );
  const areaY = ALTURA - MARGEM.topo - MARGEM.base;
  const faixa =
    (largura - MARGEM.esquerda - MARGEM.direita) /
    Math.max(categorias.length, 1);
  const l = Math.min(18, (faixa * 0.7) / series.length);
  return (
    <div ref={caixa} className="relative">
      <svg
        viewBox={`0 0 ${largura} ${ALTURA}`}
        className="h-auto w-full"
        role="img"
        aria-label="Gráfico de colunas agrupadas"
      >
        <Grade largura={largura} max={max} passos={passos} />
        {categorias.map((c, i) => {
          const inicio =
            MARGEM.esquerda +
            faixa * i +
            (faixa - (l * series.length + 2 * (series.length - 1))) / 2;
          return (
            <g
              key={c.rotulo}
              className={href ? "cursor-pointer" : ""}
              onMouseMove={(e) => {
                const r = caixa.current!.getBoundingClientRect();
                setFoco({ i, x: e.clientX - r.left, y: e.clientY - r.top });
              }}
              onMouseLeave={() => setFoco(null)}
              onClick={() => href && router.push(href)}
            >
              <rect
                x={MARGEM.esquerda + faixa * i}
                y={MARGEM.topo}
                width={faixa}
                height={areaY}
                fill="transparent"
              />
              {series.map((s, k) => {
                const a = ((c.valores[k] ?? 0) / max) * areaY;
                return (
                  <path
                    key={s.id}
                    d={caminhoDaColuna(
                      inicio + k * (l + 2),
                      MARGEM.topo + areaY - a,
                      l,
                      a,
                      true,
                    )}
                    fill={s.cor}
                    opacity={foco && foco.i !== i ? 0.55 : 1}
                    className="dv-crescer-y transition-opacity"
                    style={{ "--atraso": `${i * 40}ms` } as CSSProperties}
                  />
                );
              })}
              <text
                x={MARGEM.esquerda + faixa * i + faixa / 2}
                y={ALTURA - 10}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-texto-2)"
              >
                {c.rotulo}
              </text>
            </g>
          );
        })}
      </svg>
      <Dica pos={foco}>
        {foco && (
          <>
            <p className="font-semibold">
              {categorias[foco.i]!.detalhe ?? categorias[foco.i]!.rotulo}
            </p>
            {series.map((s, k) => (
              <p key={s.id} className="flex items-center gap-1.5 text-texto-2">
                <span
                  aria-hidden
                  className="size-2 rounded-xs"
                  style={{ background: s.cor }}
                />
                {s.rotulo}{" "}
                <span className="ml-auto pl-3 font-semibold text-texto tabular-nums">
                  {categorias[foco.i]!.valores[k]}
                </span>
              </p>
            ))}
          </>
        )}
      </Dica>
    </div>
  );
}

/** Rosca: partes de um todo. Passar o mouse realça a fatia; clicar abre `href` dela. */
export function Rosca({
  fatias,
  centro,
  rotuloDoCentro,
}: {
  fatias: {
    id: string;
    rotulo: string;
    valor: number;
    cor: string;
    href?: string;
  }[];
  centro: number;
  rotuloDoCentro: string;
}) {
  const router = useRouter();
  const [foco, setFoco] = useState<string | null>(null);
  const total = fatias.reduce((t, f) => t + f.valor, 0);
  const r = 70;
  const c = 2 * Math.PI * r;
  let acumulado = 0;
  const focada = fatias.find((f) => f.id === foco);
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg
        viewBox="0 0 180 180"
        className="w-44 shrink-0"
        role="img"
        aria-label="Gráfico de rosca"
      >
        <circle
          cx={90}
          cy={90}
          r={r}
          fill="none"
          stroke="var(--color-superficie-2)"
          strokeWidth={22}
        />
        {total > 0 &&
          fatias
            .filter((f) => f.valor > 0)
            .map((f, i) => {
              const parte = (f.valor / total) * c;
              const traco = Math.max(parte - 2, 0.5);
              const deslocamento = -acumulado;
              acumulado += parte;
              return (
                <circle
                  key={f.id}
                  cx={90}
                  cy={90}
                  r={r}
                  fill="none"
                  stroke={f.cor}
                  strokeWidth={foco === f.id ? 26 : 22}
                  strokeDasharray={`${traco} ${c - traco}`}
                  strokeDashoffset={deslocamento}
                  transform="rotate(-90 90 90)"
                  opacity={foco && foco !== f.id ? 0.35 : 1}
                  className={`dv-entrar transition-[opacity,stroke-width] ${f.href ? "cursor-pointer" : ""}`}
                  style={{ "--atraso": `${200 + i * 80}ms` } as CSSProperties}
                  onMouseEnter={() => setFoco(f.id)}
                  onMouseLeave={() => setFoco(null)}
                  onClick={() => f.href && router.push(f.href)}
                />
              );
            })}
        <text
          x={90}
          y={86}
          textAnchor="middle"
          fontSize={30}
          fontWeight={600}
          fill="var(--color-texto)"
        >
          {(focada ? focada.valor : centro).toLocaleString("pt-BR")}
        </text>
        <text
          x={90}
          y={108}
          textAnchor="middle"
          fontSize={11}
          fill="var(--color-texto-2)"
        >
          {focada ? focada.rotulo : rotuloDoCentro}
        </text>
      </svg>
      <ul className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm">
        {fatias.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              onMouseEnter={() => setFoco(f.id)}
              onMouseLeave={() => setFoco(null)}
              onClick={() => f.href && router.push(f.href)}
              className={`flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left hover:bg-superficie-2 ${foco && foco !== f.id ? "opacity-50" : ""}`}
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-xs"
                style={{ background: f.cor }}
              />
              <span className="flex-1 text-texto-2">{f.rotulo}</span>
              <span className="font-semibold text-texto tabular-nums">
                {f.valor}
              </span>
              <span className="w-10 text-right text-texto-3 tabular-nums">
                {total ? Math.round((f.valor / total) * 100) : 0}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Linha de uma série mensal (ex.: taxa de frequência); mês sem dado fica em branco, nunca zero. */
export function Linha({
  pontos,
  cor,
  formato = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
}: {
  pontos: { rotulo: string; detalhe?: string; valor: number | null }[];
  cor: string;
  formato?: (v: number) => string;
}) {
  const [caixa, largura] = useLargura();
  const [foco, setFoco] = useState<{ i: number; x: number; y: number } | null>(
    null,
  );
  const { teto: max, passos } = escala(
    Math.max(...pontos.map((p) => p.valor ?? 0), 1),
  );
  const areaY = ALTURA - MARGEM.topo - MARGEM.base;
  const passo =
    (largura - MARGEM.esquerda - MARGEM.direita) / Math.max(pontos.length, 1);
  const px = (i: number) => MARGEM.esquerda + passo * i + passo / 2;
  const py = (v: number) => MARGEM.topo + areaY * (1 - v / max);
  // Trechos contínuos: mês sem dado quebra a linha
  const trechos: { i: number; v: number }[][] = [];
  pontos.forEach((p, i) => {
    if (p.valor === null) return trechos.push([]);
    if (!trechos.length) trechos.push([]);
    trechos[trechos.length - 1]!.push({ i, v: p.valor });
  });
  return (
    <div ref={caixa} className="relative">
      <svg
        viewBox={`0 0 ${largura} ${ALTURA}`}
        className="h-auto w-full"
        role="img"
        aria-label="Gráfico de linha"
      >
        <Grade largura={largura} max={max} passos={passos} />
        {trechos
          .filter((t) => t.length > 1)
          .map((t, k) => (
            <path
              key={k}
              d={t
                .map((p, j) => `${j ? "L" : "M"}${px(p.i)},${py(p.v)}`)
                .join(" ")}
              fill="none"
              stroke={cor}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              className="dv-tracar"
            />
          ))}
        {pontos.map((p, i) => (
          <g
            key={p.rotulo}
            onMouseMove={(e) => {
              const r = caixa.current!.getBoundingClientRect();
              setFoco({ i, x: e.clientX - r.left, y: e.clientY - r.top });
            }}
            onMouseLeave={() => setFoco(null)}
          >
            <rect
              x={px(i) - passo / 2}
              y={MARGEM.topo}
              width={passo}
              height={areaY}
              fill="transparent"
            />
            {foco?.i === i && (
              <line
                x1={px(i)}
                x2={px(i)}
                y1={MARGEM.topo}
                y2={MARGEM.topo + areaY}
                stroke="var(--color-borda-forte)"
                strokeWidth={1}
              />
            )}
            {p.valor !== null && (
              <circle
                cx={px(i)}
                cy={py(p.valor)}
                r={foco?.i === i ? 5 : 4}
                fill={cor}
                stroke="var(--color-superficie)"
                strokeWidth={2}
                className="dv-entrar"
                style={{ "--atraso": `${300 + i * 40}ms` } as CSSProperties}
              />
            )}
            <text
              x={px(i)}
              y={ALTURA - 10}
              textAnchor="middle"
              fontSize={11}
              fill="var(--color-texto-2)"
            >
              {p.rotulo}
            </text>
          </g>
        ))}
      </svg>
      <Dica pos={foco}>
        {foco && (
          <>
            <p className="font-semibold">
              {pontos[foco.i]!.detalhe ?? pontos[foco.i]!.rotulo}
            </p>
            <p className="text-texto-2">
              {pontos[foco.i]!.valor === null
                ? "Sem horas lançadas no mês"
                : formato(pontos[foco.i]!.valor!)}
            </p>
          </>
        )}
      </Dica>
    </div>
  );
}
