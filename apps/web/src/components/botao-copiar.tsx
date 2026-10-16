"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { botaoSecundario } from "@/lib/estilos";

/** Copia o texto para a área de transferência e confirma por 2 segundos. */
export function BotaoCopiar({
  texto,
  rotulo = "Copiar",
}: {
  texto: string;
  rotulo?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className={`${botaoSecundario} h-8 text-sm`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          setCopiado(false);
        }
      }}
    >
      {copiado ? (
        <Check aria-hidden size={14} strokeWidth={2} />
      ) : (
        <Copy aria-hidden size={14} strokeWidth={2} />
      )}
      <span aria-live="polite">{copiado ? "Copiado" : rotulo}</span>
    </button>
  );
}
