"use server";

import { revalidatePath } from "next/cache";
import { chamarApi } from "@/lib/api";

/** Troca o responsável das NCs selecionadas (seleção em massa) e recarrega a lista. */
export async function atribuirResponsavelNcEmLote(
  ids: string[],
  responsavel: string,
): Promise<{ erro?: string }> {
  const r = await chamarApi("/nao-conformidades/responsavel-em-lote", {
    metodo: "POST",
    corpo: { ids, responsavel },
  });
  if (!r.ok) return { erro: r.erro.mensagem };
  revalidatePath("/qualidade/nao-conformidades");
  return {};
}
