import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BotaoCopiar } from "@/components/botao-copiar";
import { ChevronRight } from "@/components/icones";
import { painel, tituloDaPagina } from "@/lib/estilos";

export type DetalheDoErro = { rotulo: string; valor: string; mono?: boolean };

/**
 * Tela de erro (interface.md §7.3): código em mono, título em linguagem comum, causa provável,
 * ações e detalhes técnicos copiáveis para o suporte. Sem ilustração, sem número gigante, sem "Ops!".
 */
export function PaginaDeErro({
  codigo,
  titulo,
  texto,
  acoes,
  detalhes = [],
  atalhos = [],
}: {
  codigo: string;
  titulo: string;
  texto: string;
  acoes: ReactNode;
  detalhes?: DetalheDoErro[];
  /** Acessos frequentes (só no 404). */
  atalhos?: { href: string; rotulo: string; modulo: string }[];
}) {
  const paraCopiar = detalhes.map((d) => `${d.rotulo}: ${d.valor}`).join("\n");
  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <p className="font-mono text-sm text-texto-2">{codigo}</p>
      <h1 className={`${tituloDaPagina} mt-1`}>{titulo}</h1>
      <p className="mt-2 max-w-xl text-md text-texto-2">{texto}</p>
      <div className="mt-6 flex flex-wrap gap-3">{acoes}</div>
      {atalhos.length > 0 && (
        <nav aria-labelledby="atalhos-titulo" className="mt-8">
          <h2
            id="atalhos-titulo"
            className="text-sm font-semibold text-texto-2"
          >
            Acessos frequentes
          </h2>
          <ul className="mt-2 divide-y divide-borda border-y border-borda">
            {atalhos.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="flex items-center justify-between gap-3 py-2.5 text-base text-texto hover:text-info"
                >
                  {a.rotulo}
                  <span className="inline-flex items-center gap-1 text-sm text-texto-3">
                    {a.modulo}
                    <ChevronRight aria-hidden size={14} strokeWidth={1.75} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {detalhes.length > 0 && (
        <section aria-labelledby="detalhes-titulo" className={`${painel} mt-8`}>
          <div className="flex items-center justify-between gap-3 border-b border-borda py-2 pr-2 pl-4">
            <h2
              id="detalhes-titulo"
              className="text-sm font-semibold text-texto-2"
            >
              Detalhes técnicos
            </h2>
            <BotaoCopiar texto={paraCopiar} rotulo="Copiar detalhes" />
          </div>
          <dl className="divide-y divide-borda text-sm">
            {detalhes.map((d) => (
              <div
                key={d.rotulo}
                className="grid gap-1 px-4 py-2.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4"
              >
                <dt className="text-texto-2">{d.rotulo}</dt>
                <dd
                  className={`break-all text-texto ${d.mono ? "font-mono" : ""}`}
                >
                  {d.valor}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

/** Moldura de página independente (sem menu): erro fora do sistema ou quando o sistema não carrega. */
export function MolduraIndependente({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-fundo">
      <header className="flex h-16 items-center bg-menu px-6">
        <Link href="/" aria-label="DaVinci Qualidade: início">
          <Image
            src="/brand/logo-fundo-escuro.svg"
            alt="DaVinci Qualidade"
            width={150}
            height={40}
            className="h-10 w-auto"
          />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6">
        {children}
      </main>
      <footer className="border-t border-borda bg-superficie px-6 py-3 text-xs text-texto-3">
        DaVinci Qualidade
      </footer>
    </div>
  );
}
