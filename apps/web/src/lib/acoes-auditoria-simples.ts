"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  atualizarAuditoriaSimplesSchema,
  novaAuditoriaSimplesSchema,
  type AuditoriaSimples,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";
import { chamarApi } from "./api";
import { linhasDoFormulario } from "./linhas-do-formulario";

const LISTA = "/auditorias/simples";
const CAMPOS = [
  "setor",
  "comentarios",
  "pontosPositivos",
  "observacoes",
  "naoConformidade",
] as const;

function dadosDoForm(form: FormData, v: Record<string, string>) {
  return {
    data: v.data,
    horario: v.horario || undefined,
    unidade: v.unidade || undefined,
    setoresEnvolvidos: v.setoresEnvolvidos || undefined,
    auditores: v.auditores || undefined,
    areaFoco: v.areaFoco || undefined,
    linhas: linhasDoFormulario(form, CAMPOS),
  };
}

export async function salvarAuditoriaSimples(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const base = dadosDoForm(form, v);
  const r = id
    ? await chamar<AuditoriaSimples>(
        atualizarAuditoriaSimplesSchema,
        { ...base, versao: versaoDe(form) },
        `/auditorias-simples/${id}`,
        "PUT",
        v,
      )
    : await chamar<AuditoriaSimples>(
        novaAuditoriaSimplesSchema,
        base,
        "/auditorias-simples",
        "POST",
        v,
      );
  if ("erro" in r) return r;
  redirect(`${LISTA}/${r.dados.id}?aviso=salvo`);
}

export async function excluirAuditoriaSimples(id: string): Promise<void> {
  const r = await chamarApi(`/auditorias-simples/${id}`, { metodo: "DELETE" });
  if (!r.ok) redirect(`${LISTA}/${id}?aviso=erro-excluir`);
  revalidatePath(LISTA);
  redirect(`${LISTA}?aviso=excluida`);
}
