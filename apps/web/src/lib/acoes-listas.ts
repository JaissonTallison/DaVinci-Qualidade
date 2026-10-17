"use server";

import { redirect } from "next/navigation";
import {
  atualizarItemDeListaSchema,
  novoItemDeListaSchema,
  situacaoDoCadastroSchema,
  type ListaCadastro,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

const BASE = "/cadastros/listas";

/** Item de uma lista (processo, causa…): cadastrar (sem id) ou renomear. */
export async function salvarItemDeLista(
  lista: ListaCadastro,
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    id ? atualizarItemDeListaSchema : novoItemDeListaSchema,
    id ? { ...valores, versao: versaoDe(form) } : valores,
    id ? `/listas/${lista}/${id}` : `/listas/${lista}`,
    id ? "PUT" : "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}?aviso=${lista}-${id ? "salvo" : "criado"}`);
}

export async function mudarSituacaoDoItem(
  lista: ListaCadastro,
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const ativo = form.get("ativo") === "sim";
  const r = await chamar(
    situacaoDoCadastroSchema,
    { versao: versaoDe(form), ativo },
    `/listas/${lista}/${id}/situacao`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${BASE}?aviso=${lista}-${ativo ? "ativado" : "inativado"}`);
}
