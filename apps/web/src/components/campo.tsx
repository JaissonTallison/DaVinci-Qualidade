import type { ReactNode } from "react";
import { ajudaDoCampo, erroDoCampo, rotulo } from "@/lib/estilos";

/** "(opcional)" sai em cinza e sem negrito, como no design system; o resto do rótulo fica em texto. */
function textoDoRotulo(texto: string): ReactNode {
  const i = texto.indexOf("(opcional)");
  if (i < 0) return texto;
  return (
    <>
      {texto.slice(0, i).trimEnd()}{" "}
      <span className="font-normal text-texto-3">(opcional)</span>
      {texto.slice(i + "(opcional)".length)}
    </>
  );
}

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
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <label htmlFor={id} className={rotulo}>
        {textoDoRotulo(texto)}
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
