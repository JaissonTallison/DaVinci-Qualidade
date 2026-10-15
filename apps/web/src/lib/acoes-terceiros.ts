"use server";

import { redirect } from "next/navigation";
import {
  atualizarTerceiroSchema,
  novoTerceiroSchema,
  registrarDocTerceiroSchema,
  type Terceiro,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

const BASE = "/seguranca/terceiros";

export async function salvarTerceiro(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = { ...valores, fimContrato: valores.fimContrato || undefined };
  const r = id
    ? await chamar<Terceiro>(
        atualizarTerceiroSchema,
        { ...dados, versao: versaoDe(form) },
        `/terceiros/${id}`,
        "PUT",
        valores,
      )
    : await chamar<Terceiro>(
        novoTerceiroSchema,
        dados,
        "/terceiros",
        "POST",
        valores,
      );
  if ("erro" in r) return r;
  redirect(`${BASE}/${r.dados.id}?aviso=${id ? "salvo" : "criado"}`);
}

export async function registrarDocumentoDoTerceiro(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Terceiro>(
    registrarDocTerceiroSchema,
    valores,
    `/terceiros/${id}/documentos`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=documento`);
}
