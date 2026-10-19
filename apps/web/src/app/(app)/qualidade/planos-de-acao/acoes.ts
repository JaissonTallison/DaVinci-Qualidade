"use server";

import { revalidatePath } from "next/cache";
import { chamarApi } from "@/lib/api";

/** Troca o responsável dos planos selecionados (seleção em massa) e recarrega a lista. */
export async function atribuirResponsavelPlanoEmLote(
  ids: string[],
  responsavel: string,
): Promise<{ erro?: string }> {
  const r = await chamarApi("/planos-de-acao/responsavel-em-lote", {
    metodo: "POST",
    corpo: { ids, responsavel },
  });
  if (!r.ok) return { erro: r.erro.mensagem };
  revalidatePath("/qualidade/planos-de-acao");
  return {};
}
