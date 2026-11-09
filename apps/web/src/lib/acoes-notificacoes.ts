"use server";

import type { FiltroDeNotificacoes, ResumoDeNotificacoes } from "@davinci/types";
import { chamarApi } from "./api";

/** Lista as notificações do usuário por aba. Erro (ex.: serviço fora) devolve vazio, sem quebrar a barra. */
export async function listarNotificacoes(
  filtro: FiltroDeNotificacoes,
): Promise<ResumoDeNotificacoes> {
  const r = await chamarApi<ResumoDeNotificacoes>(
    `/notificacoes?filtro=${filtro}`,
    { prazoMs: 5_000 },
  );
  return r.ok ? r.dados : { itens: [], naoLidas: 0 };
}

/** Marca todas as notificações como lidas. */
export async function marcarTodasLidas(): Promise<void> {
  await chamarApi<void>("/notificacoes/marcar-todas", { metodo: "PUT" });
}

/** Marca uma notificação como lida (ao abrir/clicar). */
export async function marcarNotificacaoLida(id: string): Promise<void> {
  await chamarApi<void>(`/notificacoes/${id}/lida`, { metodo: "PUT" });
}
