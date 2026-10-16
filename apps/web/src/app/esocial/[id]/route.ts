import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/lib/api-url";
import { COOKIE_ACESSO } from "@/lib/sessao";

/** Download do XML de um evento do eSocial, com o token do cookie (a permissão é conferida no gateway). */
export async function GET(
  req: NextRequest,
  { params }: RouteContext<"/esocial/[id]">,
) {
  const { id } = await params;
  const token = req.cookies.get(COOKIE_ACESSO)?.value;
  if (!token) return NextResponse.redirect(new URL("/entrar", req.url));
  const res = await fetch(
    `${API_URL}/esocial/eventos/${encodeURIComponent(id)}/xml`,
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
        ? "Evento não encontrado."
        : "Sem permissão para baixar este evento.",
      {
        status: res.status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      },
    );
  return new NextResponse(res.body, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "content-disposition":
        res.headers.get("content-disposition") ?? "attachment",
      "x-content-type-options": "nosniff",
    },
  });
}
