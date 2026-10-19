"use server";

import { revalidatePath } from "next/cache";
import { chamarApi } from "@/lib/api";

/** Troca o responsável das OS selecionadas (seleção em massa) e recarrega a lista. */
export async function atribuirResponsavelOsEmLote(
  ids: string[],
  responsavel: string,
): Promise<{ erro?: string }> {
  const r = await chamarApi("/ordens-de-servico/responsavel-em-lote", {
    metodo: "POST",
    corpo: { ids, responsavel },
  });
  if (!r.ok) return { erro: r.erro.mensagem };
  revalidatePath("/servicos/ordens");
  return {};
}
