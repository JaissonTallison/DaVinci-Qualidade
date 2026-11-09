"use server";

import { redirect } from "next/navigation";
import { salvarConfigQualidadeSchema } from "@davinci/types";
import { chamar, type EstadoDaAcao } from "@/lib/acao";

/** Salva as configurações do módulo Qualidade (ERR-09: verificação de eficácia). */
export async function salvarConfigQualidade(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar(
    salvarConfigQualidadeSchema,
    { autoVerificacaoEficacia: form.get("autoVerificacaoEficacia") === "sim" },
    "/nao-conformidades/configuracao",
    "PUT",
  );
  if ("erro" in r) return r;
  redirect("/qualidade/configuracoes/eficacia?aviso=salvo");
}
