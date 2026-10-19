"use client";

import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Suspenso } from "./suspenso";

/** Classe dos itens do menu de ações (links ou botões), para ficarem iguais em todas as telas. */
export const itemDeAcao =
  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-texto hover:bg-campo";

/**
 * Menu "⋯" de ações de uma linha da tabela. Abre ao clicar, fecha ao clicar fora, com Esc ou ao escolher.
 * Os itens (Abrir, Imprimir, Arquivar…) vêm como links/botões de quem usa. Fica acima do link da linha
 * (coloque o `<td>` com z-10) para não disparar a navegação da linha ao abrir o menu.
 */
export function AcoesDaLinha({
  rotulo = "Ações",
  children,
}: {
  rotulo?: string;
  children: ReactNode;
}) {
  return (
    <Suspenso
      rotulo={rotulo}
      largura="w-48"
      classeDoBotao="inline-flex size-8 items-center justify-center rounded-sm text-texto-3 hover:bg-campo hover:text-texto"
      botao={<MoreHorizontal aria-hidden size={18} strokeWidth={2} />}
    >
      {() => <div className="py-1">{children}</div>}
    </Suspenso>
  );
}
