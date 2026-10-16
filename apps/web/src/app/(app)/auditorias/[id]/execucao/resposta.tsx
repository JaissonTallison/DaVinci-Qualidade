"use client";

import { useActionState } from "react";
import {
  RESPOSTAS_DA_PERGUNTA,
  type PerguntaDaAuditoria,
} from "@davinci/types";
import { responderPergunta, type EstadoDaAcao } from "@/lib/acoes-auditorias";
import { areaDeTexto, botaoSecundario, campoCompacto } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Resposta da pergunta: status e a evidência objetiva verificada (documento, número, data). */
export function RespostaDaPergunta({
  auditoriaId,
  pergunta: p,
  podeEditar,
}: {
  auditoriaId: string;
  pergunta: PerguntaDaAuditoria;
  podeEditar: boolean;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    responderPergunta.bind(null, auditoriaId, p.codigo),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={enviar} noValidate className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="resposta"
          defaultValue={v.resposta ?? p.resposta}
          disabled={!podeEditar}
          aria-label="Resposta"
          className={`${campoCompacto} w-44`}
        >
          {Object.entries(RESPOSTAS_DA_PERGUNTA).map(([k, n]) => (
            <option key={k} value={k}>
              {n}
            </option>
          ))}
        </select>
        {podeEditar && (
          <button type="submit" className={botaoSecundario} disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar resposta"}
          </button>
        )}
        {estado.erro && !estado.erro.detalhes?.length && (
          <span className="text-sm text-nao-conforme">
            {estado.erro.mensagem}
          </span>
        )}
      </div>
      <textarea
        name="evidencia"
        rows={2}
        maxLength={1000}
        defaultValue={v.evidencia ?? p.evidencia ?? ""}
        disabled={!podeEditar}
        placeholder="Evidência objetiva verificada: documento, número, data, o que foi observado"
        aria-label="Evidência objetiva"
        aria-invalid={Boolean(erros.evidencia)}
        className={areaDeTexto}
      />
      {erros.evidencia && (
        <p className="text-sm text-nao-conforme">{erros.evidencia}</p>
      )}
    </form>
  );
}
