import { redirect } from "next/navigation";
import { ehErroPadrao, type ErroPadrao } from "@davinci/types";
import { API_URL } from "./api-url";
import { headers as cabecalhosDaRequisicao } from "next/headers";
import { connection } from "next/server";
import { lerCookie } from "./cookie";
import { COOKIE_ACESSO } from "./sessao";

export { API_URL };

export type Resultado<T> =
  { ok: true; dados: T } | { ok: false; erro: ErroPadrao };

const TROQUE_A_SENHA = "Troque a senha inicial para continuar.";

/**
 * Chama o gateway e devolve sucesso OU o erro padrão (docs/02-arquitetura/mensagens-e-erros.md).
 * Leva o token de acesso do cookie. Sessão vencida → /sessao-encerrada; senha inicial pendente → /trocar-senha.
 * `publica`: login e renovação (sem token, e um 401 é resposta normal, não sessão vencida).
 */
export async function chamarApi<T>(
  caminho: string,
  opcoes: {
    metodo?: "GET" | "POST" | "PUT" | "DELETE";
    corpo?: unknown;
    publica?: boolean;
    cabecalhos?: Record<string, string>;
  } = {},
): Promise<Resultado<T>> {
  // Toda chamada depende da requisição (sessão, hora): nunca entra na pré-renderização
  await connection();
  const token = opcoes.publica ? undefined : await lerCookie(COOKIE_ACESSO);
  const r = await requisitar<T>(caminho, opcoes, token);
  if (!opcoes.publica && !r.ok) {
    // Sessão recusada: passa por /sessao-encerrada, que apaga os cookies (senão o login devolveria ao sistema)
    if (r.erro.codigo === "NAO_AUTENTICADO") redirect("/sessao-encerrada");
    if (r.erro.codigo === "SEM_PERMISSAO" && r.erro.mensagem === TROQUE_A_SENHA)
      redirect("/trocar-senha");
  }
  return r;
}

async function requisitar<T>(
  caminho: string,
  opcoes: {
    metodo?: string;
    corpo?: unknown;
    cabecalhos?: Record<string, string>;
  },
  token?: string,
): Promise<Resultado<T>> {
  try {
    const headers: Record<string, string> = {
      ...opcoes.cabecalhos,
      ...(await origemDoVisitante()),
    };
    if (opcoes.corpo !== undefined)
      headers["content-type"] = "application/json";
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${caminho}`, {
      method: opcoes.metodo ?? "GET",
      headers,
      body:
        opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const json: unknown = await res.json().catch(() => null);
    if (res.ok) return { ok: true, dados: json as T };
    const erro = (json as { erro?: unknown } | null)?.erro;
    if (ehErroPadrao(erro)) return { ok: false, erro };
    return {
      ok: false,
      erro: {
        codigo: "INTERNO",
        mensagem:
          "Não foi possível concluir a operação. Tente novamente em instantes.",
      },
    };
  } catch {
    return {
      ok: false,
      erro: {
        codigo: "SERVICO_INDISPONIVEL",
        mensagem:
          "Não foi possível conectar ao servidor. Verifique se o gateway está em execução e tente novamente.",
      },
    };
  }
}

/**
 * IP e navegador de quem está usando o sistema, para o histórico de acessos e a lista de sessões.
 * Quem chama o gateway é este servidor: repassamos o que o proxy reverso informou (em dev, não há IP).
 */
async function origemDoVisitante(): Promise<Record<string, string>> {
  const h = await cabecalhosDaRequisicao();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  const navegador = h.get("user-agent") ?? "";
  return {
    ...(ip ? { "x-davinci-ip": ip } : {}),
    ...(navegador ? { "user-agent": navegador } : {}),
  };
}
