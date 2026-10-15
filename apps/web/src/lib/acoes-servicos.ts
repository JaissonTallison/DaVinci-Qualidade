"use server";

import { redirect } from "next/navigation";
import {
  avaliarFornecedorSchema,
  avaliarOsSchema,
  cancelarOsSchema,
  concluirOsSchema,
  iniciarOsSchema,
  novaOsSchema,
  registrarRespostaNpsSchema,
  type OrdemDeServico,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

const OS = "/servicos/ordens";

export async function criarOs(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<OrdemDeServico>(
    novaOsSchema,
    valores,
    "/ordens-de-servico",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${OS}/${r.dados.id}?aviso=criada`);
}

async function acaoDaOs(
  id: string,
  caminho: string,
  schema: Parameters<typeof chamar>[0],
  dados: Record<string, unknown>,
  aviso: string,
  valores: Record<string, string> = {},
): Promise<EstadoDaAcao> {
  const r = await chamar(
    schema,
    dados,
    `/ordens-de-servico/${id}/${caminho}`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${OS}/${id}?aviso=${aviso}`);
}

export async function iniciarOs(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  return acaoDaOs(
    id,
    "iniciar",
    iniciarOsSchema,
    { versao: versaoDe(form) },
    "iniciada",
  );
}
export async function concluirOs(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaOs(
    id,
    "concluir",
    concluirOsSchema,
    { versao: versaoDe(form), relatorio: v.relatorio },
    "concluida",
    v,
  );
}
export async function cancelarOs(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaOs(
    id,
    "cancelar",
    cancelarOsSchema,
    { versao: versaoDe(form), motivo: v.motivo },
    "cancelada",
    v,
  );
}
export async function avaliarOs(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  return acaoDaOs(
    id,
    "avaliacao",
    avaliarOsSchema,
    { versao: versaoDe(form), nota: v.nota, comentario: v.comentario },
    "avaliada",
    v,
  );
}

export async function registrarNps(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    registrarRespostaNpsSchema,
    valores,
    "/nps",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect("/servicos/nps?aviso=registrada");
}

export async function avaliarFornecedor(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    avaliarFornecedorSchema,
    valores,
    "/avaliacoes-de-fornecedores",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect("/servicos/fornecedores?aviso=avaliado");
}
