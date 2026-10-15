import { cookies } from "next/headers";
import type { Sessao } from "@davinci/types";
import {
  COOKIE_ACESSO,
  COOKIE_CONFIAVEL,
  COOKIE_RENOVACAO,
  cookiesDaSessao,
  opcoes,
} from "./sessao";

/*
 * Gravar e apagar os cookies da sessão. Fica FORA dos arquivos "use server" de propósito:
 * exportada de lá, viraria uma ação que o navegador poderia chamar com qualquer sessão.
 * Use só dentro de Server Actions e Route Handlers.
 */

export async function gravarSessao(sessao: Sessao) {
  const loja = await cookies();
  for (const c of cookiesDaSessao(sessao)) loja.set(c);
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
