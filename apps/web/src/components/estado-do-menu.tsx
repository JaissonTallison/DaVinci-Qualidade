"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  /** Gaveta do menu no celular e no tablet (abaixo de 1024 px). */
  gaveta: boolean;
  abrirGaveta: (aberta: boolean) => void;
};
const Contexto = createContext<EstadoDoMenu>({
  compacto: false,
  exibirCompacto: false,
  alternar: () => {},
  gaveta: false,
  abrirGaveta: () => {},
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
  // Gaveta aberta só na página em que foi aberta: navegar fecha, sem efeito para isso
  const caminho = usePathname();
  const [gavetaEm, setGavetaEm] = useState<string | null>(null);
  const gaveta = gavetaEm === caminho;
  const abrirGaveta = useCallback(
    (aberta: boolean) => setGavetaEm(aberta ? caminho : null),
    [caminho],
  );
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
    <Contexto.Provider
      value={{ compacto, exibirCompacto, alternar, gaveta, abrirGaveta }}
    >
      {children}
    </Contexto.Provider>
  );
}

export const useEstadoDoMenu = () => useContext(Contexto);

/** Coluna do menu no computador; abaixo de 1024 px o menu abre como gaveta. */
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

/**
 * Gaveta do menu abaixo de 1024 px: o mesmo menu verde-petróleo, entrando pela esquerda. Fecha ao navegar, ao
 * tocar fora, no X e com Esc. Fechada fica `inert` (fora do foco e dos leitores de tela).
 */
export function GavetaDoMenu({ children }: { children: ReactNode }) {
  const { gaveta, abrirGaveta } = useEstadoDoMenu();
  useEffect(() => {
    if (!gaveta) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && abrirGaveta(false);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [gaveta, abrirGaveta]);
  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden print:hidden ${gaveta ? "" : "pointer-events-none"}`}
      inert={!gaveta}
    >
      <div
        aria-hidden
        onClick={() => abrirGaveta(false)}
        className={`absolute inset-0 bg-texto/40 transition-opacity duration-300 motion-reduce:transition-none ${gaveta ? "opacity-100" : "opacity-0"}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${gaveta ? "translate-x-0" : "-translate-x-full"}`}
      >
        {children}
        <button
          type="button"
          onClick={() => abrirGaveta(false)}
          aria-label="Fechar o menu"
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-sm text-primaria-texto/75 hover:bg-primaria-texto/10 hover:text-primaria-texto"
        >
          <X aria-hidden size={20} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

/** Abre a gaveta. Na barra superior só no tablet: no celular quem abre é o "Menu" da barra inferior. */
export function BotaoAbrirGaveta() {
  const { abrirGaveta } = useEstadoDoMenu();
  return (
    <button
      type="button"
      onClick={() => abrirGaveta(true)}
      aria-label="Abrir o menu"
      className="hidden h-9 w-9 items-center justify-center rounded-sm text-texto hover:bg-superficie-2 focus-visible:outline-2 focus-visible:outline-info md:flex lg:hidden"
    >
      <Menu aria-hidden size={20} strokeWidth={1.75} />
    </button>
  );
}
