"use client";

import { Printer } from "@/components/icones";
import { botaoPrimario } from "@/lib/estilos";

/** Abre a impressão do navegador, onde dá para salvar em PDF. */
export function BotaoImprimir({
  rotulo = "Imprimir ou salvar PDF",
}: {
  rotulo?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`${botaoPrimario} print:hidden`}
    >
      <Printer aria-hidden size={16} strokeWidth={1.75} />
      {rotulo}
    </button>
  );
}
