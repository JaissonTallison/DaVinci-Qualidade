"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconeRecolher } from "./icones-do-menu";
import { COOKIE_MENU_COMPACTO } from "./preferencias-do-menu";

/**
 * `compacto`: largura da coluna (anima). `exibirCompacto`: qual desenho do menu aparece. Ao recolher, o desenho
 * compacto só entra quando a largura termina de encolher; ao expandir, o completo entra na hora e a largura o revela.
 */
type EstadoDoMenu = {
  compacto: boolean;
  exibirCompacto: boolean;
  alternar: () => void;
};
const Contexto = createContext<EstadoDoMenu>({
  compacto: false,
  exibirCompacto: false,
  alternar: () => {},
});

/** Duração da animação da largura (igual à duração da transição da coluna). */
const DURACAO_MS = 400;

/** Menu compacto ou aberto: um estado só para a barra superior (botão) e o menu lateral. Lembrado em cookie. */
export function ProvedorDoMenu({
  compactoInicial,
  children,
}: {
  compactoInicial: boolean;
  children: ReactNode;
}) {
  const [compacto, setCompacto] = useState(compactoInicial);
  const [exibirCompacto, setExibirCompacto] = useState(compactoInicial);
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);
  const alternar = () => {
    const novo = !compacto;
    clearTimeout(espera.current);
    setCompacto(novo);
    const semMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!novo || semMovimento) setExibirCompacto(novo);
    else espera.current = setTimeout(() => setExibirCompacto(true), DURACAO_MS);
    document.cookie = `${COOKIE_MENU_COMPACTO}=${novo ? "sim" : "nao"}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <Contexto.Provider value={{ compacto, exibirCompacto, alternar }}>
      {children}
    </Contexto.Provider>
  );
}

export const useEstadoDoMenu = () => useContext(Contexto);

/** Coluna do menu no computador; some no celular (lá o menu abre no topo). */
export function ColunaDoMenu({ children }: { children: ReactNode }) {
  const { compacto } = useEstadoDoMenu();
  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 overflow-hidden transition-[width] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none lg:block print:hidden ${compacto ? "w-14" : "w-60"}`}
    >
      {children}
    </aside>
  );
}

/** Fica na barra superior, à esquerda. Só no computador. */
export function BotaoRecolherMenu() {
  const { compacto, alternar } = useEstadoDoMenu();
  const rotulo = compacto ? "Abrir o menu" : "Recolher o menu";
  return (
    <button
      type="button"
      onClick={alternar}
      title={rotulo}
      aria-label={rotulo}
      className="hidden h-9 w-9 items-center justify-center rounded-sm text-texto hover:bg-superficie-2 focus-visible:outline-2 focus-visible:outline-info lg:flex"
    >
      <IconeRecolher compacto={compacto} />
    </button>
  );
}
