import Link from "next/link";

/**
 * Rodapé de lista: a contagem total à esquerda e, quando há mais de uma página, o passo
 * Anterior / Página X de Y / Próxima à direita. Preserva os filtros da URL ao trocar de página.
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
  return (
    <nav
      aria-label="Páginas"
      className="flex items-center justify-between gap-4 border-t border-borda px-4 py-2.5 text-sm text-texto-2"
    >
      <span>
        {pagina.total.toLocaleString("pt-BR")}{" "}
        {pagina.total === 1 ? rotulo[0] : rotulo[1]}
      </span>
      {paginas > 1 && (
        <span className="flex items-center gap-4">
          {pagina.pagina > 1 ? (
            <Link href={link(pagina.pagina - 1)} className="hover:underline">
              Anterior
            </Link>
          ) : (
            <span className="text-texto-3">Anterior</span>
          )}
          <span>
            Página {pagina.pagina} de {paginas}
          </span>
          {pagina.pagina < paginas ? (
            <Link href={link(pagina.pagina + 1)} className="hover:underline">
              Próxima
            </Link>
          ) : (
            <span className="text-texto-3">Próxima</span>
          )}
        </span>
      )}
    </nav>
  );
}
