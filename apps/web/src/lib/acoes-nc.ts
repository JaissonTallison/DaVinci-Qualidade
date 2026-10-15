"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import {
  cancelarNcSchema,
  detalhesDaValidacao,
  enviarParaVerificacaoSchema,
  novaNcSchema,
  registrarTratamentoSchema,
  verificarEficaciaSchema,
  type ErroPadrao,
  type NaoConformidade,
} from "@davinci/types";
import { chamarApi } from "./api";

export type EstadoDaAcao = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
};

const BASE = "/qualidade/nao-conformidades";
const CONFIRA = "Verifique os campos destacados.";

/** Campos de texto do formulário (o que o schema não conhece, ele ignora). */
function textos(form: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [chave, valor] of form.entries())
    if (typeof valor === "string" && chave !== "versao") valores[chave] = valor;
  return valores;
}

/** Valida aqui (resposta imediata, sem ir ao servidor) e chama a API. */
async function enviar(
  schema: z.ZodType,
  dados: Record<string, unknown>,
  caminho: string,
  metodo: "POST" | "PUT",
  valores: Record<string, string>,
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
  const r = await chamarApi<NaoConformidade>(caminho, { metodo, corpo: dados });
  return r.ok ? { nc: r.dados } : { erro: r.erro, valores };
}

/** "1.250,00" → "1250.00". Quem digita no padrão brasileiro não precisa adivinhar o formato. */
function valorEmReais(texto: string | undefined): string | undefined {
  const t = texto?.trim();
  if (!t || !t.includes(",")) return t;
  return t.replace(/\./g, "").replace(",", ".");
}

export async function abrirNc(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    ...valores,
    custoEstimado: valorEmReais(valores.custoEstimado),
  };
  const r = await enviar(
    novaNcSchema,
    dados,
    "/nao-conformidades",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${r.nc.id}?aviso=aberta`);
}

export async function registrarTratamento(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const porques = form
    .getAll("porques")
    .map(String)
    .map((p) => p.trim())
    .filter(Boolean);
  const dados = {
    ...valores,
    porques,
    versao: String(form.get("versao") ?? ""),
  };
  const r = await enviar(
    registrarTratamentoSchema,
    dados,
    `/nao-conformidades/${id}/tratamento`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=tratamento`);
}

export async function enviarParaVerificacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    dataImplantacao: valores.dataImplantacao,
    versao: String(form.get("versao") ?? ""),
  };
  const r = await enviar(
    enviarParaVerificacaoSchema,
    dados,
    `/nao-conformidades/${id}/enviar-para-verificacao`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=verificacao`);
}

export async function verificarEficacia(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const resposta = form.get("eficaz");
  const dados = {
    eficaz: resposta === "sim" ? true : resposta === "nao" ? false : undefined,
    parecer: valores.parecer,
    versao: String(form.get("versao") ?? ""),
  };
  const r = await enviar(
    verificarEficaciaSchema,
    dados,
    `/nao-conformidades/${id}/verificar-eficacia`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(
    `${BASE}/${id}?aviso=${r.nc.status === "encerrada" ? "encerrada" : "ineficaz"}`,
  );
}

export async function cancelarNc(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    motivo: valores.motivo,
    versao: String(form.get("versao") ?? ""),
  };
  const r = await enviar(
    cancelarNcSchema,
    dados,
    `/nao-conformidades/${id}/cancelar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=cancelada`);
}
