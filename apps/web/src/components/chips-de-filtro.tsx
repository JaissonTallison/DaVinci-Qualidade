import { X } from "lucide-react";
import Link from "next/link";

export interface ChipDeFiltro {
  /** Nome do filtro (ex.: "Status"). */
  rotulo: string;
  /** Valor legível (ex.: "Em aberto"). */
  valor: string;
  /** Para onde ir ao remover este filtro (a URL sem ele). */
  href: string;
}

/**
 * Mostra, abaixo dos filtros, o recorte ativo como etiquetas que se removem com um clique.
 * Assim a pessoa vê de relance em que filtro está. Some quando não há filtro.
 */
export function ChipsDeFiltro({ itens }: { itens: ChipDeFiltro[] }) {
  if (itens.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-borda px-4 py-2 text-sm">
      <span className="text-texto-2">Filtros:</span>
      {itens.map((c) => (
        <Link
          key={`${c.rotulo}:${c.valor}`}
          href={c.href}
          aria-label={`Remover filtro ${c.rotulo}: ${c.valor}`}
          className="group inline-flex items-center gap-1 rounded-sm bg-superficie-2 px-2 py-0.5 hover:bg-campo"
        >
          <span className="text-texto-2">{c.rotulo}:</span>
          <span className="font-medium text-texto">{c.valor}</span>
          <X
            aria-hidden
            size={12}
            className="text-texto-3 group-hover:text-texto"
          />
        </Link>
      ))}
    </div>
  );
}
