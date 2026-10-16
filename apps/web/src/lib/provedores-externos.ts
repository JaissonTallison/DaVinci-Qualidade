import { createHash, randomBytes } from "node:crypto";
import type { ProvedorExterno } from "@davinci/types";

/*
 * "Entrar com Microsoft/Google" (OpenID Connect, fluxo de código com PKCE). Só no servidor: o segredo do aplicativo
 * nunca vai ao navegador. O provedor só prova o e-mail; quem decide se a pessoa entra é o Identidade.
 */

type Provedor = {
  autorizar: string;
  token: string;
  clienteId?: string;
  segredo?: string;
};

const PROVEDORES: Record<ProvedorExterno, () => Provedor> = {
  // "common": contas de empresa (Microsoft 365) e pessoais (outlook.com)
  microsoft: () => ({
    autorizar: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    clienteId: process.env.MICROSOFT_CLIENT_ID,
    segredo: process.env.MICROSOFT_CLIENT_SECRET,
  }),
  google: () => ({
    autorizar: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    clienteId: process.env.GOOGLE_CLIENT_ID,
    segredo: process.env.GOOGLE_CLIENT_SECRET,
  }),
};

export const ehProvedor = (p: string): p is ProvedorExterno =>
  p === "microsoft" || p === "google";

/** Provedores com ID e segredo no ambiente: só estes levam ao provedor (os outros voltam com aviso). */
export function provedoresAtivos(): ProvedorExterno[] {
  return (Object.keys(PROVEDORES) as ProvedorExterno[]).filter((p) => {
    const c = PROVEDORES[p]();
    return Boolean(c.clienteId && c.segredo);
  });
}

/** O que fica no cookie entre a ida ao provedor e a volta (10 minutos). */
export type IdaAoProvedor = {
  provedor: ProvedorExterno;
  state: string;
  nonce: string;
  verificador: string;
  volta: string;
  lembrar: boolean;
};

const aleatorio = () => randomBytes(32).toString("base64url");

/** Endereço de retorno registrado no provedor. APP_URL quando o servidor está atrás de proxy (Railway). */
export function enderecoDeRetorno(
  provedor: ProvedorExterno,
  origem: string,
): string {
  const base = (process.env.APP_URL ?? origem).replace(/\/$/, "");
  return `${base}/entrar/externo/${provedor}/retorno`;
}

export function prepararIda(
  provedor: ProvedorExterno,
  retorno: string,
  volta: string,
  lembrar: boolean,
): { url: string; ida: IdaAoProvedor } {
  const c = PROVEDORES[provedor]();
  const ida = {
    provedor,
    state: aleatorio(),
    nonce: aleatorio(),
    verificador: aleatorio(),
    volta,
    lembrar,
  };
  const url = new URL(c.autorizar);
  url.search = new URLSearchParams({
    client_id: c.clienteId ?? "",
    response_type: "code",
    redirect_uri: retorno,
    scope: "openid email profile",
    state: ida.state,
    nonce: ida.nonce,
    code_challenge: createHash("sha256")
      .update(ida.verificador)
      .digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), ida };
}

export function lerIda(valor: string | undefined): IdaAoProvedor | null {
  if (!valor) return null;
  try {
    const i = JSON.parse(valor) as Partial<IdaAoProvedor>;
    if (
      !i.provedor ||
      !ehProvedor(i.provedor) ||
      typeof i.state !== "string" ||
      typeof i.nonce !== "string" ||
      typeof i.verificador !== "string"
    )
      return null;
    return {
      provedor: i.provedor,
      state: i.state,
      nonce: i.nonce,
      verificador: i.verificador,
      volta: typeof i.volta === "string" ? i.volta : "/",
      lembrar: i.lembrar === true,
    };
  } catch {
    return null;
  }
}

/** Troca o código devolvido pelo provedor pelo id_token (servidor a servidor, com o segredo e o PKCE). */
export async function trocarCodigo(
  ida: IdaAoProvedor,
  codigo: string,
  retorno: string,
): Promise<string | null> {
  const c = PROVEDORES[ida.provedor]();
  try {
    const r = await fetch(c.token, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: codigo,
        redirect_uri: retorno,
        client_id: c.clienteId ?? "",
        client_secret: c.segredo ?? "",
        code_verifier: ida.verificador,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const corpo = (await r.json()) as { id_token?: unknown };
    return typeof corpo.id_token === "string" ? corpo.id_token : null;
  } catch {
    return null;
  }
}
