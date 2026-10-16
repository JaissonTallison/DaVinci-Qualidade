"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useEstadoDoMenu } from "./estado-do-menu";
import { IconeDaTela, IconeDoGrupo, IconeSeta } from "./icones-do-menu";
import type { GrupoDoMenu } from "./navegacao";
import { COOKIE_GRUPOS_FECHADOS } from "./preferencias-do-menu";

/** Preferência só de interface: cookie (o servidor já desenha o menu certo, sem piscar) por um ano. */
function lembrar(nome: string, valor: string) {
  document.cookie = `${nome}=${encodeURIComponent(valor)}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Menu lateral. Logo com 176 px (abaixo de 160 px a linha "Qualidade e Certificações" fica ilegível).
 * Fundo verde-petróleo (token `menu`): texto claro, item ativo com fundo um pouco mais claro e barra em ouro claro.
 */
const NORMAL =
  "border-transparent text-primaria-texto/75 hover:bg-primaria-texto/10 hover:text-primaria-texto";
const MARCADO =
  "border-ouro-claro bg-primaria-texto/10 font-semibold text-primaria-texto";
/** Lida do package.json da raiz no next.config. */
const VERSAO = process.env.NEXT_PUBLIC_VERSAO ?? "";
const FOCO =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primaria-texto";
export function MenuLateral({
  grupos,
  fechadosIniciais = [],
  permiteCompactar = true,
}: {
  grupos: GrupoDoMenu[];
  fechadosIniciais?: string[];
  /** No celular o menu abre inteiro: não há faixa de ícones. */
  permiteCompactar?: boolean;
}) {
  const atual = usePathname();
  const estado = useEstadoDoMenu();
  const compacto = permiteCompactar && estado.exibirCompacto;
  const [fechados, setFechados] = useState(() => new Set(fechadosIniciais));

  const casa = (href: string) =>
    href === "/"
      ? atual === "/"
      : atual === href || atual.startsWith(`${href}/`);
  // Só o item mais específico fica marcado: em /auditorias/biblioteca, não também "Auditorias"
  const maisEspecifico = grupos
    .flatMap((g) => g.itens.map((i) => i.href))
    .filter(casa)
    .sort((a, b) => b.length - a.length)[0];
  const ativo = (href: string) =>
    href === "/" ? atual === "/" : href === maisEspecifico;

  function alternarGrupo(titulo: string) {
    const novo = new Set(fechados);
    if (novo.has(titulo)) novo.delete(titulo);
    else novo.add(titulo);
    setFechados(novo);
    lembrar(COOKIE_GRUPOS_FECHADOS, [...novo].join("|"));
  }

  const item = (href: string, rotulo: string) => {
    const marcado = ativo(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={marcado ? "page" : undefined}
        className={`flex items-center gap-2 border-l-[3px] py-1.5 pr-3 text-base ${FOCO} pl-[calc(1.75rem-3px)] ${marcado ? MARCADO : NORMAL}`}
      >
        <IconeDaTela href={href} />
        <span className="min-w-0 truncate">{rotulo}</span>
      </Link>
    );
  };

  if (compacto)
    return (
      <nav
        aria-label="Menu principal"
        className="dv-surgir flex h-full w-14 flex-col items-center border-r border-primaria-texto/10 bg-menu py-3"
      >
        <Link href="/" title="Início" className="mb-3 rounded-sm p-1.5">
          <Image
            src="/brand/simbolo-fundo-escuro.svg"
            alt="DaVinci Qualidade"
            width={24}
            height={24}
            className="h-6 w-6"
          />
        </Link>
        <div className="flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto">
          {[
            { titulo: "Início", itens: [{ href: "/", rotulo: "Início" }] },
            ...grupos,
          ].map((g) => {
            const destino = g.itens.find((i) => ativo(i.href)) ?? g.itens[0]!;
            const marcado = g.itens.some((i) => ativo(i.href));
            return (
              <Link
                key={g.titulo}
                href={destino.href}
                title={g.titulo}
                aria-label={g.titulo}
                className={`relative flex h-10 w-10 items-center justify-center rounded-sm border-l-[3px] ${FOCO} ${marcado ? MARCADO : NORMAL}`}
              >
                <IconeDoGrupo titulo={g.titulo} />
              </Link>
            );
          })}
        </div>
        <p
          title={`Versão ${VERSAO}`}
          className="pt-2 text-[10px] text-primaria-texto/50"
        >
          v{VERSAO}
        </p>
      </nav>
    );

  return (
    <nav
      aria-label="Menu principal"
      className={`flex h-full flex-col border-r border-primaria-texto/10 bg-menu ${permiteCompactar ? "w-60" : ""}`}
    >
      <div className="px-4 pt-5 pb-7">
        <Image
          className="h-auto w-[176px]"
          src="/brand/logo-fundo-escuro.svg"
          alt="DaVinci Qualidade"
          width={573}
          height={215}
          priority
        />
      </div>
      <div className="flex-1 overflow-y-auto pb-4 [scrollbar-color:color-mix(in_srgb,var(--color-primaria-texto)_25%,transparent)_transparent] [scrollbar-width:thin]">
        <>
          <Link
            href="/"
            aria-current={ativo("/") ? "page" : undefined}
            className={`flex items-center gap-2.5 border-l-[3px] py-1.5 pr-3 pl-[calc(1rem-3px)] text-base ${FOCO} ${ativo("/") ? MARCADO : NORMAL}`}
          >
            <IconeDoGrupo titulo="Início" />
            Início
          </Link>
          {grupos.map((g) => {
            const temAtivo = g.itens.some((i) => ativo(i.href));
            const aberto = temAtivo || !fechados.has(g.titulo);
            const id = `grupo-${g.titulo.replace(/\W+/g, "-")}`;
            return (
              <section key={g.titulo} className="mt-1">
                <h2>
                  <button
                    type="button"
                    onClick={() => !temAtivo && alternarGrupo(g.titulo)}
                    aria-expanded={aberto}
                    aria-controls={id}
                    className={`flex w-full items-center gap-2.5 py-1.5 pr-3 pl-4 text-left text-base font-semibold ${FOCO} ${temAtivo ? "text-primaria-texto" : "text-primaria-texto/75 hover:bg-primaria-texto/10 hover:text-primaria-texto"}`}
                  >
                    <IconeDoGrupo titulo={g.titulo} />
                    <span className="min-w-0 flex-1 truncate">{g.titulo}</span>
                    {!temAtivo && (
                      <span className="text-primaria-texto/50">
                        <IconeSeta aberto={aberto} />
                      </span>
                    )}
                  </button>
                </h2>
                {aberto && (
                  <div id={id}>
                    {g.itens.map((i) => item(i.href, i.rotulo))}
                  </div>
                )}
              </section>
            );
          })}
        </>
      </div>
      <p className="border-t border-primaria-texto/10 px-4 py-2.5 text-xs text-primaria-texto/50">
        DaVinci Qualidade · versão {VERSAO}
      </p>
    </nav>
  );
}
