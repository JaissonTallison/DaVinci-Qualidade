"use server";

import { revalidatePath } from "next/cache";
import type { ChaveCriada, ErroPadrao } from "@davinci/types";
import { chamarApi } from "./api";

const ROTA = "/integracoes/api";

export type EstadoNovaChave = {
  erro?: ErroPadrao;
  /** A chave criada vem só uma vez, para mostrar e copiar. */
  chave?: ChaveCriada;
  /** Mantém o que a pessoa digitou quando dá erro. */
  nome?: string;
};

/** Cria uma chave de API da empresa. A chave em claro só volta aqui, uma vez. */
export async function criarChave(
  _estado: EstadoNovaChave,
  form: FormData,
): Promise<EstadoNovaChave> {
  const nome = String(form.get("nome") ?? "").trim();
  const r = await chamarApi<ChaveCriada>("/integracoes/chaves", {
    metodo: "POST",
    corpo: { nome },
  });
  if (!r.ok) return { erro: r.erro, nome };
  revalidatePath(ROTA);
  return { chave: r.dados };
}

/** Revoga uma chave: para de ser aceita na hora. */
export async function revogarChave(
  id: string,
): Promise<{ erro?: ErroPadrao }> {
  const r = await chamarApi<void>(`/integracoes/chaves/${id}`, {
    metodo: "DELETE",
  });
  if (!r.ok) return { erro: r.erro };
  revalidatePath(ROTA);
  return {};
}
