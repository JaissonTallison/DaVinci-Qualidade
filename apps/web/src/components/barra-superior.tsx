"use client";

import { Bell, ChevronDown, KeyRound, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MODULOS_DO_PAINEL,
  type DadosDoUsuario,
  type Prazo,
} from "@davinci/types";
import { sair } from "@/lib/acoes-sessao";
import { prazoRelativo } from "@/lib/datas";
import { BotaoAbrirGaveta, BotaoRecolherMenu } from "./estado-do-menu";
import { IconeDaTela } from "./icones-do-menu";
import { LinhaDePrazo, telaDoIcone, textoDoSelo } from "./linha-de-prazo";
import { Pesquisa } from "./pesquisa";
import type { AtalhoDeCriacao, GrupoDoMenu } from "./navegacao";
import { Suspenso } from "./suspenso";

/** Botão na barra: fundo só no passar do mouse. */
const naBarra =
  "flex h-9 items-center gap-1.5 rounded-sm px-2 text-sm text-texto hover:bg-superficie-2 focus-visible:outline-2 focus-visible:outline-info aria-expanded:bg-superficie-2";

/**
 * Barra superior (branco gelo, 56 px): recolher o menu, trilha da página, "+ Novo", vencidos e o menu do usuário.
 * Abaixo de 1024 px: símbolo da marca no lugar do recolher; no tablet, botão da gaveta; no celular o "Novo" vai
 * para o "+" da barra inferior.
 * O ouro continua só no menu lateral e na logo (interface.md §7).
 */
