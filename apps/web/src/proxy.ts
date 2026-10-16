import { NextResponse, type NextRequest } from "next/server";
import type { Sessao } from "@davinci/types";
import { API_URL } from "@/lib/api-url";
import {
  COOKIE_ACESSO,
  COOKIE_LEMBRAR,
  COOKIE_RENOVACAO,
  MARGEM_DE_RENOVACAO_MS,
  caminhoDeVolta,
  cookiesDaSessao,
  lerToken,
} from "@/lib/sessao";

const ENTRAR = "/entrar";
const TROCAR_SENHA = "/trocar-senha";

/**
 * Antes de cada página: renova a sessão quando o token de acesso está para vencer,
 * manda quem não está logado para /entrar e quem tem senha inicial pendente para /trocar-senha.
 * (Perfil que exige 2FA ainda sem ativar: o gateway recusa as chamadas; a tela de segurança da conta vem depois.)
 * A permissão de verdade é sempre conferida pelo gateway; aqui é só navegação.
 */
export async function proxy(req: NextRequest) {
  const caminho = req.nextUrl.pathname;
  // /entrar e /entrar/codigo (2ª etapa do 2FA) não exigem sessão
  const naTelaDeEntrar = caminho === ENTRAR || caminho.startsWith(`${ENTRAR}/`);
  // Encerrar a sessão apaga os cookies: não pode depender de sessão válida
  if (caminho === "/sessao-encerrada") return NextResponse.next();
  // Pesquisa de satisfação: o cliente responde por link, sem login (o token é a credencial)
  if (caminho.startsWith("/pesquisa/")) return NextResponse.next();
  // Esqueci a senha e o link do e-mail: abrem com ou sem sessão
  if (caminho === "/esqueci-a-senha" || caminho === "/redefinir-senha")
    return NextResponse.next();
  // Server Actions (POST com o cabeçalho next-action) nunca recebem redirecionamento daqui: o Next espera a resposta
  // da ação e, com um 307, mostra "An unexpected response was received from the server" (ex.: tela de entrar aberta
  // enquanto a sessão foi renovada em outra aba ou o gateway voltou). A própria ação confere a sessão no gateway.
  const ehAcao = req.method !== "GET" && req.method !== "HEAD";
  const lembrar = req.cookies.get(COOKIE_LEMBRAR)?.value === "1";
  let conteudo = lerToken(req.cookies.get(COOKIE_ACESSO)?.value);
  let sessaoNova: Sessao | null = null;

  if (!conteudo || conteudo.exp * 1000 - Date.now() < MARGEM_DE_RENOVACAO_MS) {
    const renovacao = req.cookies.get(COOKIE_RENOVACAO)?.value;
    const r = renovacao ? await renovar(renovacao) : null;
    if (r && "sessao" in r) {
      sessaoNova = r.sessao;
      conteudo = lerToken(r.sessao.tokenAcesso);
    } else if (!naTelaDeEntrar && !ehAcao) {
      const destino = new URL(ENTRAR, req.url);
      if (caminho !== "/")
        destino.searchParams.set("volta", caminho + req.nextUrl.search);
      const res = NextResponse.redirect(destino);
      // Sessão recusada pelo Identidade: apaga os cookies. Falha de rede: mantém (pode ser passageira).
      if (r && "recusada" in r)
        for (const nome of [COOKIE_ACESSO, COOKIE_RENOVACAO])
          res.cookies.delete(nome);
      return res;
    } else {
      return NextResponse.next();
    }
  }

  let res: NextResponse;
  if (ehAcao) {
    if (!sessaoNova) return NextResponse.next();
    for (const c of cookiesDaSessao(sessaoNova, lembrar))
      req.cookies.set(c.name, c.value);
    const headers = new Headers(req.headers);
    headers.set("cookie", req.cookies.toString());
    res = NextResponse.next({ request: { headers } });
  } else if (naTelaDeEntrar) {
    res = NextResponse.redirect(
      new URL(caminhoDeVolta(req.nextUrl.searchParams.get("volta")), req.url),
    );
  } else if (conteudo?.dts && caminho !== TROCAR_SENHA) {
    res = NextResponse.redirect(new URL(TROCAR_SENHA, req.url));
  } else if (sessaoNova) {
    // A página desta mesma requisição já precisa enxergar o token novo
    for (const c of cookiesDaSessao(sessaoNova, lembrar))
      req.cookies.set(c.name, c.value);
    const headers = new Headers(req.headers);
    headers.set("cookie", req.cookies.toString());
    res = NextResponse.next({ request: { headers } });
  } else {
    return NextResponse.next();
  }
  if (sessaoNova)
    for (const c of cookiesDaSessao(sessaoNova, lembrar)) res.cookies.set(c);
  return res;
}

async function renovar(
  tokenRenovacao: string,
): Promise<{ sessao: Sessao } | { recusada: true } | null> {
  try {
    const r = await fetch(`${API_URL}/auth/renovar`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tokenRenovacao }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (r.ok) return { sessao: (await r.json()) as Sessao };
    return r.status === 401 || r.status === 400 ? { recusada: true } : null;
  } catch {
    return null;
  }
}

export const config = {
  // Tudo, menos arquivos estáticos (scripts, imagens, ícones, a marca e as fotos da tela de entrar)
  matcher: [
    "/((?!_next/static|_next/image|brand/|acesso/|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|opengraph-image).*)",
  ],
};
