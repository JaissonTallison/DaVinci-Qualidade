"use server";

import { redirect } from "next/navigation";
import {
  definirEpisDaFuncaoSchema,
  definirTreinamentosDaFuncaoSchema,
} from "@davinci/types";
import { chamar, type EstadoDaAcao } from "./acao";

const pagina = (funcaoId: string, aviso: string) =>
  `/cadastros/setores-e-funcoes/${funcaoId}?aviso=${aviso}`;

/** Treinamentos obrigatórios da função: os marcados substituem a lista anterior. */
export async function definirTreinamentosDaFuncao(
  funcaoId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const dados = {
    funcaoId,
    treinamentoIds: form.getAll("treinamentoIds").map(String),
  };
  const r = await chamar(
    definirTreinamentosDaFuncaoSchema,
    dados,
    `/competencias/funcoes/${funcaoId}/treinamentos`,
    "PUT",
  );
  if ("erro" in r) return r;
  redirect(pagina(funcaoId, "treinamentos"));
}

/** EPIs obrigatórios da função, cada um com o risco do PGR escolhido (ou nenhum). */
export async function definirEpisDaFuncao(
  funcaoId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const itens = form
    .getAll("epiIds")
    .map(String)
    .map((epiId) => ({
      epiId,
      riscoId: String(form.get(`risco-${epiId}`) ?? "") || null,
    }));
  const r = await chamar(
    definirEpisDaFuncaoSchema,
    { funcaoId, itens },
    `/competencias/funcoes/${funcaoId}/epis`,
    "PUT",
  );
  if ("erro" in r) return r;
  redirect(pagina(funcaoId, "epis"));
}
