import { NextResponse, type NextRequest } from "next/server";
import { urlPublica } from "@/lib/endereco-do-sistema";
import { COOKIE_ACESSO, COOKIE_RENOVACAO, caminhoDeVolta } from "@/lib/sessao";

/**
 * O gateway recusou a sessão (encerrada em outro lugar, acesso removido, senha trocada…).
 * Apaga os cookies AQUI (página não pode apagar cookie) e leva ao login. Sem isto, o token
 * ainda "no prazo" faria /entrar devolver a pessoa ao sistema, e o sistema de volta ao login (laço).
 */
export function GET(req: NextRequest) {
  const destino = urlPublica(req, "/entrar");
  destino.searchParams.set("aviso", "sessao-encerrada");
  const volta = caminhoDeVolta(req.nextUrl.searchParams.get("volta"));
  if (volta !== "/") destino.searchParams.set("volta", volta);
  const res = NextResponse.redirect(destino);
  res.cookies.delete(COOKIE_ACESSO);
  res.cookies.delete(COOKIE_RENOVACAO);
  return res;
}
