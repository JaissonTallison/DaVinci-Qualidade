"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEstadoDoMenu } from "./estado-do-menu";
import { IconeDaTela, IconeDoGrupo, IconeSeta } from "./icones-do-menu";
import type { GrupoDoMenu } from "./navegacao";
import { COOKIE_GRUPOS_FECHADOS } from "./preferencias-do-menu";
import { useFavoritos } from "@/lib/favoritos";

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
  usuarioId,
}: {
  grupos: GrupoDoMenu[];
  /** Favoritos são por usuário (estrela na barra superior). */
  usuarioId?: string;
  fechadosIniciais?: string[];
  /** No celular o menu abre inteiro: não há faixa de ícones. */
  permiteCompactar?: boolean;
}) {
  const atual = usePathname();
  const estado = useEstadoDoMenu();
  const compacto = permiteCompactar && estado.exibirCompacto;
  const [fechados, setFechados] = useState(() => new Set(fechadosIniciais));
  const marcados = useFavoritos(usuarioId);
  const todas = grupos.flatMap((g) => g.itens);
  const favoritos = marcados.flatMap((h) =>
    todas.filter((i) => i.href === h).slice(0, 1),
  );
  // Favoritos entram como um grupo a mais, no topo (só quando há algum)
  const comFavoritos: GrupoDoMenu[] = favoritos.length
    ? [{ titulo: "Favoritos", itens: favoritos }, ...grupos]
    : grupos;
  // Recolhido: passar o mouse (ou focar) no ícone do grupo abre ao lado um painel com as telas dele
  const [painelAberto, setPainel] = useState<{
    titulo: string;
    /** Tela em que abriu: mudou de tela, o painel some sozinho. */
    caminho: string;
    topo?: number;
    base?: number;
  } | null>(null);
  const painel = painelAberto?.caminho === atual ? painelAberto : null;
  const fechar = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abrirPainel = (titulo: string, el: HTMLElement) => {
    clearTimeout(fechar.current);
    const q = el.getBoundingClientRect();
    // Na metade de baixo da tela o painel cresce para cima, para não sair da janela
    setPainel(
      q.top > window.innerHeight / 2
        ? { titulo, caminho: atual, base: window.innerHeight - q.bottom }
        : { titulo, caminho: atual, topo: q.top },
    );
  };
  const sairDoPainel = () => {
    clearTimeout(fechar.current);
    fechar.current = setTimeout(() => setPainel(null), 150);
  };
  useEffect(() => {
    if (!painel) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPainel(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [painel]);

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
            ...comFavoritos,
          ].map((g) => {
            const destino = g.itens.find((i) => ativo(i.href)) ?? g.itens[0]!;
            const marcado = g.itens.some((i) => ativo(i.href));
            return (
              <Link
                key={g.titulo}
                href={destino.href}
                aria-label={g.titulo}
                aria-haspopup="menu"
                aria-expanded={painel?.titulo === g.titulo}
                onMouseEnter={(e) => abrirPainel(g.titulo, e.currentTarget)}
                onMouseLeave={sairDoPainel}
                onFocus={(e) => abrirPainel(g.titulo, e.currentTarget)}
                onBlur={sairDoPainel}
                className={`relative flex h-10 w-10 items-center justify-center rounded-sm border-l-[3px] ${FOCO} ${marcado || painel?.titulo === g.titulo ? MARCADO : NORMAL}`}
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
        {/* No <body>: assim nem a rolagem do menu nem o conteúdo da página cobrem o painel */}
        {painel &&
          createPortal(
            <div
              role="menu"
              aria-label={painel.titulo}
              onMouseEnter={() => clearTimeout(fechar.current)}
              onMouseLeave={sairDoPainel}
              style={
                painel.topo !== undefined
                  ? { top: painel.topo }
                  : { bottom: painel.base }
              }
              className="fixed left-[3.75rem] z-50 max-h-[calc(100vh-1rem)] w-max max-w-80 min-w-56 overflow-y-auto rounded-md border border-primaria-texto/10 bg-menu p-1.5 text-primaria-texto shadow-md"
            >
              <p className="px-2.5 pt-1.5 pb-1 text-xs font-semibold tracking-[0.08em] text-primaria-texto/60 uppercase">
                {painel.titulo}
              </p>
              {(painel.titulo === "Início"
                ? [{ href: "/", rotulo: "Início" }]
                : (comFavoritos.find((g) => g.titulo === painel.titulo)
                    ?.itens ?? [])
              ).map((i) => {
                const marcado = ativo(i.href);
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    role="menuitem"
                    aria-current={marcado ? "page" : undefined}
                    onClick={() => setPainel(null)}
                    className={`flex items-center gap-2 rounded-sm border-l-[3px] py-1.5 pr-3 pl-2 text-base ${FOCO} ${marcado ? MARCADO : NORMAL}`}
                  >
                    <IconeDaTela href={i.href} />
                    <span className="min-w-0 truncate">{i.rotulo}</span>
                  </Link>
                );
              })}
            </div>,
            document.body,
          )}
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
          {comFavoritos.map((g) => {
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
