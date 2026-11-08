"use client";

import { useState } from "react";
import { Check, Copy } from "@/components/icones";
import { Botao } from "@/components/botao";

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
    <Botao
      tamanho="pequeno"
      icone={copiado ? Check : Copy}
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
      <span aria-live="polite">{copiado ? "Copiado" : rotulo}</span>
    </Botao>
  );
}
