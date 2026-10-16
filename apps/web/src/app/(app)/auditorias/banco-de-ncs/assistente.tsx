"use client";

import { useState } from "react";
import { BotaoCopiar } from "@/components/botao-copiar";
import { promptsDoAssistente } from "@/lib/assistente-de-nc";
import { areaDeTexto, campo, rotulo } from "@/lib/estilos";

/** Assistente de NC: o auditor escreve o rascunho e copia um dos três prompts já montados com ele. */
export function AssistenteDeNc() {
  const [nc, setNc] = useState("");
  const [requisito, setRequisito] = useState("");
  const prompts = promptsDoAssistente(nc.trim(), requisito.trim());
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[14rem_minmax(0,1fr)]">
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>Norma e cláusula</span>
          <input
            value={requisito}
            onChange={(e) => setRequisito(e.target.value)}
            placeholder="ISO 9001:2026 7.1.5"
            maxLength={60}
            className={campo}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>Rascunho da NC</span>
          <textarea
            value={nc}
            onChange={(e) => setNc(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="O que foi visto, onde e qual registro comprova"
            className={areaDeTexto}
          />
        </label>
      </div>
      <ol className="grid gap-3 lg:grid-cols-3">
        {prompts.map((p) => (
          <li
            key={p.titulo}
            className="flex flex-col rounded-sm border border-borda p-3"
          >
            <p className="font-semibold">{p.titulo}</p>
            <p className="text-sm text-texto-2">{p.uso}</p>
            <pre className="mt-2 max-h-40 flex-1 overflow-auto rounded-xs bg-superficie-2 p-2 font-sans text-xs whitespace-pre-wrap">
              {p.texto}
            </pre>
            <div className="mt-2">
              <BotaoCopiar texto={p.texto} rotulo="Copiar prompt" />
            </div>
          </li>
        ))}
      </ol>
      <p className="text-sm text-texto-3">
        Revise a resposta da IA com os dados reais: o prompt acelera a redação,
        não substitui a evidência.
      </p>
    </div>
  );
}
