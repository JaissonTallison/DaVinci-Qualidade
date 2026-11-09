"use server";

import { revalidatePath } from "next/cache";
import type { ConfigDeIntegracoes, ErroPadrao } from "@davinci/types";
import { chamarApi } from "./api";

export type EstadoWebhook = {
  erro?: ErroPadrao;
  ok?: boolean;
  valores?: { url: string; ativo: boolean };
};

/** Salva a config do webhook da empresa (URL + ativo). O envio em si virá depois. */
export async function salvarWebhook(
  _estado: EstadoWebhook,
  form: FormData,
): Promise<EstadoWebhook> {
  const url = String(form.get("url") ?? "").trim();
  const ativo = form.get("ativo") === "on";
  const r = await chamarApi<ConfigDeIntegracoes>("/integracoes/config/webhook", {
    metodo: "PUT",
    corpo: { url, ativo },
  });
  if (!r.ok) return { erro: r.erro, valores: { url, ativo } };
  revalidatePath("/integracoes/webhook");
  return {
    ok: true,
    valores: { url: r.dados.webhook.url ?? "", ativo: r.dados.webhook.ativo },
  };
}

export type EstadoIa = { erro?: ErroPadrao; ok?: boolean };

/** Salva o provedor de IA e, se vier preenchida, a chave (guardada cifrada). */
export async function salvarIaConfig(
  _estado: EstadoIa,
  form: FormData,
): Promise<EstadoIa> {
  const provedor = String(form.get("provedor") ?? "");
  const chave = String(form.get("chave") ?? "").trim();
  const corpo: Record<string, unknown> = { provedor };
  if (chave) corpo.chave = chave;
  const r = await chamarApi<ConfigDeIntegracoes>("/integracoes/config/ia", {
    metodo: "PUT",
    corpo,
  });
  if (!r.ok) return { erro: r.erro };
  revalidatePath("/ia");
  return { ok: true };
}
