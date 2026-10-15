"use server";

import { redirect } from "next/navigation";
import {
  atualizarRoSchema,
  decidirMudancaSchema,
  encerrarRoSchema,
  implementarMudancaSchema,
  novaAnaliseCriticaSchema,
  novaMudancaSchema,
  novoObjetivoSchema,
  novoRoSchema,
  registrarMedicaoSchema,
  situacaoDoObjetivoSchema,
  type AnaliseCritica,
  type Mudanca,
  type ResultadoDosAvisos,
  type RiscoOuOportunidade,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";
import { chamarApi } from "./api";

const RO = "/sgi/riscos-e-oportunidades";

export async function salvarRo(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = { ...valores, prazo: valores.prazo || undefined };
  const r = id
    ? await chamar<RiscoOuOportunidade>(
        atualizarRoSchema,
        { ...dados, versao: versaoDe(form) },
        `/riscos-e-oportunidades/${id}`,
        "PUT",
        valores,
      )
    : await chamar<RiscoOuOportunidade>(
        novoRoSchema,
        dados,
        "/riscos-e-oportunidades",
        "POST",
        valores,
      );
  if ("erro" in r) return r;
  redirect(`${RO}/${r.dados.id}?aviso=${id ? "salvo" : "criado"}`);
}

export async function encerrarRo(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    encerrarRoSchema,
    { versao: versaoDe(form), resultado: valores.resultado },
    `/riscos-e-oportunidades/${id}/encerrar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${RO}/${id}?aviso=encerrado`);
}

export async function criarObjetivo(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    novoObjetivoSchema,
    valores,
    "/objetivos",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect("/sgi/objetivos?aviso=criado");
}

export async function registrarMedicao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    registrarMedicaoSchema,
    {
      competencia: valores.competencia,
      valor: valores.valor,
      analise: valores.analise,
    },
    `/objetivos/${id}/medicoes`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect("/sgi/objetivos?aviso=medicao");
}

export async function situacaoDoObjetivo(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const ativo = form.get("ativo") === "sim";
  const r = await chamar(
    situacaoDoObjetivoSchema,
    { versao: versaoDe(form), ativo },
    `/objetivos/${id}/situacao`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`/sgi/objetivos?aviso=${ativo ? "reativado" : "inativado"}`);
}

export async function criarAnaliseCritica(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<AnaliseCritica>(
    novaAnaliseCriticaSchema,
    valores,
    "/analises-criticas",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/sgi/analises-criticas/${r.dados.id}?aviso=criada`);
}

export async function proporMudanca(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Mudanca>(
    novaMudancaSchema,
    valores,
    "/mudancas",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/sgi/mudancas/${r.dados.id}?aviso=proposta`);
}

export async function decidirMudanca(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const aprovar =
    valores.decisao === "aprovar"
      ? true
      : valores.decisao === "rejeitar"
        ? false
        : undefined;
  const r = await chamar(
    decidirMudancaSchema,
    { versao: versaoDe(form), aprovar, parecer: valores.parecer },
    `/mudancas/${id}/decidir`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/sgi/mudancas/${id}?aviso=${aprovar ? "aprovada" : "rejeitada"}`);
}

export async function implementarMudanca(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    implementarMudancaSchema,
    { versao: versaoDe(form), verificacao: valores.verificacao },
    `/mudancas/${id}/implementar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`/sgi/mudancas/${id}?aviso=implementada`);
}

/** Manda agora o aviso por e-mail da empresa (o automático sai todo dia às 7h). */
export async function enviarAvisosAgora(): Promise<
  EstadoDaAcao & { enviados?: number }
> {
  const r = await chamarApi<ResultadoDosAvisos>("/paineis/avisos/enviar", {
    metodo: "POST",
    corpo: {},
  });
  return r.ok ? { enviados: r.dados.emails } : { erro: r.erro };
}
