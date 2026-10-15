import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api-url";
import { COOKIE_ACESSO } from "@/lib/sessao";

/**
 * Download de anexo: o navegador não fala com o gateway, então o arquivo passa por aqui com o token do cookie.
 * A permissão é conferida no gateway (módulo dono do registro).
 */
export async function GET(
  req: NextRequest,
  { params }: RouteContext<"/anexos/[id]">,
) {
  const { id } = await params;
  const token = req.cookies.get(COOKIE_ACESSO)?.value;
  if (!token) return NextResponse.redirect(new URL("/entrar", req.url));
  const res = await fetch(
    `${API_URL}/anexos/${encodeURIComponent(id)}/conteudo`,
    {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (res.status === 401)
    return NextResponse.redirect(new URL("/sessao-encerrada", req.url));
  if (!res.ok)
    return new NextResponse(
      res.status === 404
        ? "Anexo não encontrado."
        : "Sem permissão para ver este anexo.",
      {
        status: res.status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      },
    );
  return new NextResponse(res.body, {
    status: 200,
    headers: {
      "content-type":
        res.headers.get("content-type") ?? "application/octet-stream",
      "content-disposition":
        res.headers.get("content-disposition") ?? "attachment",
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-store",
    },
  });
}
