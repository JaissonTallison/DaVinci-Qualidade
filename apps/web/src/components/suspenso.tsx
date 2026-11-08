"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Menu que abre ao clicar. Fecha ao clicar fora, com Esc e ao escolher um item.
 * O painel é renderizado por portal no <body>, com posição fixa ancorada no botão: assim não é
 * cortado por contêineres com `overflow` (ex.: a tabela que rola na horizontal) nem gera rolagem.
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
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!aberto) return;
    const posicionar = () => {
      const b = botaoRef.current?.getBoundingClientRect();
      if (b) setPos({ top: b.bottom + 6, right: window.innerWidth - b.right });
    };
    posicionar();
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (
        !botaoRef.current?.contains(alvo) &&
        !painelRef.current?.contains(alvo)
      )
        setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    window.addEventListener("resize", posicionar);
    window.addEventListener("scroll", posicionar, true);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("resize", posicionar);
      window.removeEventListener("scroll", posicionar, true);
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={botaoRef}
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
      {aberto &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={painelRef}
            id={id}
            role="menu"
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            className={`z-50 ${largura} max-w-[calc(100vw-1rem)] rounded-md bg-superficie text-texto shadow-sm`}
          >
            {children(() => setAberto(false))}
          </div>,
          document.body,
        )}
    </>
  );
}
