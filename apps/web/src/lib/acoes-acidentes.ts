"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import {
  atualizarAcidenteSchema,
  cancelarAcidenteSchema,
  concluirInvestigacaoSchema,
  detalhesDaValidacao,
  iniciarInvestigacaoSchema,
  novoAcidenteSchema,
  registrarCatSchema,
  registrarHorasSchema,
  type Acidente,
  type ErroPadrao,
} from "@davinci/types";
import { chamarApi } from "./api";

export type EstadoDaAcao = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
};

const BASE = "/seguranca/acidentes";
const CONFIRA = "Verifique os campos destacados.";

function textos(form: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [chave, valor] of form.entries())
    if (typeof valor === "string" && chave !== "versao") valores[chave] = valor;
  return valores;
}
const versaoDe = (form: FormData) => String(form.get("versao") ?? "");

async function chamar<T>(
  schema: z.ZodType,
  dados: Record<string, unknown>,
  caminho: string,
  metodo: "POST" | "PUT",
  valores: Record<string, string> = {},
) {
  const v = schema.safeParse(dados);
  if (!v.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: CONFIRA,
        detalhes: detalhesDaValidacao(v.error.issues),
      } as ErroPadrao,
      valores,
    };
  const r = await chamarApi<T>(caminho, { metodo, corpo: dados });
  return r.ok ? { dados: r.dados } : { erro: r.erro, valores };
}

export async function salvarAcidente(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = id
    ? await chamar<Acidente>(
        atualizarAcidenteSchema,
        { ...valores, versao: versaoDe(form) },
        `/acidentes/${id}`,
        "PUT",
        valores,
      )
    : await chamar<Acidente>(
        novoAcidenteSchema,
        valores,
        "/acidentes",
        "POST",
        valores,
      );
  if ("erro" in r) return r;
  redirect(`${BASE}/${r.dados.id}?aviso=${id ? "salvo" : "registrado"}`);
}

export async function registrarCat(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Acidente>(
    registrarCatSchema,
    { ...valores, versao: versaoDe(form) },
    `/acidentes/${id}/cat`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=cat`);
}

export async function iniciarInvestigacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar<Acidente>(
    iniciarInvestigacaoSchema,
    { versao: versaoDe(form) },
    `/acidentes/${id}/investigacao/iniciar`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=investigacao`);
}

export async function concluirInvestigacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Acidente>(
    concluirInvestigacaoSchema,
    { ...valores, versao: versaoDe(form) },
    `/acidentes/${id}/investigacao/concluir`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=concluido`);
}

export async function cancelarAcidente(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Acidente>(
    cancelarAcidenteSchema,
    { motivo: valores.motivo, versao: versaoDe(form) },
    `/acidentes/${id}/cancelar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=cancelado`);
}

/** Horas-homem do mês. Aceita "450.000" e "450000,5" (padrão brasileiro). */
export async function registrarHoras(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const horas = (valores.horas ?? "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const r = await chamar(
    registrarHorasSchema,
    { competencia: valores.competencia, horas },
    "/acidentes/horas",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(
    `/seguranca/indicadores?ano=${valores.competencia?.slice(0, 4)}&aviso=horas`,
  );
}
