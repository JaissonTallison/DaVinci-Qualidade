"use server";

import { redirect } from "next/navigation";
import {
  anularRegistroSchema,
  atualizarTreinamentoSchema,
  novoTreinamentoSchema,
  registrarAsoSchema,
  registrarTurmaSchema,
  situacaoDoTreinamentoSchema,
} from "@davinci/types";
import { linhasDoFormulario } from "./linhas-do-formulario";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

const CATALOGO = "/cadastros/treinamentos";
const ficha = (id: string, aviso: string) =>
  `/cadastros/funcionarios/${id}?aviso=${aviso}`;

/** Só caminhos internos. */
function destino(voltar: FormDataEntryValue | null, aviso: string): string {
  const base =
    typeof voltar === "string" &&
    voltar.startsWith("/") &&
    !voltar.startsWith("//")
      ? voltar
      : CATALOGO;
  return `${base}${base.includes("?") ? "&" : "?"}aviso=${aviso}`;
}

export async function registrarAso(
  funcionarioId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    registrarAsoSchema,
    {
      ...valores,
      funcionarioId,
      proximoExame: valores.proximoExame || undefined,
      ufCrm: valores.ufCrm || undefined,
      exames: linhasDoFormulario(form, ["data", "procedimento"], "exames"),
    },
    "/asos",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(ficha(funcionarioId, "aso"));
}

export async function anularAso(
  id: string,
  funcionarioId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    anularRegistroSchema,
    { motivo: valores.motivo },
    `/asos/${id}/anular`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(ficha(funcionarioId, "aso-anulado"));
}

export async function salvarTreinamento(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    ...valores,
    validadeMeses: valores.validadeMeses?.trim() || undefined,
  };
  const r = id
    ? await chamar(
        atualizarTreinamentoSchema,
        { ...dados, versao: versaoDe(form) },
        `/treinamentos/${id}`,
        "PUT",
        valores,
      )
    : await chamar(
        novoTreinamentoSchema,
        dados,
        "/treinamentos",
        "POST",
        valores,
      );
  if ("erro" in r) return r;
  redirect(`${CATALOGO}?aviso=${id ? "salvo" : "criado"}`);
}

export async function mudarSituacaoDoTreinamento(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const ativo = form.get("ativo") === "sim";
  const r = await chamar(
    situacaoDoTreinamentoSchema,
    { versao: versaoDe(form), ativo },
    `/treinamentos/${id}/situacao`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${CATALOGO}?aviso=${ativo ? "ativado" : "inativado"}`);
}

export async function registrarTurma(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const funcionarioIds = form.getAll("funcionarioIds").map(String);
  valores.funcionarioIds = funcionarioIds.join(",");
  const r = await chamar(
    registrarTurmaSchema,
    {
      treinamentoId: valores.treinamentoId,
      data: valores.data,
      instrutor: valores.instrutor,
      funcionarioIds,
    },
    "/treinamentos/turmas",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(destino(form.get("voltar"), "turma"));
}

export async function anularTreinamentoRealizado(
  id: string,
  funcionarioId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    anularRegistroSchema,
    { motivo: valores.motivo },
    `/treinamentos/realizados/${id}/anular`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(ficha(funcionarioId, "treinamento-anulado"));
}
