import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export type Ordem = "asc" | "desc";

/**
 * Cabeçalho de coluna que ordena a lista. Um clique ordena crescente; outro inverte.
 * Mantém os filtros da URL e volta para a primeira página. A seta cheia marca a coluna ativa;
 * as demais mostram a seta dupla só ao passar o mouse. Use em colunas que o backend sabe ordenar.
 */
export function ThOrdenavel({
  campo,
  children,
  ordenar,
  ordem,
  base,
  consulta,
  alinhar = "esquerda",
  className = "",
}: {
  /** Chave da coluna, igual à que o backend aceita em "ordenar". */
  campo: string;
  children: ReactNode;
  /** Coluna ordenada agora (da URL). */
  ordenar?: string;
  /** Direção atual (da URL). */
  ordem?: Ordem;
  base: string;
  consulta: URLSearchParams;
  alinhar?: "esquerda" | "direita";
  className?: string;
}) {
  const ativo = ordenar === campo;
  const proxima: Ordem = ativo && ordem === "asc" ? "desc" : "asc";
  const q = new URLSearchParams(consulta);
  q.set("ordenar", campo);
  q.set("ordem", proxima);
  q.delete("pagina");
  const Icone = ativo ? (ordem === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <th
      aria-sort={ativo ? (ordem === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-2 font-semibold ${className}`}
    >
      <Link
        href={`${base}?${q}`}
        className={`group inline-flex items-center gap-1 hover:text-texto ${
          alinhar === "direita" ? "flex-row-reverse" : ""
        }`}
      >
        {children}
        <Icone
          aria-hidden
          size={14}
          strokeWidth={2}
          className={
            ativo
              ? "text-texto"
              : "text-texto-3 opacity-0 transition-opacity group-hover:opacity-100"
          }
        />
      </Link>
    </th>
  );
}
