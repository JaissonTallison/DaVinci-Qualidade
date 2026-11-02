"use server";

import { redirect } from "next/navigation";
import {
  atualizarRequisitoSstSchema,
  avaliarRequisitoSstSchema,
  novoRequisitoSstSchema,
  type RequisitoLegalSst,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

const BASE = "/seguranca/requisitos-legais";
const API = "/requisitos-legais-sst";

export async function criarRequisitoSst(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<RequisitoLegalSst>(
    novoRequisitoSstSchema,
    v,
    API,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${r.dados.id}?aviso=criado`);
}

export async function atualizarRequisitoSst(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<RequisitoLegalSst>(
    atualizarRequisitoSstSchema,
    { ...v, versao: versaoDe(form) },
    `${API}/${id}`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=salvo`);
}

export async function avaliarRequisitoSst(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<RequisitoLegalSst>(
    avaliarRequisitoSstSchema,
    {
      versao: versaoDe(form),
      data: v.data,
      atendimento: v.atendimento,
      evidencia: v.evidencia,
      acao: v.acao,
    },
    `${API}/${id}/avaliacao`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=avaliado`);
}
