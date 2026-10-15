"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import {
  atualizarAuditoriaSchema,
  cancelarAuditoriaSchema,
  concluirAuditoriaSchema,
  detalhesDaValidacao,
  formalizarNcSchema,
  iniciarAuditoriaSchema,
  novaAuditoriaSchema,
  registrarConstatacaoSchema,
  type Auditoria,
  type ErroPadrao,
} from "@davinci/types";
import { chamarApi } from "./api";

export type EstadoDaAcao = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
  normas?: string[];
};

const BASE = "/auditorias";
const CONFIRA = "Verifique os campos destacados.";

function textos(form: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [chave, valor] of form.entries())
    if (typeof valor === "string" && chave !== "versao" && chave !== "normas")
      valores[chave] = valor;
  return valores;
}
const versaoDe = (form: FormData) => String(form.get("versao") ?? "");

async function chamar(
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
  const r = await chamarApi<Auditoria>(caminho, { metodo, corpo: dados });
  return r.ok ? { auditoria: r.dados } : { erro: r.erro, ...extra };
}

export async function salvarAuditoria(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const normas = form.getAll("normas").map(String);
  const dados = {
    ...valores,
    normas,
    ...(id ? { versao: versaoDe(form) } : {}),
  };
  const r = id
    ? await chamar(
        atualizarAuditoriaSchema,
        dados,
        `/auditorias/${id}`,
        "PUT",
        { valores, normas },
      )
    : await chamar(novaAuditoriaSchema, dados, "/auditorias", "POST", {
        valores,
        normas,
      });
  if ("erro" in r) return r;
  redirect(`${BASE}/${r.auditoria.id}?aviso=${id ? "salva" : "planejada"}`);
}

export async function iniciarAuditoria(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar(
    iniciarAuditoriaSchema,
    { versao: versaoDe(form) },
    `/auditorias/${id}/iniciar`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=iniciada`);
}

export async function registrarConstatacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    registrarConstatacaoSchema,
    { versao: versaoDe(form), constatacao: valores },
    `/auditorias/${id}/constatacoes`,
    "POST",
    { valores },
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=constatacao#constatacoes`);
}

export async function formalizarNc(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    versao: versaoDe(form),
    constatacaoId: valores.constatacaoId,
    responsavel: valores.responsavel,
    prazo: valores.prazo || undefined,
  };
  const r = await chamar(
    formalizarNcSchema,
    dados,
    `/auditorias/${id}/constatacoes/formalizar-nc`,
    "POST",
    { valores },
  );
  if ("erro" in r) return r;
  const numero =
    r.auditoria.constatacoes.find((c) => c.id === valores.constatacaoId)
      ?.ncNumero ?? "";
  redirect(
    `${BASE}/${id}?aviso=nc&nc=${encodeURIComponent(numero)}#constatacoes`,
  );
}

export async function concluirAuditoria(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    concluirAuditoriaSchema,
    { versao: versaoDe(form), conclusao: valores.conclusao },
    `/auditorias/${id}/concluir`,
    "POST",
    { valores },
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=concluida`);
}

export async function cancelarAuditoria(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    cancelarAuditoriaSchema,
    { versao: versaoDe(form), motivo: valores.motivo },
    `/auditorias/${id}/cancelar`,
    "POST",
    { valores },
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=cancelada`);
}
