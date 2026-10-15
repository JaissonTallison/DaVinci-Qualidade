import type { ReactNode } from "react";
import { ajudaDoCampo, erroDoCampo, rotulo } from "@/lib/estilos";

/** Rótulo, controle e, embaixo, o erro do campo (ou a ajuda, quando não há erro). */
export function Campo({
  id,
  rotulo: texto,
  erro,
  ajuda,
  children,
  className = "",
}: {
  id: string;
  rotulo: string;
  erro?: string;
  ajuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={rotulo}>
        {texto}
      </label>
      {children}
      {erro ? (
        <p id={`erro-${id}`} className={erroDoCampo}>
          {erro}
        </p>
      ) : (
        ajuda && <p className={ajudaDoCampo}>{ajuda}</p>
      )}
    </div>
  );
}
