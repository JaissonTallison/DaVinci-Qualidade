import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  ehProvedor,
  enderecoDeRetorno,
  prepararIda,
  provedoresAtivos,
} from "@/lib/provedores-externos";
import { COOKIE_EXTERNO, caminhoDeVolta, opcoes } from "@/lib/sessao";

/** Ida ao provedor: guarda state, nonce e PKCE num cookie HttpOnly de 10 minutos e redireciona. */
export async function GET(
  req: NextRequest,
  { params }: RouteContext<"/entrar/externo/[provedor]">,
) {
  const { provedor } = await params;
  if (!ehProvedor(provedor) || !provedoresAtivos().includes(provedor))
    return NextResponse.redirect(new URL("/entrar", req.url));
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
