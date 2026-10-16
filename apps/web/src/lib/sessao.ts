import type { ConteudoDoToken, Sessao } from "@davinci/types";

/**
 * Sessão do web (docs/05-modulos/identidade.md §3). Os dois tokens ficam em cookies
 * HttpOnly: o JavaScript da página nunca os lê; só o servidor do Next os repassa ao gateway.
 */
export const COOKIE_ACESSO = "davinci_acesso";
export const COOKIE_RENOVACAO = "davinci_renovacao";
/** Senha certa, falta o código do 2FA (5 minutos). */
export const COOKIE_DESAFIO = "davinci_desafio";
/** "Confiar neste navegador por 30 dias". */
export const COOKIE_CONFIAVEL = "davinci_confiavel";
/** "Lembrar de mim": sem ele, a sessão vive só até o navegador fechar. */
export const COOKIE_LEMBRAR = "davinci_lembrar";
export const DIAS_LEMBRAR = 30;
/** "Entrar com Microsoft/Google": state, nonce e PKCE da ida ao provedor (10 minutos). */
export const COOKIE_EXTERNO = "davinci_externo";
/** Recusa vinda da volta do provedor, mostrada na tela de entrar (1 minuto; não vai na URL). */
export const COOKIE_RECUSA = "davinci_recusa";

/** Renova quando faltar menos que isto para o token de acesso vencer. */
export const MARGEM_DE_RENOVACAO_MS = 60_000;

type OpcoesDoCookie = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  expires?: Date;
};

/** Sem `expira`: cookie de sessão do navegador (apagado ao fechar). */
export function opcoes(expira?: string): OpcoesDoCookie {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(expira ? { expires: new Date(expira) } : {}),
  };
}

/**
 * Os dois cookies de uma sessão, prontos para `cookies().set(...)` (ação) ou `response.cookies.set(...)` (proxy).
 * `lembrar` falso: viram cookies de sessão do navegador; o token continua vencendo no prazo dele.
 */
export function cookiesDaSessao(
  sessao: Pick<
    Sessao,
    "tokenAcesso" | "acessoExpiraEm" | "tokenRenovacao" | "renovacaoExpiraEm"
  >,
  lembrar: boolean,
) {
  return [
    {
      name: COOKIE_ACESSO,
      value: sessao.tokenAcesso,
      ...opcoes(lembrar ? sessao.acessoExpiraEm : undefined),
    },
    {
      name: COOKIE_RENOVACAO,
      value: sessao.tokenRenovacao,
      ...opcoes(lembrar ? sessao.renovacaoExpiraEm : undefined),
    },
  ];
}

/**
 * Lê o conteúdo do token SEM conferir a assinatura: serve só para decidir navegação
 * (vencido? senha pendente?). Quem confere de verdade é o gateway, a cada chamada.
 */
export function lerToken(
  token: string | undefined,
): (ConteudoDoToken & { exp: number }) | null {
  const parte = token?.split(".")[1];
  if (!parte) return null;
  try {
    const c = JSON.parse(
      Buffer.from(parte, "base64url").toString("utf8"),
    ) as Partial<ConteudoDoToken & { exp: number }>;
    if (
      typeof c.sub !== "string" ||
      typeof c.exp !== "number" ||
      !Array.isArray(c.per)
    )
      return null;
    return {
      sub: c.sub,
      emp: String(c.emp),
      nom: String(c.nom),
      per: c.per,
      dts: c.dts === true,
      c2f: c.c2f === true,
      exp: c.exp,
    };
  } catch {
    return null;
  }
}

/** Destino seguro depois do login: só caminhos internos (evita redirecionar para outro site). */
export function caminhoDeVolta(volta: unknown): string {
  return typeof volta === "string" &&
    volta.startsWith("/") &&
    !volta.startsWith("//") &&
    !volta.startsWith("/\\") &&
    !volta.startsWith("/entrar")
    ? volta
    : "/";
}
