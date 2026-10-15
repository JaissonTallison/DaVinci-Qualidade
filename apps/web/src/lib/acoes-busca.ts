"use server";

import type { Busca } from "@davinci/types";
import { chamarApi } from "./api";

/** Pesquisa geral (Ctrl+K). Termo curto não vai ao servidor. */
export async function pesquisar(
  termo: string,
): Promise<Busca | { erro: string }> {
  const t = termo.trim();
  if (t.length < 2) return { resultados: [], indisponiveis: [] };
  const r = await chamarApi<Busca>(
    `/paineis/busca?termo=${encodeURIComponent(t.slice(0, 80))}`,
  );
  return r.ok ? r.dados : { erro: r.erro.mensagem };
}
