"use client";

import { Download, X } from "@/components/icones";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Botao } from "@/components/botao";

interface Selecao {
  selecionados: Set<string>;
  alternar: (id: string) => void;
  definir: (ids: string[], marcar: boolean) => void;
  limpar: () => void;
}

const Contexto = createContext<Selecao | null>(null);

export function useSelecao(): Selecao {
  const c = useContext(Contexto);
  if (!c)
    throw new Error(
      "Use os componentes de seleção dentro de <SelecaoDeLinhas>.",
    );
  return c;
}

/**
 * Guarda, no navegador, quais linhas da tabela estão marcadas. Envolve a tabela e a barra de ação.
 * A seleção vale para a página atual (troca de página ou filtro recomeça a seleção).
 */
export function SelecaoDeLinhas({ children }: { children: ReactNode }) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const alternar = (id: string) =>
    setSelecionados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const definir = (ids: string[], marcar: boolean) =>
    setSelecionados((s) => {
      const n = new Set(s);
      for (const id of ids)
        if (marcar) n.add(id);
        else n.delete(id);
      return n;
    });
  const limpar = () => setSelecionados(new Set());
  return (
    <Contexto.Provider value={{ selecionados, alternar, definir, limpar }}>
      {children}
    </Contexto.Provider>
  );
}

/** Caixa de uma linha. Fica acima do link da linha (coloque o `<td>` com relative z-10). */
export function CaixaDeSelecao({ id, rotulo }: { id: string; rotulo: string }) {
  const { selecionados, alternar } = useSelecao();
  return (
    <input
      type="checkbox"
      checked={selecionados.has(id)}
      onChange={() => alternar(id)}
      aria-label={rotulo}
      className="size-4 rounded-xs align-middle"
    />
  );
}

/** Caixa do cabeçalho: marca ou desmarca todas as linhas visíveis; fica no meio-termo quando só algumas estão. */
export function CaixaSelecionarTodos({ ids }: { ids: string[] }) {
  const { selecionados, definir } = useSelecao();
  const ref = useRef<HTMLInputElement>(null);
  const todas = ids.length > 0 && ids.every((id) => selecionados.has(id));
  const algumas = ids.some((id) => selecionados.has(id));
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = algumas && !todas;
  }, [algumas, todas]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={todas}
      onChange={() => definir(ids, !todas)}
      aria-label="Selecionar todas as linhas desta página"
      className="size-4 rounded-xs align-middle"
    />
  );
}

/**
 * Barra que aparece quando há linhas marcadas: diz quantas são e oferece as ações em massa.
 * "Exportar" baixa só as selecionadas. Outras ações vêm por `children` (ex.: mudar status).
 */
export function BarraDeSelecao({
  recurso,
  rotulo,
  children,
}: {
  recurso: string;
  rotulo: [string, string];
  /** Ações a mais (ex.: atribuir responsável): client components que leem a seleção por useSelecao(). */
  children?: ReactNode;
}) {
  const { selecionados, limpar } = useSelecao();
  const n = selecionados.size;
  if (n === 0) return null;
  const ids = [...selecionados];
  return (
    <div className="sticky bottom-4 z-20 mx-4 my-3 flex flex-wrap items-center gap-3 rounded-md bg-superficie px-4 py-2.5 shadow-sm">
      <span className="text-sm font-semibold text-texto">
        {n} {n === 1 ? rotulo[0] : rotulo[1]}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Botao
          href={`/exportar?recurso=${recurso}&ids=${ids.join(",")}`}
          download
          tamanho="pequeno"
          icone={Download}
        >
          Exportar selecionadas
        </Botao>
        {children}
      </div>
      <Botao
        onClick={limpar}
        variante="fantasma"
        tamanho="pequeno"
        icone={X}
        className="ml-auto"
      >
        Limpar seleção
      </Botao>
    </div>
  );
}
