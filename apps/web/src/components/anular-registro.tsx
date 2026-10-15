"use client";

import { useActionState } from "react";
import type { EstadoDaAcao } from "@/lib/acao";
import { botaoPerigo, campoCompacto } from "@/lib/estilos";

/** "Anular" na linha do histórico: o registro fica visível, riscado, com o motivo. */
export function AnularRegistro({
  id,
  acao,
  pergunta = "Por que anular este registro?",
}: {
  id: string;
  acao: (estado: EstadoDaAcao, form: FormData) => Promise<EstadoDaAcao>;
  pergunta?: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    acao,
    {},
  );
  const erro =
    estado.erro &&
    (estado.erro.detalhes?.[0]?.mensagem ?? estado.erro.mensagem);
  return (
    <details className="relative inline-block text-left" open={Boolean(erro)}>
      <summary className="cursor-pointer list-none text-sm text-texto-2 hover:text-texto hover:underline">
        Anular
      </summary>
      <form
        action={enviar}
        className="absolute right-0 z-10 mt-1 flex w-72 flex-col gap-2 rounded-md border border-borda bg-superficie p-3 shadow-sm"
      >
        <label
          htmlFor={`motivo-${id}`}
          className="text-sm font-semibold text-texto-2"
        >
          {pergunta}
        </label>
        <input
          id={`motivo-${id}`}
          name="motivo"
          maxLength={300}
          defaultValue={estado.valores?.motivo}
          className={`${campoCompacto} w-full`}
        />
        {erro && <span className="text-sm text-nao-conforme">{erro}</span>}
        <button type="submit" className={botaoPerigo} disabled={enviando}>
          Anular registro
        </button>
      </form>
    </details>
  );
}
