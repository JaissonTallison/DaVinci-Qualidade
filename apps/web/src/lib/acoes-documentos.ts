"use server";

import { redirect } from "next/navigation";
import {
  aprovarDocumentoSchema,
  atualizarDocumentoSchema,
  enviarRevisaoDocumentoSchema,
  novaRevisaoDocumentoSchema,
  novoDocumentoSchema,
  obsoletarDocumentoSchema,
  type Documento,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

/** Cria (id nulo) ou edita um documento. */
export async function salvarDocumento(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = { ...valores, area: valores.area || undefined };
  const r = id
    ? await chamar<Documento>(
        atualizarDocumentoSchema,
        { ...dados, versao: versaoDe(form) },
        `/documentos/${id}`,
        "PUT",
        valores,
      )
    : await chamar<Documento>(
        novoDocumentoSchema,
        dados,
        "/documentos",
        "POST",
        valores,
      );
  if ("erro" in r) return r;
  redirect(`/sgi/documentos/${r.dados.id}?aviso=${id ? "salvo" : "criado"}`);
}

export async function enviarRevisaoDocumento(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar(
    enviarRevisaoDocumentoSchema,
    { versao: versaoDe(form) },
    `/documentos/${id}/enviar-revisao`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`/sgi/documentos/${id}?aviso=enviado`);
}

export async function aprovarDocumento(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    aprovarDocumentoSchema,
    {
      versao: versaoDe(form),
      dataVigencia: valores.dataVigencia,
      proximaRevisao: valores.proximaRevisao || undefined,
    },
    `/documentos/${id}/aprovar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/sgi/documentos/${id}?aviso=aprovado`);
}

export async function novaRevisaoDocumento(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    novaRevisaoDocumentoSchema,
    { versao: versaoDe(form), oQueMudou: valores.oQueMudou },
    `/documentos/${id}/nova-revisao`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/sgi/documentos/${id}?aviso=revisao`);
}

export async function obsoletarDocumento(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    obsoletarDocumentoSchema,
    { versao: versaoDe(form), motivo: valores.motivo },
    `/documentos/${id}/obsoletar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/sgi/documentos/${id}?aviso=obsoleto`);
}