export function BarraSuperior({
  eu,
  grupos,
  atalhos,
  vencidos,
}: {
  eu?: DadosDoUsuario;
  grupos: GrupoDoMenu[];
  atalhos: AtalhoDeCriacao[];
  /** Prazos vencidos dos módulos que a pessoa vê. */
  vencidos: Prazo[];
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-borda bg-barra px-3 text-texto sm:px-4 print:hidden">
      <BotaoRecolherMenu />
      <BotaoAbrirGaveta />
      <Link href="/" aria-label="Início" className="shrink-0 lg:hidden">
        <Image
          src="/brand/simbolo.svg"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7"
        />
      </Link>
      <Trilha grupos={grupos} />
      <span className="flex-1" />
      <Pesquisa grupos={grupos} />
      {atalhos.length > 0 && (
        <div className="hidden md:block">
          <Suspenso
            rotulo="Criar novo registro"
            largura="w-64"
            classeDoBotao="flex h-9 items-center gap-1.5 rounded-sm border border-borda-forte px-3 text-sm font-semibold text-texto hover:bg-superficie-2 aria-expanded:bg-superficie-2"
            botao={
              <>
                Novo
                <ChevronDown
                  aria-hidden
                  size={16}
                  strokeWidth={1.75}
                  className="text-texto-2"
                />
              </>
            }
          >
            {(fechar) => (
              <ul className="max-h-[70vh] overflow-y-auto py-1">
                {atalhos.map((a) => (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      onClick={fechar}
                      className="flex items-center gap-2.5 px-3 py-2 text-base text-texto hover:bg-superficie-2"
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
            )}
          </Suspenso>
        </div>
      )}
      {eu?.permissoes.includes("paineis.ver") && <Sino vencidos={vencidos} />}
      {eu && <MenuDoUsuario eu={eu} />}
    </header>
  );
}

/** "Grupo › Tela" da página atual; o grupo leva à primeira tela dele. */
function Trilha({ grupos }: { grupos: GrupoDoMenu[] }) {
  const atual = usePathname();
  if (atual === "/")
    return (
      <span className="ml-1 hidden truncate text-sm font-semibold sm:inline">
        Início
      </span>
    );
  const telas = grupos
    .flatMap((g) => g.itens.map((i) => ({ g, i })))
    .sort((a, b) => b.i.href.length - a.i.href.length);
  const achada = telas.find(
    ({ i }) => atual === i.href || atual.startsWith(`${i.href}/`),
  );
  if (!achada) return null;
  const detalhe = atual !== achada.i.href;
  return (
    <nav
      aria-label="Você está em"
      className="ml-1 hidden min-w-0 items-center gap-1.5 text-sm sm:flex"
    >
      <Link
        href={achada.g.itens[0]!.href}
        className="truncate text-texto-2 hover:text-texto hover:underline"
      >
        {achada.g.titulo}
      </Link>
      <span aria-hidden className="text-texto-3">
        ›
      </span>
      {detalhe ? (
        <Link
          href={achada.i.href}
          className="truncate text-texto-2 hover:text-texto hover:underline"
        >
          {achada.i.rotulo}
        </Link>
      ) : (
        <span aria-current="page" className="truncate font-semibold">
          {achada.i.rotulo}
        </span>
      )}
    </nav>
  );
}

function Sino({ vencidos }: { vencidos: Prazo[] }) {
  const n = vencidos.length;
  return (
    <Suspenso
      rotulo={
        n
          ? `${n} ${n === 1 ? "prazo vencido" : "prazos vencidos"}`
          : "Nenhum prazo vencido"
      }
      largura="w-80 sm:w-96"
      classeDoBotao={`${naBarra} relative`}
      botao={
        <>
          <Bell aria-hidden size={18} strokeWidth={1.75} />
          {n > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] rounded-sm bg-nao-conforme px-1 text-center text-xs font-semibold text-primaria-texto tabular-nums">
              {n > 99 ? "99+" : n}
            </span>
          )}
        </>
      }
    >
      {(fechar) => (
        <div>
          <p className="border-b border-borda px-4 py-2.5 text-sm font-semibold text-texto">
            {n
              ? `${n} ${n === 1 ? "prazo vencido" : "prazos vencidos"}`
              : "Nenhum prazo vencido"}
          </p>
          {n > 0 && (
            <ul className="max-h-80 divide-y divide-borda overflow-y-auto">
              {vencidos.slice(0, 8).map((p, i) => (
                <li key={`${p.href}-${p.tipo}-${i}`}>
                  <LinhaDePrazo
                    compacta
                    aoClicar={fechar}
                    href={p.href}
                    icone={telaDoIcone(p.tipo, p.href)}
                    titulo={`${p.tipo}: ${p.descricao}`}
                    detalhe={MODULOS_DO_PAINEL[p.modulo]}
                    selo={textoDoSelo(prazoRelativo(p.data))}
                    tom="vencido"
                  />
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/paineis/vencimentos"
            onClick={fechar}
            className="block border-t border-borda px-4 py-2.5 text-sm font-semibold text-info hover:bg-superficie-2"
          >
            Abrir o painel de vencimentos
          </Link>
        </div>
      )}
    </Suspenso>
  );
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return (
    (partes[0]?.[0] ?? "") +
    (partes.length > 1 ? partes[partes.length - 1]![0] : "")
  ).toUpperCase();
}

function MenuDoUsuario({ eu }: { eu: DadosDoUsuario }) {
  return (
    <Suspenso
      rotulo="Menu do usuário"
      largura="w-64"
      classeDoBotao="flex h-11 items-center gap-2.5 rounded-sm pr-2 pl-1 text-left text-texto hover:bg-superficie-2 aria-expanded:bg-superficie-2"
      botao={
        <>
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primaria text-sm font-semibold text-primaria-texto"
          >
            {iniciais(eu.usuario.nome)}
          </span>
          <span className="hidden min-w-0 leading-tight md:block">
            <span className="block max-w-48 truncate text-sm font-semibold">
              {eu.usuario.nome}
            </span>
            <span className="block max-w-48 truncate text-xs text-texto-2">
              {eu.empresa.nome}
            </span>
          </span>
          <ChevronDown
            aria-hidden
            size={16}
            strokeWidth={1.75}
            className="hidden text-texto-2 md:block"
          />
        </>
      }
    >
      {(fechar) => (
        <div>
          <div className="border-b border-borda px-4 py-3">
            <p className="truncate text-sm font-semibold text-texto">
              {eu.usuario.nome}
            </p>
            <p className="truncate text-xs text-texto-2">{eu.usuario.email}</p>
            <p className="mt-1 truncate text-xs text-texto-3">
              {eu.empresa.nome}
            </p>
          </div>
          <Link
            href="/trocar-senha?origem=conta"
            onClick={fechar}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-texto hover:bg-superficie-2"
          >
            <KeyRound
              aria-hidden
              size={16}
              strokeWidth={1.75}
              className="text-texto-2"
            />
            Trocar a senha
          </Link>
          <form action={sair} className="border-t border-borda">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-texto hover:bg-superficie-2"
            >
              <LogOut
                aria-hidden
                size={16}
                strokeWidth={1.75}
                className="text-texto-2"
              />
              Sair
            </button>
          </form>
        </div>
      )}
    </Suspenso>
  );
}
