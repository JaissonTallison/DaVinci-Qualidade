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
      parecer: valores.parecer || undefined,
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

type Registro = Record<string, unknown>;
const t = (v: unknown) => (v == null ? "" : String(v));
const BUSCA_DE_VINCULO: Record<
  string,
  { endpoint: string; rotulo: (r: Registro) => string }
> = {
  nao_conformidade: {
    endpoint: "/nao-conformidades",
    rotulo: (r) => `${t(r.numero)} · ${t(r.titulo)}`,
  },
  plano_de_acao: {
    endpoint: "/planos-de-acao",
    rotulo: (r) => `${t(r.numero)} · ${t(r.titulo)}`,
  },
  inspecao: {
    endpoint: "/inspecoes",
    rotulo: (r) => `${t(r.numero)} · ${t(r.objeto)}`,
  },
  documento: {
    endpoint: "/documentos",
    rotulo: (r) => `${t(r.codigo)} · ${t(r.titulo)}`,
  },
  risco: {
    endpoint: "/riscos-e-oportunidades",
    rotulo: (r) => `${t(r.processo)} · ${t(r.descricao)}`,
  },
};

/** Busca registros reais de um módulo para ligar ao processo (usado pelo seletor de vínculo). */
export async function buscarRegistrosParaVinculo(
  tipo: string,
  termo: string,
): Promise<{ id: string; rotulo: string }[]> {
  const cfg = BUSCA_DE_VINCULO[tipo];
  if (!cfg) return [];
  const r = await chamarApi<unknown>(cfg.endpoint);
  if (!r.ok) return [];
  const corpo = r.dados;
  const itens = (
    Array.isArray(corpo) ? corpo : ((corpo as { dados?: unknown[] }).dados ?? [])
  ) as Registro[];
  const termoNorm = termo.trim().toLowerCase();
  return itens
    .map((x) => ({ id: t(x.id), rotulo: cfg.rotulo(x) }))
    .filter((x) => x.id && (!termoNorm || x.rotulo.toLowerCase().includes(termoNorm)))
    .slice(0, 20);
}

export async function adicionarVinculoProcesso(form: FormData): Promise<void> {
  const processoId = String(form.get("processoId") ?? "");
  const r = await chamarApi(`/processos/${processoId}/vinculos`, {
    metodo: "POST",
    corpo: {
      tipo: String(form.get("tipo") ?? ""),
      registroId: String(form.get("registroId") ?? ""),
      rotulo: String(form.get("rotulo") ?? ""),
    },
  });
  redirect(
    `/qualidade/processos/${processoId}?aviso=${r.ok ? "vinculado" : "erro-vinculo"}`,
  );
}

export async function removerVinculoProcesso(form: FormData): Promise<void> {
  const processoId = String(form.get("processoId") ?? "");
  const vinculoId = String(form.get("vinculoId") ?? "");
  const r = await chamarApi(`/processos/${processoId}/vinculos/${vinculoId}`, {
    metodo: "DELETE",
  });
  redirect(
    `/qualidade/processos/${processoId}?aviso=${r.ok ? "vinculo-removido" : "erro-vinculo"}`,
  );
}

/** Gera um rascunho de diagrama a partir de texto, com a IA do Claude. */
export async function gerarDiagramaIaProcesso(
  texto: string,
): Promise<{ diagrama: DiagramaProcesso } | { erro: ErroPadrao }> {
  const r = await chamarApi<DiagramaProcesso>("/processos/ia-diagrama", {
    metodo: "POST",
    corpo: { texto },
  });
  return r.ok ? { diagrama: r.dados } : { erro: r.erro };
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
