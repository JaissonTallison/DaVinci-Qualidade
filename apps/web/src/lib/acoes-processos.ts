"use server";

import { redirect } from "next/navigation";
import {
  aprovarProcessoSchema,
  atualizarProcessoSchema,
  cancelarProcessoSchema,
  encerrarProcessoSchema,
  enviarRevisaoProcessoSchema,
  novaRevisaoProcessoSchema,
  novoProcessoSchema,
  publicarProcessoSchema,
  type Processo,
} from "@davinci/types";
import type { DiagramaProcesso, Documento, ErroPadrao } from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";
import { chamarApi } from "./api";

/** Cria (id nulo) ou edita um processo. */
export async function salvarProcesso(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = id
    ? await chamar<Processo>(
        atualizarProcessoSchema,
        { ...valores, versao: versaoDe(form) },
        `/processos/${id}`,
        "PUT",
        valores,
      )
    : await chamar<Processo>(
        novoProcessoSchema,
        valores,
        "/processos",
        "POST",
        valores,
      );
  if ("erro" in r) return r;
  redirect(`/qualidade/processos/${r.dados.id}?aviso=${id ? "salvo" : "criado"}`);
}

export async function enviarRevisaoProcesso(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar(
    enviarRevisaoProcessoSchema,
    { versao: versaoDe(form) },
    `/processos/${id}/enviar-revisao`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`/qualidade/processos/${id}?aviso=enviado`);
}

export async function aprovarProcesso(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    aprovarProcessoSchema,
    {
      versao: versaoDe(form),
      dataProximaRevisao: valores.dataProximaRevisao || undefined,
    },
    `/processos/${id}/aprovar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/qualidade/processos/${id}?aviso=aprovado`);
}

export async function publicarProcesso(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar(
    publicarProcessoSchema,
    { versao: versaoDe(form) },
    `/processos/${id}/publicar`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`/qualidade/processos/${id}?aviso=publicado`);
}

export async function novaRevisaoProcesso(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    novaRevisaoProcessoSchema,
    { versao: versaoDe(form), oQueMudou: valores.oQueMudou },
    `/processos/${id}/nova-revisao`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/qualidade/processos/${id}?aviso=revisao`);
}

export async function encerrarProcesso(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    encerrarProcessoSchema,
    { versao: versaoDe(form), motivo: valores.motivo },
    `/processos/${id}/encerrar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/qualidade/processos/${id}?aviso=obsoleto`);
}

/**
 * Cria um Documento controlado (módulo SGI) a partir do processo, para seguir o fluxo de
 * revisão/aprovação de documentos. Exige permissão sgi.editar.
 */
export async function criarDocumentoDoProcesso(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamarApi<Documento>("/documentos", {
    metodo: "POST",
    corpo: {
      codigo: String(form.get("codigo") ?? ""),
      titulo: String(form.get("nome") ?? ""),
      tipo: "procedimento",
      area: (form.get("departamento") as string) || undefined,
      elaboradoPor: String(form.get("elaboradoPor") ?? ""),
    },
  });
  if (!r.ok) return { erro: r.erro };
  redirect(`/sgi/documentos/${r.dados.id}?aviso=criado`);
}

/** Salva o diagrama. Retorna a nova versão (para a próxima gravação) ou o erro. */
export async function salvarDiagramaProcesso(
  id: string,
  versao: string,
  conteudo: DiagramaProcesso,
): Promise<{ versao: string } | { erro: ErroPadrao }> {
  const r = await chamarApi<Processo>(`/processos/${id}/diagrama`, {
    metodo: "POST",
    corpo: { versao, conteudo },
  });
  return r.ok ? { versao: r.dados.versao } : { erro: r.erro };
}

export async function cancelarProcesso(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    cancelarProcessoSchema,
    { versao: versaoDe(form), motivo: valores.motivo },
    `/processos/${id}/cancelar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/qualidade/processos/${id}?aviso=cancelado`);
}
