"use client";

import { useActionState } from "react";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import type { EstadoDaAcao } from "@/lib/acao";
import { importarCatalogo } from "@/lib/acoes-esg";
import { botaoSecundario } from "@/lib/estilos";

/** Importar o catálogo de referência (gestor). Rodar de novo só cria os temas que faltam. */
export function ImportarCatalogo({ rotulo }: { rotulo: string }) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    () => importarCatalogo(),
    {},
  );
  return (
    <form action={enviar} className="flex flex-col items-start gap-2">
      {estado.erro && <AvisoDeErro erro={estado.erro} />}
      <button type="submit" className={botaoSecundario} disabled={enviando}>
        {enviando ? "Importando…" : rotulo}
      </button>
    </form>
  );
}
