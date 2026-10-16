import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  ehProvedor,
  enderecoDeRetorno,
  prepararIda,
  provedoresAtivos,
} from "@/lib/provedores-externos";
import { PROVEDORES_EXTERNOS } from "@davinci/types";
import {
  COOKIE_EXTERNO,
  COOKIE_RECUSA,
  caminhoDeVolta,
  opcoes,
} from "@/lib/sessao";

/** Ida ao provedor: guarda state, nonce e PKCE num cookie HttpOnly de 10 minutos e redireciona. */
export async function GET(
  req: NextRequest,
  { params }: RouteContext<"/entrar/externo/[provedor]">,
) {
  const { provedor } = await params;
  if (!ehProvedor(provedor))
    return NextResponse.redirect(new URL("/entrar", req.url));
  // O botão aparece sempre; sem o aplicativo registrado, volta com o aviso em vez de falhar no provedor
  if (!provedoresAtivos().includes(provedor)) {
    (await cookies()).set({
      name: COOKIE_RECUSA,
      value: `Entrar com ${PROVEDORES_EXTERNOS[provedor]} ainda não está disponível. Use o e-mail e a senha.`,
      ...opcoes(new Date(Date.now() + 60_000).toISOString()),
    });
    return NextResponse.redirect(new URL("/entrar", req.url));
  }
  const { url, ida } = prepararIda(
    provedor,
    enderecoDeRetorno(provedor, req.nextUrl.origin),
    caminhoDeVolta(req.nextUrl.searchParams.get("volta")),
    req.nextUrl.searchParams.get("lembrar") === "1",
  );
  (await cookies()).set({
    name: COOKIE_EXTERNO,
    value: JSON.stringify(ida),
    ...opcoes(new Date(Date.now() + 10 * 60_000).toISOString()),
  });
  return NextResponse.redirect(url);
}
