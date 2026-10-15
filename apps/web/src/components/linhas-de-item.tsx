"use client";

import { useState } from "react";
import { MAXIMO_DE_ITENS } from "@davinci/types";
import { botaoSecundario, campoCompacto, erroDoCampo } from "@/lib/estilos";

/**
 * Itens a verificar: "o que verificar" e "critério de aceitação", em linhas. Vão como `item_verificar` e
 * `item_criterio` repetidos; linha vazia é ignorada. Erros chegam como `itens.<linha>.<campo>`.
 */
export function LinhasDeItem({
  valores,
  erros,
  minimo = 3,
}: {
  valores?: { verificar: string; criterio?: string | null }[];
  erros: Record<string, string>;
  minimo?: number;
}) {
  const [linhas, setLinhas] = useState(Math.max(valores?.length ?? 0, minimo));
  return (
    <div className="flex flex-col gap-2">
      <div className="hidden gap-2 text-xs text-texto-2 sm:flex">
        <span className="w-8" />
        <span className="flex-[3]">O que verificar</span>
        <span className="flex-[2]">Critério de aceitação (opcional)</span>
      </div>
      {Array.from({ length: linhas }, (_, i) => (
        <div
          key={i}
          className="flex flex-wrap items-start gap-2 sm:flex-nowrap"
        >
          <span className="w-8 pt-2 text-right text-sm text-texto-3">
            {i + 1}.
          </span>
          <div className="flex min-w-60 flex-[3] flex-col gap-1">
            <input
              name="item_verificar"
              aria-label={`Item ${i + 1}: o que verificar`}
              defaultValue={valores?.[i]?.verificar}
              maxLength={300}
              className={`${campoCompacto} w-full`}
              aria-invalid={Boolean(erros[`itens.${i}.verificar`])}
            />
            {erros[`itens.${i}.verificar`] && (
              <span className={erroDoCampo}>
                {erros[`itens.${i}.verificar`]}
              </span>
            )}
          </div>
          <input
            name="item_criterio"
            aria-label={`Item ${i + 1}: critério`}
            defaultValue={valores?.[i]?.criterio ?? ""}
            maxLength={300}
            className={`${campoCompacto} min-w-48 flex-[2]`}
          />
        </div>
      ))}
      {linhas < MAXIMO_DE_ITENS && (
        <div className="pl-10">
          <button
            type="button"
            onClick={() => setLinhas((n) => n + 1)}
            className={botaoSecundario}
          >
            Incluir item
          </button>
        </div>
      )}
    </div>
  );
}
