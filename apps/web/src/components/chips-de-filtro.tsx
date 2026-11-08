import { X } from "@/components/icones";
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
          className="group inline-flex h-6.5 items-center gap-1.5 rounded-campo border border-borda-campo bg-superficie pr-1 pl-2.5 text-xs text-texto hover:border-borda-forte"
        >
          <span className="font-medium text-texto-2">{c.rotulo}:</span>
          <span className="text-texto">{c.valor}</span>
          <span className="grid size-4.5 place-items-center rounded-xs text-texto-3 group-hover:bg-superficie-2 group-hover:text-texto">
            <X aria-hidden size={12} strokeWidth={1.75} />
          </span>
        </Link>
      ))}
    </div>
  );
}
