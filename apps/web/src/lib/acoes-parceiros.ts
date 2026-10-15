"use server";

import { redirect } from "next/navigation";
import {
  atualizarParceiroSchema,
  inativarParceiroSchema,
  novoParceiroSchema,
  reativarParceiroSchema,
  type Parceiro,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";
import { chamarApi } from "./api";

const BASE = "/cadastros/clientes-e-fornecedores";

/** Campos da tela enxuta; o resto do cadastro (endereços, fiscal...) é preservado na edição. */
function daTela(form: FormData) {
  const v = textos(form);
  return {
    valores: { ...v, papeis: form.getAll("papeis").map(String).join(",") },
    dados: {
      tipoPessoa: v.tipoPessoa,
      documento: v.documento ?? "",
      nome: v.nome,
      nomeFantasia: v.nomeFantasia,
      papeis: form.getAll("papeis").map(String),
      email: v.email || undefined,
      telefone: v.telefone || undefined,
      observacoes: v.observacoes,
    },
  };
}

export async function salvarParceiro(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const { valores, dados } = daTela(form);
  if (!id) {
    const r = await chamar<Parceiro>(
      novoParceiroSchema,
      dados,
      "/parceiros",
      "POST",
      valores,
    );
    if ("erro" in r) return r;
    redirect(`${BASE}/${r.dados.id}?aviso=criado`);
  }
  const atual = await chamarApi<Parceiro>(`/parceiros/${id}`);
  if (!atual.ok) return { erro: atual.erro, valores };
  const r = await chamar<Parceiro>(
    atualizarParceiroSchema,
    { ...atual.dados, ...dados, versao: versaoDe(form) },
    `/parceiros/${id}`,
    "PUT",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=salvo`);
}

export async function inativarParceiro(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    inativarParceiroSchema,
    { motivo: valores.motivo, versao: versaoDe(form) },
    `/parceiros/${id}/inativar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=inativado`);
}

export async function reativarParceiro(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar(
    reativarParceiroSchema,
    { versao: versaoDe(form) },
    `/parceiros/${id}/reativar`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=reativado`);
}
