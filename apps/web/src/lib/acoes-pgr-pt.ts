"use server";

import { redirect } from "next/navigation";
import {
  atualizarRiscoSchema,
  cancelarPtSchema,
  encerrarPtSchema,
  liberarPtSchema,
  novaPtSchema,
  novoRiscoSchema,
  situacaoDoRiscoSchema,
  anularRegistroSstSchema,
  novoRegistroSstSchema,
  type PermissaoDeTrabalho,
  type RegistroSst,
  type Risco,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

const PGR = "/seguranca/pgr";
const PTS = "/seguranca/permissoes-de-trabalho";

export async function salvarRisco(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = { ...valores, prazo: valores.prazo || undefined };
  const r = id
    ? await chamar<Risco>(
        atualizarRiscoSchema,
        { ...dados, versao: versaoDe(form) },
        `/riscos/${id}`,
        "PUT",
        valores,
      )
    : await chamar<Risco>(novoRiscoSchema, dados, "/riscos", "POST", valores);
  if ("erro" in r) return r;
  redirect(`${PGR}/${r.dados.id}?aviso=${id ? "salvo" : "criado"}`);
}

export async function mudarSituacaoDoRisco(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const ativo = form.get("ativo") === "sim";
  const r = await chamar<Risco>(
    situacaoDoRiscoSchema,
    { versao: versaoDe(form), ativo },
    `/riscos/${id}/situacao`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${PGR}/${id}?aviso=${ativo ? "reativado" : "eliminado"}`);
}

export async function solicitarPt(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<PermissaoDeTrabalho>(
    novaPtSchema,
    valores,
    "/permissoes-de-trabalho",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${PTS}/${r.dados.id}?aviso=solicitada`);
}

export async function liberarPt(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar<PermissaoDeTrabalho>(
    liberarPtSchema,
    { versao: versaoDe(form) },
    `/permissoes-de-trabalho/${id}/liberar`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${PTS}/${id}?aviso=liberada`);
}

export async function encerrarPt(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<PermissaoDeTrabalho>(
    encerrarPtSchema,
    { versao: versaoDe(form), observacao: valores.observacao },
    `/permissoes-de-trabalho/${id}/encerrar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${PTS}/${id}?aviso=encerrada`);
}

export async function cancelarPt(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<PermissaoDeTrabalho>(
    cancelarPtSchema,
    { versao: versaoDe(form), motivo: valores.motivo },
    `/permissoes-de-trabalho/${id}/cancelar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${PTS}/${id}?aviso=cancelada`);
}

export async function criarRegistroSst(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<RegistroSst>(
    novoRegistroSstSchema,
    valores,
    "/registros-de-seguranca",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/seguranca/registros/${r.dados.id}?aviso=criado`);
}

export async function anularRegistroSst(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<RegistroSst>(
    anularRegistroSstSchema,
    { motivo: valores.motivo },
    `/registros-de-seguranca/${id}/anular`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/seguranca/registros/${id}?aviso=anulado`);
}
