"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import {
  atualizarItemProgramacaoSchema,
  detalhesDaValidacao,
  novoItemProgramacaoSchema,
  type ErroPadrao,
  type ItemDaProgramacao,
} from "@davinci/types";
import { chamarApi } from "./api";

export type EstadoDaAcao = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
  /** Normas e meses marcados, para repor a seleção quando a validação recusa. */
  normas?: string[];
  meses?: string[];
};

const API = "/programacao-de-auditorias";
const WEB = "/auditorias/programacao";
const CONFIRA = "Verifique os campos destacados.";

/** Campos de texto do formulário (sem os arrays e a versão). */
function textos(form: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [chave, valor] of form.entries())
    if (
      typeof valor === "string" &&
      chave !== "versao" &&
      chave !== "normas" &&
      chave !== "meses"
    )
      valores[chave] = valor;
  return valores;
}

async function chamar<T>(
  schema: z.ZodType,
  dados: Record<string, unknown>,
  caminho: string,
  metodo: "POST" | "PUT",
  extra: Omit<EstadoDaAcao, "erro"> = {},
) {
  const v = schema.safeParse(dados);
  if (!v.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: CONFIRA,
        detalhes: detalhesDaValidacao(v.error.issues),
      } as ErroPadrao,
      ...extra,
    };
  const r = await chamarApi<T>(caminho, { metodo, corpo: dados });
  return r.ok ? { dados: r.dados } : { erro: r.erro, ...extra };
}

/** Criar (sem `id`) ou editar um item da programação anual. */
export async function salvarItemProgramacao(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const normas = form.getAll("normas").map(String);
  const meses = form.getAll("meses").map(String);
  const dados = {
    ...valores,
    normas,
    meses,
    ...(id ? { versao: String(form.get("versao") ?? "") } : {}),
  };
  const extra = { valores, normas, meses };
  const r = id
    ? await chamar<ItemDaProgramacao>(
        atualizarItemProgramacaoSchema,
        dados,
        `${API}/${id}`,
        "PUT",
        extra,
      )
    : await chamar<ItemDaProgramacao>(
        novoItemProgramacaoSchema,
        dados,
        API,
        "POST",
        extra,
      );
  if ("erro" in r) return r;
  redirect(`${WEB}?ano=${valores.ano}&aviso=${id ? "salvo" : "criado"}`);
}

/** Excluir um item da programação (bloqueado se houver auditorias vinculadas). */
export async function excluirItemProgramacao(
  id: string,
  ano: string,
): Promise<void> {
  const r = await chamarApi(`${API}/${id}`, { metodo: "DELETE" });
  if (!r.ok) redirect(`${WEB}/${id}?erro=${encodeURIComponent(r.erro.mensagem)}`);
  redirect(`${WEB}?ano=${ano}&aviso=excluido`);
}
