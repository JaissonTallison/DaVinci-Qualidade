"use client";

import { Printer } from "@/components/icones";
import { Botao } from "@/components/botao";

/** Abre a impressão do navegador, onde dá para salvar em PDF. */
export function BotaoImprimir({
  rotulo = "Imprimir ou salvar PDF",
}: {
  rotulo?: string;
}) {
  return (
    <Botao
      onClick={() => window.print()}
      variante="primario"
      icone={Printer}
      className="print:hidden"
    >
      {rotulo}
    </Botao>
  );
}
