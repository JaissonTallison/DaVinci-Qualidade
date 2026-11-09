"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  KeyRound,
  LogOut,
  Star,
} from "@/components/icones";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState, useTransition } from "react";
import {
  RECURSOS,
  type DadosDoUsuario,
  type Prazo,
} from "@davinci/types";
import { sair, trocarEmpresa } from "@/lib/acoes-sessao";
import { alternarFavorito, useFavoritos } from "@/lib/favoritos";
import { botaoSecundario, sobretitulo } from "@/lib/estilos";
import { BotaoAbrirGaveta, BotaoRecolherMenu } from "./estado-do-menu";
import { CentralDeNotificacoes } from "./central-de-notificacoes";
import { IconeDaTela } from "./icones-do-menu";
import { Pesquisa } from "./pesquisa";
import type { AtalhoDeCriacao, GrupoDoMenu } from "./navegacao";
import { Suspenso } from "./suspenso";

/**
 * Sub-telas que não têm item no menu lateral, mas aparecem na trilha do topo (nomeadas e com volta),
 * acessadas por um botão ou link dentro de outra tela.
 */
const SUBTELAS: { href: string; rotulo: string }[] = [];


/** Item de menu suspenso do design system: 36 px, canto de 8 px, ícone de 16 px em texto-2. */
const itemDoMenu =
  "flex min-h-9 w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-base text-texto transition-colors hover:bg-superficie-2 disabled:cursor-default";

/**
 * Barra superior do design system (56 px, superficie, linha de baixo), igual em todas as telas autenticadas:
 * recolher o menu, trilha (com a estrela de favorito), busca de 300 px com Ctrl K, "Novo", sino dos prazos
 * vencidos e o menu do usuário com a empresa ativa sempre à vista (interface.md §7.1).
 * Abaixo de 1024 px: símbolo da marca no lugar do recolher; no tablet, botão da gaveta; no celular o "Novo" vai
 * para o "+" da barra inferior.
 */
