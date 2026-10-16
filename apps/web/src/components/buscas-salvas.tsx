"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { botaoLink, campoCompacto } from "@/lib/estilos";

type Busca = { nome: string; consulta: string };

const EVENTO = "buscas-salvas";
function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}
function assinar(aviso: () => void) {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO, aviso);
  };
}

/**
 * Filtros com nome, guardados neste navegador, para reaplicar na próxima auditoria.
 * Conveniência de quem usa: não vai para o servidor e some se o navegador limpar os dados do site.
 */
export function BuscasSalvas() {
  const caminho = usePathname();
  const params = useSearchParams();
  const chave = `buscas-salvas:${caminho}`;
  const bruto = useSyncExternalStore(
    assinar,
    () => ler(chave),
    () => null,
  );
  const buscas = useMemo<Busca[]>(() => {
    try {
      return bruto ? (JSON.parse(bruto) as Busca[]) : [];
    } catch {
      return [];
    }
  }, [bruto]);
  const [nome, setNome] = useState("");
  const atual = new URLSearchParams(params);
  atual.delete("aviso");
  const consulta = atual.toString();

  const gravar = (lista: Busca[]) => {
    try {
      localStorage.setItem(chave, JSON.stringify(lista));
      window.dispatchEvent(new Event(EVENTO));
    } catch {
      /* armazenamento indisponível (janela privada, dados bloqueados): segue sem salvar */
    }
  };

  if (!consulta && buscas.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-borda px-4 py-2 text-sm">
      <span className="text-texto-2">Buscas salvas:</span>
      {buscas.map((b) => (
        <span
          key={b.nome}
          className="inline-flex items-center gap-1 rounded-sm bg-superficie-2 px-2 py-0.5"
        >
          <Link
            href={`${caminho}?${b.consulta}`}
            className="text-info hover:underline"
          >
            {b.nome}
          </Link>
          <button
            type="button"
            aria-label={`Apagar a busca ${b.nome}`}
            onClick={() => gravar(buscas.filter((x) => x.nome !== b.nome))}
            className="text-texto-3 hover:text-texto"
          >
            <X aria-hidden size={12} />
          </button>
        </span>
      ))}
      {consulta && (
        <form
          className="ml-auto flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = nome.trim();
            if (!n) return;
            gravar([
              ...buscas.filter((x) => x.nome !== n),
              { nome: n, consulta },
            ]);
            setNome("");
          }}
        >
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={40}
            placeholder="Nome deste filtro"
            aria-label="Nome do filtro"
            className={`${campoCompacto} h-8 w-44`}
          />
          <button type="submit" className={`${botaoLink} text-sm`}>
            Salvar filtro
          </button>
        </form>
      )}
    </div>
  );
}
