import { headers } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * Origem pública (protocolo + host), sem a barra final. `APP_URL` tem prioridade; senão, os cabeçalhos
 * do proxy (`x-forwarded-host`/`x-forwarded-proto`). Função pura, para teste.
 */
export function montarOrigem(
  appUrl: string | undefined,
  xfHost: string | null,
  host: string | null,
  xfProto: string | null,
): string {
  const base = appUrl?.trim();
  if (base) return base.replace(/\/+$/, "");
  const alvo = xfHost ?? host ?? "localhost:3170";
  const proto = xfProto ?? (alvo.startsWith("localhost") ? "http" : "https");
  return `${proto}://${alvo}`;
}

/** Endereço público do sistema, para montar links enviados ao cliente (Server Components/Actions). */
export async function enderecoDoSistema(): Promise<string> {
  const h = await headers();
  return montarOrigem(
    process.env.APP_URL,
    h.get("x-forwarded-host"),
    h.get("host"),
    h.get("x-forwarded-proto"),
  );
}

/**
 * Origem pública a partir da requisição, para Route Handlers. Atrás do proxy do Railway, `req.url` é o
 * endereço INTERNO do contêiner (localhost:3170); por isso nunca montamos redirects com `req.url` nem
 * `req.nextUrl.origin` — sempre por aqui.
 */
export function origemPublica(req: NextRequest): string {
  return montarOrigem(
    process.env.APP_URL,
    req.headers.get("x-forwarded-host"),
    req.headers.get("host") ?? req.nextUrl.host,
    req.headers.get("x-forwarded-proto"),
  );
}

/** URL pública para um caminho interno, para redirects em Route Handlers. */
export function urlPublica(req: NextRequest, caminho: string): URL {
  return new URL(caminho, origemPublica(req));
}
