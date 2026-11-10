import { NextResponse, type NextRequest } from "next/server";
import type { Sessao } from "@davinci/types";
import { API_URL } from "@/lib/api-url";
import { urlPublica } from "@/lib/endereco-do-sistema";
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
 * Content-Security-Policy com nonce por requisição (DV-05). O `script-src` com nonce + `strict-dynamic`
 * é a proteção forte contra XSS: só roda o script que o Next assina com o nonce desta resposta. `style-src`
 * mantém `unsafe-inline` (estilos de atributo não aceitam nonce; baixo risco). `connect-src 'self'` basta
 * porque o navegador fala com o gateway pela mesma origem (Server Actions / route handlers).
 */
function montarCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

/**
 * Antes de cada página: renova a sessão quando o token de acesso está para vencer,
 * manda quem não está logado para /entrar e quem tem senha inicial pendente para /trocar-senha.
 * (Perfil que exige 2FA ainda sem ativar: o gateway recusa as chamadas; a tela de segurança da conta vem depois.)
 * A permissão de verdade é sempre conferida pelo gateway; aqui é só navegação.
 * Toda resposta leva a CSP com o nonce desta requisição (ver `montarCsp`).
 */
export async function proxy(req: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = montarCsp(nonce);
  // O Next lê o nonce pela CSP nos cabeçalhos da REQUISIÇÃO (e x-nonce para quem quiser ler no servidor),
  // e assina os próprios scripts com ele. A mesma CSP vai no cabeçalho da RESPOSTA, para o navegador aplicar.
  const cabecalhos = new Headers(req.headers);
  cabecalhos.set("x-nonce", nonce);
  cabecalhos.set("Content-Security-Policy", csp);
  const res = await decidir(req, cabecalhos);
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

async function decidir(
  req: NextRequest,
  cabecalhos: Headers,
): Promise<NextResponse> {
  const proximo = () => NextResponse.next({ request: { headers: cabecalhos } });
  const caminho = req.nextUrl.pathname;
  // /entrar e /entrar/codigo (2ª etapa do 2FA) não exigem sessão
  const naTelaDeEntrar = caminho === ENTRAR || caminho.startsWith(`${ENTRAR}/`);
  // Encerrar a sessão apaga os cookies: não pode depender de sessão válida
  if (caminho === "/sessao-encerrada") return proximo();
  // Pesquisa de satisfação: o cliente responde por link, sem login (o token é a credencial)
  if (caminho.startsWith("/pesquisa/")) return proximo();
  // Esqueci a senha e o link do e-mail: abrem com ou sem sessão
  if (caminho === "/esqueci-a-senha" || caminho === "/redefinir-senha")
    return proximo();
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
      const destino = urlPublica(req, ENTRAR);
      if (caminho !== "/")
        destino.searchParams.set("volta", caminho + req.nextUrl.search);
      const res = NextResponse.redirect(destino);
      // Sessão recusada pelo Identidade: apaga os cookies. Falha de rede: mantém (pode ser passageira).
      if (r && "recusada" in r)
        for (const nome of [COOKIE_ACESSO, COOKIE_RENOVACAO])
          res.cookies.delete(nome);
      return res;
    } else {
      return proximo();
    }
  }

  let res: NextResponse;
  if (ehAcao) {
    if (!sessaoNova) return proximo();
    for (const c of cookiesDaSessao(sessaoNova, lembrar))
      req.cookies.set(c.name, c.value);
    cabecalhos.set("cookie", req.cookies.toString());
    res = proximo();
  } else if (naTelaDeEntrar) {
    res = NextResponse.redirect(
      urlPublica(req, caminhoDeVolta(req.nextUrl.searchParams.get("volta"))),
    );
  } else if (conteudo?.dts && caminho !== TROCAR_SENHA) {
    res = NextResponse.redirect(urlPublica(req, TROCAR_SENHA));
  } else if (sessaoNova) {
    // A página desta mesma requisição já precisa enxergar o token novo
    for (const c of cookiesDaSessao(sessaoNova, lembrar))
      req.cookies.set(c.name, c.value);
    cabecalhos.set("cookie", req.cookies.toString());
    res = proximo();
  } else {
    return proximo();
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
  // Tudo, menos arquivos estáticos (scripts, imagens, ícones, a marca, as fotos da tela de entrar e dos módulos)
  matcher: [
    "/((?!_next/static|_next/image|brand/|acesso/|modulos/|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|opengraph-image).*)",
  ],
};
