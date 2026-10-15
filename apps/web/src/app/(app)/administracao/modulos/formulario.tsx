"use client";

import { useActionState } from "react";
import { RECURSOS, TODOS_OS_RECURSOS, type Recurso } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarModulos } from "@/lib/acoes-administracao";
import { botaoPrimario, painel } from "@/lib/estilos";

export function FormularioDeModulos({ ligados }: { ligados: Recurso[] }) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarModulos,
    {},
  );
  return (
    <form action={acao} className={`${painel} mt-6 p-5`}>
      {estado.erro && (
        <div className="mb-5">
          <AvisoDeErro erro={estado.erro} />
        </div>
      )}
      <ul className="flex flex-col divide-y divide-borda">
        {TODOS_OS_RECURSOS.map((r) => {
          const def = RECURSOS[r];
          return (
            <li key={r} className="py-3 first:pt-0">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="recursos"
                  value={r}
                  defaultChecked={ligados.includes(r)}
                  className="mt-1.5"
                />
                <span>
                  <span className="block text-base font-semibold text-texto">
                    {def.nome}
                  </span>
                  <span className="block text-sm text-texto-2">
                    {def.descricao}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-5">
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar módulos"}
        </button>
      </div>
    </form>
  );
}
