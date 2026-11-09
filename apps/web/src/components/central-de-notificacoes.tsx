"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  FILTROS_DE_NOTIFICACOES,
  MODULOS_DA_BUSCA,
  MODULOS_DO_PAINEL,
  type FiltroDeNotificacoes,
  type Notificacao,
  type Prazo,
} from "@davinci/types";
import { Bell, ChevronRight } from "@/components/icones";
import { Botao } from "@/components/botao";
import { Selo } from "@/components/selo";
import { prazoRelativo } from "@/lib/datas";
import {
  listarNotificacoes,
  marcarNotificacaoLida,
  marcarTodasLidas,
} from "@/lib/acoes-notificacoes";
import { IconeDaTela } from "./icones-do-menu";
import { Suspenso } from "./suspenso";

const iconeNaBarra =
  "relative inline-flex size-9 items-center justify-center rounded-campo text-texto-2 transition-colors hover:bg-superficie-2 hover:text-texto aria-expanded:bg-superficie-2 aria-expanded:text-texto";

const ROTULO_ABA: Record<FiltroDeNotificacoes, string> = {
  "nao-lidas": "Não lidas",
  todas: "Todas",
  mencoes: "Menções",
};

/** Item exibido na lista: vem do feed (markável) ou de um prazo vencido (transitório, só leitura). */
type Item = {
  chave: string;
  titulo: string;
  descricao: string | null;
  rodape: string;
  href: string | null;
  tela: string | null;
  nova: boolean;
  idFeed: string | null;
};

/** "há X": tempo decorrido desde a criação, em pt-BR curto. */
function haQuanto(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}

const doFeed = (n: Notificacao): Item => ({
  chave: `n-${n.id}`,
  titulo: n.titulo,
  descricao: n.descricao,
  rodape: [n.modulo ? MODULOS_DA_BUSCA[n.modulo] : null, haQuanto(n.criadaEm)]
    .filter(Boolean)
    .join(" · "),
  href: n.href,
  tela: n.href,
  nova: !n.lida,
  idFeed: n.id,
});

const doPrazo = (p: Prazo, i: number): Item => ({
  chave: `p-${p.href}-${i}`,
  titulo: p.descricao,
  descricao: null,
  rodape: `${MODULOS_DO_PAINEL[p.modulo]} · ${prazoRelativo(p.data)}`,
  href: p.href,
  tela: p.href,
  nova: true,
  idFeed: null,
});

/**
 * Central de notificações (sino da barra superior): abas (não lidas, todas, menções), itens com selo "Nova",
 * marcar todas como lidas e "ver todas". Mostra o feed do usuário; enquanto os eventos dos módulos não
 * alimentam o feed, os prazos vencidos aparecem como itens (transitório).
 */
export function CentralDeNotificacoes({
  prazos,
  naoLidasInicial,
}: {
  prazos: Prazo[];
  naoLidasInicial: number;
}) {
  const [naoLidas, setNaoLidas] = useState(naoLidasInicial);
  const total = naoLidas + prazos.length;
  return (
    <Suspenso
      rotulo={
        total ? `${total} notificações novas` : "Nenhuma notificação nova"
      }
      largura="w-96"
      classeDoBotao={iconeNaBarra}
      botao={
        <>
          <Bell aria-hidden size={18} strokeWidth={1.75} />
          {total > 0 && (
            <span className="absolute top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-nao-conforme px-1 text-center text-xs leading-4 font-semibold text-primaria-texto tabular-nums ring-2 ring-superficie">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </>
      }
    >
      {(fechar) => (
        <Conteudo
          prazos={prazos}
          fechar={fechar}
          aoMudarNaoLidas={setNaoLidas}
        />
      )}
    </Suspenso>
  );
}

function Conteudo({
  prazos,
  fechar,
  aoMudarNaoLidas,
}: {
  prazos: Prazo[];
  fechar: () => void;
  aoMudarNaoLidas: (n: number) => void;
}) {
  const [aba, setAba] = useState<FiltroDeNotificacoes>("nao-lidas");
  const [feed, setFeed] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, iniciar] = useTransition();

  useEffect(() => {
    let vivo = true;
    listarNotificacoes(aba).then((r) => {
      if (!vivo) return;
      setFeed(r.itens);
      aoMudarNaoLidas(r.naoLidas);
      setCarregando(false);
    });
    return () => {
      vivo = false;
    };
  }, [aba, aoMudarNaoLidas]);

  // Prazos entram só nas abas "não lidas" e "todas" (não são menções).
  const comPrazos = aba !== "mencoes";
  const itens: Item[] = [
    ...(comPrazos ? prazos.map(doPrazo) : []),
    ...feed.map(doFeed),
  ];

  const marcarTodas = () =>
    iniciar(async () => {
      await marcarTodasLidas();
      aoMudarNaoLidas(0);
      setFeed((atual) => atual.map((n) => ({ ...n, lida: true })));
      if (aba === "nao-lidas") setFeed([]);
    });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-borda px-4 py-3">
        <h2 className="text-md font-semibold text-texto">Notificações</h2>
        <button
          type="button"
          onClick={marcarTodas}
          disabled={processando}
          className="text-sm font-medium text-info hover:underline disabled:opacity-50"
        >
          Marcar todas como lidas
        </button>
      </div>

      <div className="flex gap-1 border-b border-borda px-2">
        {FILTROS_DE_NOTIFICACOES.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setAba(f)}
            className={`-mb-px border-b-2 px-2.5 py-2 text-sm transition-colors ${
              aba === f
                ? "border-info font-semibold text-texto"
                : "border-transparent text-texto-2 hover:text-texto"
            }`}
          >
            {ROTULO_ABA[f]}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="px-4 py-8 text-center text-sm text-texto-2">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-texto-2">
          {aba === "mencoes"
            ? "Nenhuma menção a você."
            : "Nenhuma notificação por aqui."}
        </p>
      ) : (
        <ul className="max-h-96 overflow-y-auto py-1">
          {itens.map((it) => {
            const corpo = (
              <>
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0 text-base leading-snug font-medium text-texto">
                    {it.titulo}
                  </span>
                  {it.nova && (
                    <Selo tom="info" title="Não lida">
                      Nova
                    </Selo>
                  )}
                </span>
                {it.descricao && (
                  <span className="mt-0.5 block truncate text-sm text-texto-2">
                    {it.descricao}
                  </span>
                )}
                <span className="mt-1 flex items-center gap-1.5 text-xs text-texto-3">
                  {it.tela && (
                    <span className="text-texto-3">
                      <IconeDaTela href={it.tela} size={13} />
                    </span>
                  )}
                  {it.rodape}
                </span>
              </>
            );
            const aoClicar = () => {
              if (it.idFeed) void marcarNotificacaoLida(it.idFeed);
              fechar();
            };
            return (
              <li key={it.chave}>
                {it.href ? (
                  <Link
                    href={it.href}
                    onClick={aoClicar}
                    className="block border-l-[3px] border-transparent px-[calc(1rem-3px)] py-2.5 hover:border-info hover:bg-superficie-2"
                  >
                    {corpo}
                  </Link>
                ) : (
                  <div className="border-l-[3px] border-transparent px-[calc(1rem-3px)] py-2.5">
                    {corpo}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-borda px-4 py-2.5">
        <Botao
          href="/notificacoes"
          variante="link"
          tamanho="pequeno"
          iconeDireita={ChevronRight}
          onClick={fechar}
        >
          Ver todas as notificações
        </Botao>
      </div>
    </div>
  );
}
