"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import {
  anularCalibracaoSchema,
  atualizarInstrumentoSchema,
  detalhesDaValidacao,
  novoInstrumentoSchema,
  registrarCalibracaoSchema,
  usoDoInstrumentoSchema,
  type ErroPadrao,
  type Instrumento,
} from "@davinci/types";
import { chamarApi } from "./api";
import { valorEmReais } from "./valores";

export type EstadoDaAcao = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
};

const BASE = "/qualidade/calibracao";
const CONFIRA = "Verifique os campos destacados.";

function textos(form: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [chave, valor] of form.entries())
    if (typeof valor === "string" && chave !== "versao") valores[chave] = valor;
  return valores;
}

async function chamar(
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
  const r = await chamarApi<Instrumento>(caminho, { metodo, corpo: dados });
  return r.ok ? { instrumento: r.dados } : { erro: r.erro, valores };
}

export async function salvarInstrumento(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = id
    ? await chamar(
        atualizarInstrumentoSchema,
        { ...valores, versao: String(form.get("versao") ?? "") },
        `/instrumentos/${id}`,
        "PUT",
        valores,
      )
    : await chamar(
        novoInstrumentoSchema,
        valores,
        "/instrumentos",
        "POST",
        valores,
      );
  if ("erro" in r) return r;
  redirect(`${BASE}/${r.instrumento.id}?aviso=${id ? "salvo" : "criado"}`);
}

export async function registrarCalibracao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const resultado = form.get("aprovada");
  const dados = {
    ...valores,
    aprovada:
      resultado === "sim" ? true : resultado === "nao" ? false : undefined,
    custo: valorEmReais(valores.custo),
    versao: String(form.get("versao") ?? ""),
  };
  const r = await chamar(
    registrarCalibracaoSchema,
    dados,
    `/instrumentos/${id}/calibracoes`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(
    `${BASE}/${id}?aviso=${r.instrumento.situacao === "reprovado" ? "reprovado" : "registrada"}`,
  );
}

export async function anularCalibracao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    calibracaoId: valores.calibracaoId,
    motivo: valores.motivo,
    versao: String(form.get("versao") ?? ""),
  };
  const r = await chamar(
    anularCalibracaoSchema,
    dados,
    `/instrumentos/${id}/calibracoes/anular`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=anulada`);
}

export async function mudarUsoDoInstrumento(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const emUso = form.get("emUso") === "sim";
  const r = await chamar(
    usoDoInstrumentoSchema,
    { emUso, versao: String(form.get("versao") ?? "") },
    `/instrumentos/${id}/uso`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=${emUso ? "em-uso" : "fora-de-uso"}`);
}
