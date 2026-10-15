"use server";

import { redirect } from "next/navigation";
import {
  atualizarTemaSchema,
  novoTemaSchema,
  registrarAndamentoSchema,
  situacaoDoTemaSchema,
  type ResultadoDaImportacao,
  type TemaEsg,
} from "@davinci/types";
import { chamarApi } from "./api";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

/** ODS vêm de várias caixas com o mesmo nome; nos valores devolvidos ficam juntos por vírgula. */
function dadosDoTema(form: FormData) {
  const v = textos(form);
  const ods = form.getAll("ods").map(Number);
  return { v: { ...v, ods: ods.join(",") }, dados: { ...v, ods } };
}

export async function criarTema(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const { v, dados } = dadosDoTema(form);
  const r = await chamar<TemaEsg>(
    novoTemaSchema,
    dados,
    "/esg/temas",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/esg/temas/${r.dados.id}?aviso=criado`);
}

export async function atualizarTema(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const { v, dados } = dadosDoTema(form);
  const r = await chamar(
    atualizarTemaSchema,
    { ...dados, versao: versaoDe(form) },
    `/esg/temas/${id}`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/esg/temas/${id}?aviso=salvo`);
}

export async function situacaoDoTema(
  id: string,
  ativo: boolean,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar(
    situacaoDoTemaSchema,
    { versao: versaoDe(form), ativo },
    `/esg/temas/${id}/situacao`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`/esg/temas/${id}?aviso=${ativo ? "reativado" : "inativado"}`);
}

export async function registrarAndamento(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    registrarAndamentoSchema,
    v,
    `/esg/temas/${id}/andamentos`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/esg/temas/${id}?aviso=andamento`);
}

export async function importarCatalogo(): Promise<EstadoDaAcao> {
  const r = await chamarApi<ResultadoDaImportacao>("/esg/temas/catalogo", {
    metodo: "POST",
    corpo: {},
  });
  if (!r.ok) return { erro: r.erro };
  redirect(`/esg/temas?aviso=importado&criados=${r.dados.criados}`);
}
