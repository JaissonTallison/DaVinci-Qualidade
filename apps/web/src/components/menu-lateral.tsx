"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { GrupoDoMenu } from "./navegacao";

/** Menu lateral claro. Logo com 176 px: abaixo de 160 px a linha "Qualidade e Certificações" fica ilegível (logos). O item ativo tem a barra em ouro: o único ouro da tela (interface.md §7). */
export function MenuLateral({ grupos }: { grupos: GrupoDoMenu[] }) {
  const atual = usePathname();
  const item = (href: string, rotulo: string) => {
    const ativo =
      href === "/"
        ? atual === "/"
        : atual === href || atual.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        aria-current={ativo ? "page" : undefined}
        className={`block border-l-[3px] py-1.5 pr-3 pl-[calc(1rem-3px)] text-base ${ativo ? "border-ouro bg-superficie-2 font-semibold text-texto" : "border-transparent text-texto-2 hover:bg-superficie-2 hover:text-texto"}`}
      >
        {rotulo}
      </Link>
    );
  };
  return (
    <nav
      aria-label="Menu principal"
      className="flex h-full flex-col border-r border-borda bg-superficie"
    >
      <div className="px-4 py-4">
        <Image
          className="h-auto w-[176px] dark:hidden"
          src="/brand/logo.svg"
          alt="DaVinci Qualidade"
          width={573}
          height={215}
          priority
        />
        <Image
          className="hidden h-auto w-[176px] dark:block"
          src="/brand/logo-fundo-escuro.svg"
          alt="DaVinci Qualidade"
          width={573}
          height={215}
          priority
        />
      </div>
      <div className="flex-1 overflow-y-auto pb-6">
        {item("/", "Início")}
        {grupos.map((g) => (
          <section key={g.titulo} className="mt-5">
            <h2 className="px-4 pb-1 font-sans text-xs font-semibold text-texto-3">
              {g.titulo}
            </h2>
            {g.itens.map((i) => (
              <div key={i.href}>{item(i.href, i.rotulo)}</div>
            ))}
          </section>
        ))}
      </div>
    </nav>
  );
}
