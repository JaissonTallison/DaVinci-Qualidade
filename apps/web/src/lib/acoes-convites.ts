"use server";

import { revalidatePath } from "next/cache";
import type { ErroPadrao } from "@davinci/types";
import { chamarApi } from "./api";

export type ResultadoDoConvite = { ok: true } | { ok: false; erro: ErroPadrao };

async function responder(
  id: string,
  acao: "aceitar" | "recusar",
): Promise<ResultadoDoConvite> {
  const r = await chamarApi<{ aceito?: true; recusado?: true }>(
    `/auth/convites/${encodeURIComponent(id)}/${acao}`,
    { metodo: "POST" },
  );
  if (!r.ok) return { ok: false, erro: r.erro };
  // O aceite muda as empresas do usuário e some com o aviso: recarrega a casca.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function aceitarConvite(id: string): Promise<ResultadoDoConvite> {
  return responder(id, "aceitar");
}

export async function recusarConvite(id: string): Promise<ResultadoDoConvite> {
  return responder(id, "recusar");
}
