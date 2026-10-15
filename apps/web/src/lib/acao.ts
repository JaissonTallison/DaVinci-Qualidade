import type { z } from "zod";
import { detalhesDaValidacao, type ErroPadrao } from "@davinci/types";
import { chamarApi } from "./api";

/*
 * Peças comuns das Server Actions: o que volta para o formulário e a chamada validada à API.
 * Os arquivos de ações mais antigos (acoes-nc, acoes-acidentes...) ainda têm cópias locais; ao mexer neles, troque por estas.
 */

export type EstadoDaAcao = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
};

/** Campos de texto do formulário, para devolver o que a pessoa digitou quando der erro. */
export function textos(form: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [chave, valor] of form.entries())
    if (typeof valor === "string" && chave !== "versao") valores[chave] = valor;
  return valores;
}

export const versaoDe = (form: FormData) => String(form.get("versao") ?? "");

/** Valida no servidor da tela (resposta imediata) e chama a API, que valida de novo. */
export async function chamar<T>(
  schema: z.ZodType,
  dados: Record<string, unknown>,
  caminho: string,
  metodo: "POST" | "PUT",
  valores: Record<string, string> = {},
): Promise<
  { dados: T } | { erro: ErroPadrao; valores: Record<string, string> }
> {
  const v = schema.safeParse(dados);
  if (!v.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: "Verifique os campos destacados.",
        detalhes: detalhesDaValidacao(v.error.issues),
      } as ErroPadrao,
      valores,
    };
  const r = await chamarApi<T>(caminho, { metodo, corpo: dados });
  return r.ok ? { dados: r.dados } : { erro: r.erro, valores };
}
