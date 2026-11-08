"use client";

import { useActionState } from "react";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import type { EstadoDaAcao } from "@/lib/acao";
import { enviarAvisosAgora } from "@/lib/acoes-sgi";
import { Send } from "@/components/icones";
import { Botao } from "@/components/botao";

export function EnviarAvisos() {
  const [estado, enviar, enviando] = useActionState<
    EstadoDaAcao & { enviados?: number }
  >(enviarAvisosAgora, {});
  return (
    <form action={enviar} className="flex flex-col items-end gap-1">
      <Botao
        type="submit"
        carregando={enviando}
        textoCarregando="Enviando…"
        icone={Send}
      >
        Enviar avisos agora
      </Botao>
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