export function BarraSuperior({
  eu,
  grupos,
  atalhos,
  vencidos,
  naoLidas,
}: {
  eu?: DadosDoUsuario;
  grupos: GrupoDoMenu[];
  atalhos: AtalhoDeCriacao[];
  /** Prazos vencidos dos módulos que a pessoa vê (fonte transitória da central). */
  vencidos: Prazo[];
  /** Notificações não lidas do usuário (contador do sino). */
  naoLidas: number;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-borda bg-superficie pr-3 pl-3 text-texto shadow-xs sm:pr-5 print:hidden">
      <BotaoRecolherMenu />
      <BotaoAbrirGaveta />
      <span
        aria-hidden
        className="hidden h-6 w-px shrink-0 bg-borda md:block"
      />
      <Link href="/" aria-label="Início" className="shrink-0 lg:hidden">
        <Image
          src="/brand/simbolo.svg"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7"
        />
      </Link>
      <Trilha grupos={grupos} usuarioId={eu?.usuario.id} />
      <span className="flex-1" />
      <Pesquisa grupos={grupos} />
      {atalhos.length > 0 && (
        <div className="hidden md:block">
          <Suspenso
            rotulo="Criar novo registro"
            largura="w-64"
            classeDoBotao={`${botaoSecundario} aria-expanded:bg-superficie-2`}
            botao={
              <>
                Novo
                <ChevronDown
                  aria-hidden
                  size={16}
                  strokeWidth={1.75}
                  className="-mr-1 text-texto-2"
                />
              </>
            }
          >
            {(fechar) => (
              <ul className="max-h-[70vh] overflow-y-auto p-1.5">
                <li className={`${sobretitulo} px-2.5 pt-1.5 pb-1`}>
                  Criar novo
                </li>
                {atalhos.map((a) => (
                  <li key={a.href}>
                    <Link href={a.href} onClick={fechar} className={itemDoMenu}>
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-afundado text-texto-2 shadow-xs">
                        <IconeDaTela
                          href={a.href.replace(/\/(nova|novo)$/, "")}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate leading-tight">
                          {a.rotulo}
                        </span>
                        <span className="block truncate text-xs text-texto-2">
                          {a.recurso ? RECURSOS[a.recurso].nome : "Cadastros"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Suspenso>
        </div>
      )}
      {eu && (
        <CentralDeNotificacoes prazos={vencidos} naoLidasInicial={naoLidas} />
      )}
      {eu && <MenuDoUsuario eu={eu} />}
    </header>
  );
}

/**
 * Trilha do design system: Módulo › Tela › Detalhe, na mesma caixa em todos os níveis (13 px); o item atual em
 * texto 500, os anteriores são links. O módulo leva à primeira tela dele.
 * A tela principal pode virar favorito (estrela); registros (detalhe, novo) não.
 */
function Trilha({
  grupos,
  usuarioId,
}: {
  grupos: GrupoDoMenu[];
  usuarioId?: string;
}) {
  const atual = usePathname();
  const favoritos = useFavoritos(usuarioId);
  if (atual === "/")
    return (
      <span
        aria-current="page"
        className="hidden truncate text-sm font-medium text-texto sm:inline"
      >
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
  // Sub-tela dentro de um item do menu, nomeada na trilha do topo mesmo sem ter item próprio.
  const sub = SUBTELAS.find(
    (s) =>
      (atual === s.href || atual.startsWith(`${s.href}/`)) &&
      s.href.length > achada.i.href.length,
  );
  const base = sub?.href ?? achada.i.href;
  const detalhe = atual !== base;
  const ultimoTrecho = atual.split("/").pop() ?? "";
  const rotuloDoDetalhe = /^(nova|novo)$/.test(ultimoTrecho)
    ? "Novo registro"
    : "Detalhe";
  // Passos depois do módulo; o último (sem href) é a página atual.
  const passos: { rotulo: string; href?: string }[] = [
    {
      rotulo: achada.i.rotulo,
      href: atual === achada.i.href ? undefined : achada.i.href,
    },
  ];
  if (sub)
    passos.push({
      rotulo: sub.rotulo,
      href: atual === sub.href ? undefined : sub.href,
    });
  if (detalhe) passos.push({ rotulo: rotuloDoDetalhe });
  const naTelaPrincipal = atual === achada.i.href;
  const favorito = favoritos.includes(achada.i.href);
  const seta = (
    <ChevronRight
      aria-hidden
      size={14}
      strokeWidth={1.75}
      className="shrink-0 text-texto-3"
    />
  );
  return (
    <nav
      aria-label="Você está em"
      className="hidden min-w-0 items-center gap-1.5 text-sm whitespace-nowrap text-texto-2 sm:flex"
    >
      <Link
        href={achada.g.itens[0]!.href}
        className="truncate hover:text-texto hover:underline"
      >
        {achada.g.titulo}
      </Link>
      {passos.map((p, idx) => (
        <Fragment key={idx}>
          {seta}
          {p.href ? (
            <Link
              href={p.href}
              className="truncate hover:text-texto hover:underline"
            >
              {p.rotulo}
            </Link>
          ) : (
            <span
              aria-current="page"
              className="truncate font-medium text-texto"
            >
              {p.rotulo}
            </span>
          )}
        </Fragment>
      ))}
      {usuarioId && naTelaPrincipal && (
        <button
          type="button"
          aria-pressed={favorito}
          title={
            favorito ? "Tirar dos favoritos" : "Fixar nos favoritos do menu"
          }
          aria-label={
            favorito ? "Tirar dos favoritos" : "Fixar nos favoritos do menu"
          }
          onClick={() => alternarFavorito(usuarioId, achada.i.href)}
          className={`ml-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-campo transition-colors hover:bg-superficie-2 ${favorito ? "text-ouro" : "text-texto-3 hover:text-texto"}`}
        >
          <Star
            aria-hidden
            size={16}
            strokeWidth={1.75}
            fill={favorito ? "currentColor" : "none"}
          />
        </button>
      )}
    </nav>
  );
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return (
    (partes[0]?.[0] ?? "") +
    (partes.length > 1 ? partes[partes.length - 1]![0] : "")
  ).toUpperCase();
}

/** Avatar do design system: círculo de 32 px (40 no cabeçalho do menu) em azul suave, com as iniciais. */
function Avatar({ nome, grande = false }: { nome: string; grande?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-info-suave font-semibold text-info ${grande ? "size-10 text-sm" : "size-8 text-xs"}`}
    >
      {iniciais(nome)}
    </span>
  );
}

/** Menu do usuário: quem está logado, empresa ativa (troca com CNPJ e check na atual), senha e sair. */
function MenuDoUsuario({ eu }: { eu: DadosDoUsuario }) {
  const [ocupado, iniciar] = useTransition();
  const [erro, setErro] = useState<string>();
  return (
    <Suspenso
      rotulo={`Conta de ${eu.usuario.nome}, empresa ${eu.empresa.nome}`}
      largura="w-75"
      classeDoBotao="flex h-11 items-center gap-2.5 rounded-md pr-2 pl-1 text-left text-texto transition-colors hover:bg-superficie-2 aria-expanded:bg-superficie-2"
      botao={
        <>
          <Avatar nome={eu.usuario.nome} />
          <span className="hidden min-w-0 md:block">
            <span className="block max-w-45 truncate text-sm leading-[18px] font-semibold">
              {eu.usuario.nome}
            </span>
            <span className="block max-w-45 truncate text-xs text-texto-2">
              {eu.empresa.nome}
            </span>
          </span>
          <ChevronsUpDown
            aria-hidden
            size={14}
            strokeWidth={1.75}
            className="hidden text-texto-3 md:block"
          />
        </>
      }
    >
      {(fechar) => (
        <div className="p-1.5">
          <div className="flex items-center gap-2.5 px-2.5 pt-2 pb-2.5">
            <Avatar nome={eu.usuario.nome} grande />
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold text-texto">
                {eu.usuario.nome}
              </span>
              <span className="block truncate text-xs text-texto-2">
                {eu.usuario.email}
              </span>
            </span>
          </div>
          <hr className="-mx-1.5 my-1.5 border-borda" />
          <p className={`${sobretitulo} px-2.5 pt-2 pb-1`}>Empresa ativa</p>
          <ul role="group" aria-label="Empresa ativa">
            {eu.empresas.map((e) => {
              const atual = e.id === eu.empresa.id;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={atual}
                    className={`${itemDoMenu} ${atual ? "font-semibold" : ""}`}
                    disabled={atual || ocupado}
                    onClick={() =>
                      iniciar(async () => {
                        setErro(undefined);
                        const r = await trocarEmpresa(e.id);
                        if (r?.erro) setErro(r.erro.mensagem);
                      })
                    }
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{e.nome}</span>
                      <span className="block font-mono text-xs font-normal text-texto-2">
                        {e.cnpj}
                      </span>
                    </span>
                    {atual && (
                      <Check
                        aria-hidden
                        size={16}
                        strokeWidth={1.75}
                        className="shrink-0 text-info"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {erro && (
            <p
              role="alert"
              className="px-2.5 py-1 text-sm text-nao-conforme-texto"
            >
              {erro}
            </p>
          )}
          <hr className="-mx-1.5 my-1.5 border-borda" />
          <Link
            href="/trocar-senha?origem=conta"
            onClick={fechar}
            className={itemDoMenu}
          >
            <KeyRound
              aria-hidden
              size={16}
              strokeWidth={1.75}
              className="text-texto-2"
            />
            Alterar senha
          </Link>
          <hr className="-mx-1.5 my-1.5 border-borda" />
          <form action={sair}>
            <button
              type="submit"
              className={`${itemDoMenu} text-nao-conforme-texto hover:bg-nao-conforme-suave`}
            >
              <LogOut aria-hidden size={16} strokeWidth={1.75} />
              Sair
            </button>
          </form>
        </div>
      )}
    </Suspenso>
  );
}
