"use client";

import { CalendarClock, TriangleAlert, House, Menu, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useEstadoDoMenu } from "./estado-do-menu";
import { IconeDaTela } from "./icones-do-menu";
import type { AtalhoDeCriacao } from "./navegacao";

/**
 * Barra inferior do celular (< 768 px), como nos aplicativos: Início · NCs · + · Vencimentos · Menu. O "+" abre os
 * mesmos registros do botão Novo; Menu abre a gaveta com o sistema inteiro. Atalho sem permissão não aparece.
 */
export function BarraInferior({
  atalhos,
  verNcs,
  verVencimentos,
}: {
  atalhos: AtalhoDeCriacao[];
  verNcs: boolean;
  verVencimentos: boolean;
}) {
  const caminho = usePathname();
  const { abrirGaveta } = useEstadoDoMenu();
  // Aberta só na página em que foi aberta: navegar fecha, sem efeito para isso
  const [abertaEm, setAbertaEm] = useState<string | null>(null);
  const folha = abertaEm === caminho;
  const setFolha = (aberta: boolean) => setAbertaEm(aberta ? caminho : null);
  useEffect(() => {
    if (!folha) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbertaEm(null);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [folha]);

  const ativo = (href: string) =>
    href === "/"
      ? caminho === "/"
      : caminho === href || caminho.startsWith(`${href}/`);
  const botao =
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-xs";
  const link = (href: string, rotulo: string, Icone: LucideIcon) => {
    const atual = ativo(href);
    return (
      <Link
        href={href}
        aria-current={atual ? "page" : undefined}
        className={`${botao} ${atual ? "font-semibold text-menu" : "text-texto-2"}`}
      >
        <Icone aria-hidden size={22} strokeWidth={atual ? 2.25 : 1.75} />
        <span className="truncate">{rotulo}</span>
      </Link>
    );
  };

  return (
    <>
      <nav
        aria-label="Navegação"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-barra pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
      >
        <div className="flex h-16 items-stretch">
          {link("/", "Início", House)}
          {verNcs && link("/qualidade/nao-conformidades", "NCs", TriangleAlert)}
          {atalhos.length > 0 && (
            <div className="flex flex-1 items-center justify-center">
              <button
                type="button"
                aria-label="Criar novo registro"
                aria-haspopup="dialog"
                aria-expanded={folha}
                onClick={() => setFolha(true)}
                className="flex size-11 items-center justify-center rounded-md bg-menu text-primaria-texto active:opacity-90"
              >
                <Plus aria-hidden size={22} strokeWidth={2} />
              </button>
            </div>
          )}
          {verVencimentos &&
            link("/paineis/vencimentos", "Vencimentos", CalendarClock)}
          <button
            type="button"
            onClick={() => abrirGaveta(true)}
            className={`${botao} text-texto-2`}
          >
            <Menu aria-hidden size={22} strokeWidth={1.75} />
            <span>Menu</span>
          </button>
        </div>
      </nav>
      {folha && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            aria-hidden
            onClick={() => setFolha(false)}
            className="absolute inset-0 bg-texto/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Criar novo registro"
            className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-md border-t border-borda bg-superficie pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-md"
          >
            <div
              aria-hidden
              className="mx-auto mb-2 h-1 w-10 rounded-xs bg-borda-forte"
            />
            <p className="px-5 pb-2 text-xs font-semibold tracking-[0.08em] text-texto-2 uppercase">
              Novo
            </p>
            <ul>
              {atalhos.map((a) => (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="flex h-12 items-center gap-3 px-5 text-base text-texto active:bg-superficie-2"
                  >
                    <span className="text-texto-2">
                      <IconeDaTela
                        href={a.href.replace(/\/(nova|novo)$/, "")}
                      />
                    </span>
                    {a.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
