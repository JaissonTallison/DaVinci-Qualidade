"use client";

import { UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { botaoPrimario, botaoSecundario, campoCompacto } from "@/lib/estilos";
import { useSelecao } from "./selecao-de-linhas";
import { Suspenso } from "./suspenso";

/**
 * Ação em massa: troca o responsável de todas as linhas marcadas de uma vez.
 * Lê a seleção pelo contexto e chama a ação de servidor passada em `acao`.
 * Reutilizável em qualquer lista que tenha um campo de responsável.
 */
export function AtribuirResponsavelEmLote({
  acao,
}: {
  acao: (ids: string[], responsavel: string) => Promise<{ erro?: string }>;
}) {
  const { selecionados, limpar } = useSelecao();
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  return (
    <Suspenso
      rotulo="Atribuir responsável"
      largura="w-72"
      classeDoBotao={botaoSecundario}
      botao={
        <>
          <UserPlus aria-hidden size={16} strokeWidth={2} />
          Atribuir responsável
        </>
      }
    >
      {(fechar) => (
        <form
          className="flex flex-col gap-2 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const n = nome.trim();
            if (!n) return;
            setErro(null);
            iniciar(async () => {
              const r = await acao([...selecionados], n);
              if (r?.erro) {
                setErro(r.erro);
                return;
              }
              setNome("");
              limpar();
              fechar();
            });
          }}
        >
          <label className="text-sm text-texto-2" htmlFor="resp-em-lote">
            Novo responsável para {selecionados.size}{" "}
            {selecionados.size === 1 ? "registro" : "registros"}
          </label>
          <input
            id="resp-em-lote"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={120}
            placeholder="Nome do responsável"
            className={campoCompacto}
            autoFocus
          />
          {erro && <p className="text-xs text-nao-conforme">{erro}</p>}
          <button
            type="submit"
            disabled={pendente || !nome.trim()}
            className={`${botaoPrimario} w-full disabled:opacity-60`}
          >
            {pendente ? "Atribuindo…" : "Atribuir"}
          </button>
        </form>
      )}
    </Suspenso>
  );
}
