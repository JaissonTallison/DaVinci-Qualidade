"use server";

import { redirect } from "next/navigation";
import {
  anularEntregaSchema,
  atualizarEpiSchema,
  devolverEntregaSchema,
  novoEpiSchema,
  registrarEntregaSchema,
  situacaoDoEpiSchema,
  type EntregaEpi,
  type Epi,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

const CATALOGO = "/seguranca/epis";

/** Só caminhos internos: o retorno vem de um campo do formulário. */
function destino(voltar: FormDataEntryValue | null, aviso: string): string {
  const base =
    typeof voltar === "string" &&
    voltar.startsWith("/") &&
    !voltar.startsWith("//")
      ? voltar
      : "/seguranca/entregas-de-epi";
  return `${base}${base.includes("?") ? "&" : "?"}aviso=${aviso}`;
}

export async function salvarEpi(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    ...valores,
    vidaUtilDias: valores.vidaUtilDias?.trim() || undefined,
  };
  const r = id
    ? await chamar<Epi>(
        atualizarEpiSchema,
        { ...dados, versao: versaoDe(form) },
        `/epis/${id}`,
        "PUT",
        valores,
      )
    : await chamar<Epi>(novoEpiSchema, dados, "/epis", "POST", valores);
  if ("erro" in r) return r;
  redirect(id ? `${CATALOGO}/${id}?aviso=salvo` : `${CATALOGO}?aviso=criado`);
}

export async function mudarSituacaoDoEpi(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const ativo = form.get("ativo") === "sim";
  const r = await chamar<Epi>(
    situacaoDoEpiSchema,
    { versao: versaoDe(form), ativo },
    `/epis/${id}/situacao`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${CATALOGO}/${id}?aviso=${ativo ? "ativado" : "inativado"}`);
}

export async function registrarEntrega(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    ...valores,
    termoAssinado: form.get("termoAssinado") === "sim",
  };
  const r = await chamar<EntregaEpi>(
    registrarEntregaSchema,
    dados,
    "/epis/entregas",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(destino(form.get("voltar"), "entregue"));
}

export async function devolverEntrega(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<EntregaEpi>(
    devolverEntregaSchema,
    { data: valores.data },
    `/epis/entregas/${id}/devolver`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(destino(form.get("voltar"), "devolvido"));
}

export async function anularEntrega(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<EntregaEpi>(
    anularEntregaSchema,
    { motivo: valores.motivo },
    `/epis/entregas/${id}/anular`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(destino(form.get("voltar"), "anulada"));
}
