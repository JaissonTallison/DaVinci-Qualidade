"use client";

import { useActionState } from "react";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import type { EstadoDaAcao } from "@/lib/acao";
import { enviarAvisosAgora } from "@/lib/acoes-sgi";
import { botaoSecundario } from "@/lib/estilos";

export function EnviarAvisos() {
  const [estado, enviar, enviando] = useActionState<
    EstadoDaAcao & { enviados?: number }
  >(enviarAvisosAgora, {});
  return (
    <form action={enviar} className="flex flex-col items-end gap-1">
      <button type="submit" className={botaoSecundario} disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar avisos por e-mail agora"}
      </button>
      {estado.enviados !== undefined && (
        <p role="status" className="text-sm text-texto-2">
          {estado.enviados === 0
            ? "Ninguém tinha prazo vencido ou nos próximos 7 dias."
            : `${estado.enviados} ${estado.enviados === 1 ? "e-mail enviado" : "e-mails enviados"}.`}
        </p>
      )}
      {estado.erro && <AvisoDeErro erro={estado.erro} />}
    </form>
  );
}
