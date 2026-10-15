"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MODULOS_DA_BUSCA, type ResultadoDaBusca } from "@davinci/types";
import { pesquisar } from "@/lib/acoes-busca";
import { IconeDaTela } from "./icones-do-menu";
import type { GrupoDoMenu } from "./navegacao";

type Item = {
  href: string;
  titulo: string;
  detalhe: string | null;
  secao: string;
  tela?: string;
};

const semAcento = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Pesquisa geral: botão na barra superior e Ctrl+K (⌘K no Mac). Janela no centro com telas do menu e registros
 * de todos os módulos que a pessoa vê. Setas escolhem, Enter abre, Esc fecha.
 */
export function Pesquisa({ grupos }: { grupos: GrupoDoMenu[] }) {
  const [aberta, setAberta] = useState(false);
  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberta((a) => !a);
      }
    };
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, []);
  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        className="flex h-9 min-w-0 items-center gap-2 rounded-sm border border-borda-forte bg-superficie px-3 text-sm text-texto-2 hover:bg-superficie-2 hover:text-texto sm:w-64 lg:w-80"
      >
        <Search aria-hidden size={16} strokeWidth={1.75} className="shrink-0" />
        <span className="hidden flex-1 truncate text-left sm:inline">
          Pesquisar registros e telas…
        </span>
        <kbd className="hidden rounded-xs border border-borda px-1.5 text-texto-3 font-mono text-xs sm:inline">
          Ctrl K
        </kbd>
      </button>
      {aberta && <Janela grupos={grupos} fechar={() => setAberta(false)} />}
    </>
  );
}

function Janela({
  grupos,
  fechar,
}: {
  grupos: GrupoDoMenu[];
  fechar: () => void;
}) {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [resposta, setResposta] = useState<{
    termo: string;
    registros: ResultadoDaBusca[];
    aviso: string | null;
  }>({ termo: "", registros: [], aviso: null });
  const [marcado, setMarcado] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const t = termo.trim();
  // Só vale a resposta do termo que está no campo: resposta atrasada de outro termo é ignorada
  const atual = resposta.termo === t && t.length >= 2 ? resposta : null;
  const aviso = atual?.aviso ?? null;
  const buscando = t.length >= 2 && !atual;

  useEffect(() => campo.current?.focus(), []);

  // Pesquisa nos registros 250 ms depois de parar de digitar
  useEffect(() => {
    if (t.length < 2) return;
    const espera = setTimeout(async () => {
      const r = await pesquisar(t);
      setResposta(
        "erro" in r
          ? { termo: t, registros: [], aviso: r.erro }
          : {
              termo: t,
              registros: r.resultados,
              aviso: r.indisponiveis.length
                ? `Sem resposta de: ${r.indisponiveis.map((m) => MODULOS_DA_BUSCA[m]).join(", ")}.`
                : null,
            },
      );
    }, 250);
    return () => clearTimeout(espera);
  }, [t]);

  const itens: Item[] = useMemo(() => {
    const busca = semAcento(t);
    const telas: Item[] = busca
      ? grupos.flatMap((g) =>
          g.itens
            .filter((i) => semAcento(`${i.rotulo} ${g.titulo}`).includes(busca))
            .map((i) => ({
              href: i.href,
              titulo: i.rotulo,
              detalhe: g.titulo,
              secao: "Telas",
              tela: i.href,
            })),
        )
      : [];
    const registros = atual?.registros ?? [];
    return [
      ...telas.slice(0, 6),
      ...registros.map((r) => ({
        href: r.href,
        titulo: r.titulo,
        detalhe: r.detalhe,
        secao: `${r.tipo} · ${MODULOS_DA_BUSCA[r.modulo]}`,
      })),
    ];
  }, [t, atual, grupos]);

  const escolhido = Math.min(marcado, Math.max(itens.length - 1, 0));

  const abrir = (href: string) => {
    fechar();
    router.push(href);
  };

  let secaoAnterior = "";
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-primaria/40 px-4 pt-[12vh]"
      onMouseDown={(e) => e.target === e.currentTarget && fechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pesquisar"
        className="w-full max-w-xl overflow-hidden rounded-md border border-borda bg-superficie text-texto shadow-md"
      >
        <div className="flex items-center gap-2 border-b border-borda px-4">
          <Search
            aria-hidden
            size={18}
            strokeWidth={1.75}
            className="shrink-0 text-texto-3"
          />
          <input
            ref={campo}
            type="search"
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setMarcado(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") fechar();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setMarcado(Math.min(escolhido + 1, itens.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setMarcado(Math.max(escolhido - 1, 0));
              }
              if (e.key === "Enter" && itens[marcado])
                abrir(itens[marcado].href);
            }}
            placeholder="NC, funcionário, instrumento, PT, terceiro, tela…"
            aria-label="Pesquisar"
            autoComplete="off"
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-texto outline-none placeholder:text-texto-3"
          />
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="rounded-sm p-1 text-texto-3 hover:bg-superficie-2 hover:text-texto"
          >
            <X aria-hidden size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {t.length < 2 ? (
            <p className="px-4 py-6 text-sm text-texto-3">
              Digite ao menos 2 letras: número, nome, TAG, CNPJ, local…
            </p>
          ) : itens.length === 0 ? (
            <p className="px-4 py-6 text-sm text-texto-3">
              {buscando ? "Pesquisando…" : "Nada encontrado."}
            </p>
          ) : (
            <ul role="listbox" aria-label="Resultados" className="py-1">
              {itens.map((it, i) => {
                const titulo = it.secao !== secaoAnterior ? it.secao : null;
                secaoAnterior = it.secao;
                return (
                  <li
                    key={`${it.href}-${i}`}
                    role="option"
                    aria-selected={i === escolhido}
                  >
                    {titulo && (
                      <p className="px-4 pt-3 pb-1 text-xs font-semibold text-texto-3">
                        {titulo}
                      </p>
                    )}
                    <button
                      type="button"
                      onMouseEnter={() => setMarcado(i)}
                      onClick={() => abrir(it.href)}
                      className={`flex w-full items-center gap-2.5 border-l-[3px] px-[calc(1rem-3px)] py-2 text-left ${i === escolhido ? "border-info bg-superficie-2" : "border-transparent"}`}
                    >
                      {it.tela && (
                        <span className="text-texto-2">
                          <IconeDaTela href={it.tela} />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-base text-texto">
                          {it.titulo}
                        </span>
                        {it.detalhe && (
                          <span className="block truncate text-xs text-texto-3">
                            {it.detalhe}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {aviso && (
            <p className="border-t border-borda px-4 py-2 text-xs text-atencao">
              {aviso}
            </p>
          )}
        </div>
        <p className="border-t border-borda bg-superficie-2 px-4 py-2 text-xs text-texto-3">
          ↑ ↓ para escolher · Enter para abrir · Esc para fechar
        </p>
      </div>
    </div>
  );
}
