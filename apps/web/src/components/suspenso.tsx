"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Menu que abre ao clicar (barra superior). Fecha ao clicar fora, com Esc e ao escolher um item.
 * Painel claro com sombra pequena: a única sombra permitida fora do modal (interface.md §6).
 */
export function Suspenso({
  botao,
  rotulo,
  children,
  largura = "w-72",
  classeDoBotao,
}: {
  botao: ReactNode;
  rotulo: string;
  children: (fechar: () => void) => ReactNode;
  largura?: string;
  classeDoBotao: string;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) =>
      !caixa.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);
  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={aberto}
        aria-controls={id}
        aria-label={rotulo}
        title={rotulo}
        onClick={() => setAberto(!aberto)}
        className={classeDoBotao}
      >
        {botao}
      </button>
      {aberto && (
        <div
          id={id}
          className={`absolute right-0 z-30 mt-2 ${largura} rounded-md border border-borda bg-superficie text-texto shadow-sm`}
        >
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  );
}
