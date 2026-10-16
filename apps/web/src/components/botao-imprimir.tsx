"use client";

import { Printer } from "lucide-react";
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
      <Printer aria-hidden size={16} strokeWidth={2} />
      {rotulo}
    </button>
  );
}
