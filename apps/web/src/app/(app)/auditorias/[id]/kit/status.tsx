"use client";

import { useState, useTransition } from "react";
import { STATUS_DO_ITEM_DO_KIT, type StatusDoItemDoKit } from "@davinci/types";
import { marcarItemDoKit } from "@/lib/acoes-auditorias";
import { campoCompacto } from "@/lib/estilos";

/** Status do item: grava ao trocar, sem botão. */
export function StatusDoItem({
  auditoriaId,
  codigo,
  status,
  descricao,
  desabilitado,
}: {
  auditoriaId: string;
  codigo: string;
  status: StatusDoItemDoKit;
  descricao: string;
  desabilitado: boolean;
}) {
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <select
        defaultValue={status}
        disabled={desabilitado || salvando}
        aria-label={`Status: ${descricao}`}
        onChange={(e) => {
          const novo = e.target.value as StatusDoItemDoKit;
          setErro(null);
          iniciar(async () => {
            const r = await marcarItemDoKit(auditoriaId, codigo, novo);
            if (r) setErro(r);
          });
        }}
        className={`${campoCompacto} w-40`}
      >
        {Object.entries(STATUS_DO_ITEM_DO_KIT).map(([k, n]) => (
          <option key={k} value={k}>
            {n}
          </option>
        ))}
      </select>
      {erro && <p className="text-sm text-nao-conforme">{erro}</p>}
    </div>
  );
}
