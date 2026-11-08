import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icones";

/**
 * Rodapé de lista: a contagem total à esquerda e, quando há mais de uma página, setas e números das
 * páginas à direita (a atual com contorno). Preserva os filtros da URL ao trocar de página.
 * Um só desenho para todas as telas de lista.
 */
export function Paginacao({
  pagina,
  base,
  consulta,
  rotulo = ["item", "itens"],
}: {
  pagina: { total: number; pagina: number; porPagina: number };
  /** Caminho da tela (ex.: "/qualidade/nao-conformidades"). */
  base: string;
  /** Filtros atuais, para manter ao mudar de página. */
  consulta: URLSearchParams;
  /** [singular, plural] da unidade contada. */
  rotulo?: [string, string];
}) {
  const paginas = Math.max(1, Math.ceil(pagina.total / pagina.porPagina));
  const link = (n: number) => {
    const q = new URLSearchParams(consulta);
    q.set("pagina", String(n));
    return `${base}?${q}`;
  };
  // Números visíveis: a primeira, a última e duas em volta da atual, com "…" nos saltos.
  const numeros = Array.from({ length: paginas }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === paginas || Math.abs(n - pagina.pagina) <= 1,
  );
  const passo =
    "inline-flex h-7.5 min-w-7.5 items-center justify-center rounded-campo border px-2 text-sm font-medium tabular-nums";
  const seta = (
    n: number,
    ativa: boolean,
    rotuloSeta: string,
    icone: ReactNode,
  ) =>
    ativa ? (
      <Link
        href={link(n)}
        aria-label={rotuloSeta}
        className={`${passo} border-transparent text-texto-2 hover:bg-superficie-2 hover:text-texto`}
      >
        {icone}
      </Link>
    ) : (
      <span
        aria-hidden
        className={`${passo} border-transparent text-texto-3 opacity-50`}
      >
        {icone}
      </span>
    );
  return (
    <nav
      aria-label="Páginas"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-borda px-5 py-3 text-sm text-texto-2"
    >
      <span>
        {pagina.total.toLocaleString("pt-BR")}{" "}
        {pagina.total === 1 ? rotulo[0] : rotulo[1]}
      </span>
      {paginas > 1 && (
        <span className="flex items-center gap-1">
          {seta(
            pagina.pagina - 1,
            pagina.pagina > 1,
            "Página anterior",
            <ChevronLeft aria-hidden size={16} strokeWidth={1.75} />,
          )}
          {numeros.map((n, i) => (
            <Fragment key={n}>
              {i > 0 && n - (numeros[i - 1] ?? n) > 1 && (
                <span className="px-1 text-texto-3">…</span>
              )}
              {n === pagina.pagina ? (
                <span
                  aria-current="page"
                  className={`${passo} border-borda-forte bg-superficie text-texto`}
                >
                  {n}
                </span>
              ) : (
                <Link
                  href={link(n)}
                  className={`${passo} border-transparent text-texto-2 hover:bg-superficie-2 hover:text-texto`}
                >
                  {n}
                </Link>
              )}
            </Fragment>
          ))}
          {seta(
            pagina.pagina + 1,
            pagina.pagina < paginas,
            "Próxima página",
            <ChevronRight aria-hidden size={16} strokeWidth={1.75} />,
          )}
        </span>
      )}
    </nav>
  );
}
