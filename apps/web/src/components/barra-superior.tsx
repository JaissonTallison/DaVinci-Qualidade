"use client";

import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  KeyRound,
  LogOut,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import {
  MODULOS_DO_PAINEL,
  type DadosDoUsuario,
  type Prazo,
} from "@davinci/types";
import { sair, trocarEmpresa } from "@/lib/acoes-sessao";
import { alternarFavorito, useFavoritos } from "@/lib/favoritos";
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
 * Barra superior (branco gelo, 64 px, mesmo padrão da Finance): recolher o menu, caminho com a estrela de favorito,
 * busca, "+ Novo", vencidos e o menu da conta (com a troca de empresa).
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
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 bg-superficie px-3 text-texto shadow-cartao sm:px-5 print:hidden">
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
      <Trilha grupos={grupos} usuarioId={eu?.usuario.id} />
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

/**
 * Caminho da página atual (padrão da Finance): MÓDULO › Tela › Detalhe. O módulo leva à primeira tela dele.
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
      <span className="ml-1 hidden truncate text-xs font-semibold tracking-[0.08em] text-texto-2 uppercase sm:inline">
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
  const ultimoTrecho = atual.split("/").pop() ?? "";
  const rotuloDoDetalhe = /^(nova|novo)$/.test(ultimoTrecho)
    ? "Novo registro"
    : "Detalhe";
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
      className="ml-1 hidden min-w-0 items-center gap-1.5 text-sm text-texto-2 sm:flex"
    >
      <Link
        href={achada.g.itens[0]!.href}
        className="truncate text-xs font-semibold tracking-[0.08em] uppercase hover:text-texto"
      >
        {achada.g.titulo}
      </Link>
      {seta}
      {detalhe ? (
        <>
          <Link
            href={achada.i.href}
            className="truncate hover:text-texto hover:underline"
          >
            {achada.i.rotulo}
          </Link>
          {seta}
          <span aria-current="page" className="truncate font-medium text-texto">
            {rotuloDoDetalhe}
          </span>
        </>
      ) : (
        <span aria-current="page" className="truncate font-medium text-texto">
          {achada.i.rotulo}
        </span>
      )}
      {usuarioId && !detalhe && (
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
          className={`ml-1 inline-flex size-7 shrink-0 items-center justify-center rounded-sm hover:bg-superficie-2 ${favorito ? "text-ouro" : "text-texto-3 hover:text-texto"}`}
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

const itemDoMenu =
  "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm text-texto hover:bg-superficie-2 disabled:cursor-default disabled:hover:bg-transparent";

/** Menu da conta (padrão da Finance): quem está logado, troca de empresa, senha e sair. */
function MenuDoUsuario({ eu }: { eu: DadosDoUsuario }) {
  const [ocupado, iniciar] = useTransition();
  const [erro, setErro] = useState<string>();
  return (
    <Suspenso
      rotulo="Conta e empresa"
      largura="w-80"
      classeDoBotao="flex h-11 items-center gap-2.5 rounded-sm pr-2 pl-1 text-left text-texto hover:bg-superficie-2 aria-expanded:bg-superficie-2"
      botao={
        <>
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-acao/12 text-sm font-semibold text-acao"
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
        <div className="p-1.5">
          <div className="flex items-center gap-3 px-2.5 pt-1.5 pb-2.5">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-acao/12 text-sm font-semibold text-acao"
            >
              {iniciais(eu.usuario.nome)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-texto">
                {eu.usuario.nome}
              </span>
              <span className="block truncate text-xs text-texto-2">
                {eu.usuario.email}
              </span>
            </span>
          </div>
          <p className="px-2.5 pt-1 pb-1 text-xs font-semibold tracking-wide text-texto-3 uppercase">
            Empresa
          </p>
          <ul className="flex flex-col gap-px">
            {eu.empresas.map((e) => {
              const atual = e.id === eu.empresa.id;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className={itemDoMenu}
                    disabled={atual || ocupado}
                    aria-current={atual ? "true" : undefined}
                    onClick={() =>
                      iniciar(async () => {
                        setErro(undefined);
                        const r = await trocarEmpresa(e.id);
                        if (r?.erro) setErro(r.erro.mensagem);
                      })
                    }
                  >
                    {atual ? (
                      <Check
                        aria-hidden
                        size={16}
                        strokeWidth={1.75}
                        className="shrink-0 text-acao"
                      />
                    ) : (
                      <Building2
                        aria-hidden
                        size={16}
                        strokeWidth={1.75}
                        className="shrink-0 text-texto-2"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{e.nome}</span>
                      <span className="block font-mono text-xs text-texto-3">
                        {e.cnpj}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {erro && (
            <p role="alert" className="px-2.5 py-1 text-sm text-nao-conforme">
              {erro}
            </p>
          )}
          <hr className="my-1.5 border-borda" />
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
          <hr className="my-1.5 border-borda" />
          <form action={sair}>
            <button type="submit" className={itemDoMenu}>
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
