"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import type { EstadoDaAcao } from "@/lib/acao";
import { criarConvite } from "@/lib/acoes-servicos";
import { botaoSecundario } from "@/lib/estilos";

/** Gera o link da pesquisa para esta OS; a página volta mostrando o link para copiar. */
export function EnviarPesquisa({
  clienteId,
  osId,
  voltar,
}: {
  clienteId: string;
  osId?: string;
  voltar: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoDaAcao, FormData>(
    criarConvite.bind(null, voltar),
    {},
  );
  return (
    <form action={enviar} className="inline-flex flex-col gap-2">
      <input type="hidden" name="clienteId" value={clienteId} />
      {osId && <input type="hidden" name="osId" value={osId} />}
      {estado.erro && <AvisoDeErro erro={estado.erro} />}
      <button type="submit" className={botaoSecundario} disabled={enviando}>
        <Send aria-hidden size={16} strokeWidth={2} />
        {enviando ? "Gerando…" : "Gerar link da pesquisa"}
      </button>
    </form>
  );
}
