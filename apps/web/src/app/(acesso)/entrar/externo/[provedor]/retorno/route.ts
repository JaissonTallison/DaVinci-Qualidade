import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { ehDesafio2fa, type RespostaLogin } from "@davinci/types";
import { chamarApi } from "@/lib/api";
import {
  enderecoDeRetorno,
  lerIda,
  trocarCodigo,
} from "@/lib/provedores-externos";
import {
  COOKIE_CONFIAVEL,
  COOKIE_DESAFIO,
  COOKIE_EXTERNO,
  COOKIE_RECUSA,
  opcoes,
} from "@/lib/sessao";
import { gravarSessao, guardarLembrar } from "@/lib/sessao-servidor";

/**
 * Volta do provedor: confere o state, troca o código pelo id_token e pede a sessão ao gateway.
 * Daí em diante é igual ao login por senha (2FA, senha provisória, destino).
 */
export async function GET(
  req: NextRequest,
  { params }: RouteContext<"/entrar/externo/[provedor]/retorno">,
) {
  const { provedor } = await params;
  const loja = await cookies();
  const ida = lerIda(loja.get(COOKIE_EXTERNO)?.value);
  loja.delete(COOKIE_EXTERNO);
  const busca = req.nextUrl.searchParams;
  const recusar: (mensagem: string) => never = (mensagem) => {
    loja.set({
      name: COOKIE_RECUSA,
      value: mensagem,
      ...opcoes(new Date(Date.now() + 60_000).toISOString()),
    });
    return redirect("/entrar");
  };

  // Desistiu na tela do provedor: volta sem aviso
  if (busca.get("error") === "access_denied") redirect("/entrar");
  const codigo = busca.get("code");
  if (
    !ida ||
    ida.provedor !== provedor ||
    !codigo ||
    busca.get("state") !== ida.state
  )
    recusar("O login demorou demais ou foi interrompido. Tente de novo.");

  const idToken = await trocarCodigo(
    ida,
    codigo,
    enderecoDeRetorno(ida.provedor, req.nextUrl.origin),
  );
  if (!idToken)
    recusar("O provedor não confirmou o login. Tente de novo em instantes.");

  const r = await chamarApi<RespostaLogin>("/auth/login/externo", {
    metodo: "POST",
    corpo: {
      provedor: ida.provedor,
      idToken,
      nonce: ida.nonce,
      navegadorConfiavel: loja.get(COOKIE_CONFIAVEL)?.value,
    },
    publica: true,
  });
  if (!r.ok) recusar(r.erro.mensagem);
  await guardarLembrar(ida.lembrar);
  const volta = ida.volta;
  if (ehDesafio2fa(r.dados)) {
    loja.set({
      name: COOKIE_DESAFIO,
      value: r.dados.desafio2fa,
      ...opcoes(r.dados.expiraEm),
    });
    redirect(
      `/entrar/codigo${volta !== "/" ? `?volta=${encodeURIComponent(volta)}` : ""}`,
    );
  }
  await gravarSessao(r.dados);
  redirect(r.dados.usuario.deveTrocarSenha ? "/trocar-senha" : volta);
}
