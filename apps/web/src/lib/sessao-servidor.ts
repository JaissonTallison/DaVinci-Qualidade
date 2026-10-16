import { cookies } from "next/headers";
import type { Sessao } from "@davinci/types";
import {
  COOKIE_ACESSO,
  COOKIE_CONFIAVEL,
  COOKIE_LEMBRAR,
  COOKIE_RENOVACAO,
  DIAS_LEMBRAR,
  cookiesDaSessao,
  opcoes,
} from "./sessao";

/*
 * Gravar e apagar os cookies da sessão. Fica FORA dos arquivos "use server" de propósito:
 * exportada de lá, viraria uma ação que o navegador poderia chamar com qualquer sessão.
 * Use só dentro de Server Actions e Route Handlers.
 */

/** "Lembrar de mim", escolhido no login: vale para esta sessão e para as renovações dela. */
export async function guardarLembrar(lembrar: boolean) {
  const loja = await cookies();
  if (!lembrar) return loja.delete(COOKIE_LEMBRAR);
  loja.set({
    name: COOKIE_LEMBRAR,
    value: "1",
    ...opcoes(new Date(Date.now() + DIAS_LEMBRAR * 86_400_000).toISOString()),
  });
}

/** Grava os tokens respeitando o "Lembrar de mim" já guardado (login, 2FA, troca de senha). */
export async function gravarSessao(sessao: Sessao) {
  const loja = await cookies();
  // Pelo valor, não por has(): logo depois de um delete, o cookie apagado ainda aparece (vazio)
  const lembrar = loja.get(COOKIE_LEMBRAR)?.value === "1";
  for (const c of cookiesDaSessao(sessao, lembrar)) loja.set(c);
  if (sessao.navegadorConfiavel)
    loja.set({
      name: COOKIE_CONFIAVEL,
      value: sessao.navegadorConfiavel.token,
      ...opcoes(sessao.navegadorConfiavel.expiraEm),
    });
}

export async function limparSessao() {
  const loja = await cookies();
  loja.delete(COOKIE_ACESSO);
  loja.delete(COOKIE_RENOVACAO);
}
