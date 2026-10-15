"use server";

import { redirect } from "next/navigation";
import {
  atualizarAspectoSchema,
  atualizarRequisitoSchema,
  avaliarRequisitoSchema,
  cumprirCondicionanteSchema,
  novaCondicionanteSchema,
  novaLicencaSchema,
  novoAspectoSchema,
  novoRequisitoSchema,
  novoResiduoSchema,
  registrarCdfSchema,
  registrarSaidaSchema,
  renovacaoSolicitadaSchema,
  situacaoDoAspectoSchema,
  type AspectoAmbiental,
  type Licenca,
  type RequisitoLegal,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

/** Checkbox "requisito legal" vira booleano; o resto vai como texto (o schema converte). */
function dadosDoAspecto(form: FormData) {
  const v = textos(form);
  return { v, dados: { ...v, requisitoLegal: v.requisitoLegal === "sim" } };
}

export async function criarAspecto(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const { v, dados } = dadosDoAspecto(form);
  const r = await chamar<AspectoAmbiental>(
    novoAspectoSchema,
    dados,
    "/aspectos-ambientais",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/ambiental/aspectos/${r.dados.id}?aviso=criado`);
}

export async function atualizarAspecto(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const { v, dados } = dadosDoAspecto(form);
  const r = await chamar(
    atualizarAspectoSchema,
    { ...dados, versao: versaoDe(form) },
    `/aspectos-ambientais/${id}`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/ambiental/aspectos/${id}?aviso=salvo`);
}

export async function situacaoDoAspecto(
  id: string,
  ativo: boolean,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar(
    situacaoDoAspectoSchema,
    { versao: versaoDe(form), ativo },
    `/aspectos-ambientais/${id}/situacao`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(
    `/ambiental/aspectos/${id}?aviso=${ativo ? "reativado" : "inativado"}`,
  );
}

export async function criarRequisito(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<RequisitoLegal>(
    novoRequisitoSchema,
    v,
    "/requisitos-legais",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/ambiental/requisitos/${r.dados.id}?aviso=criado`);
}

export async function atualizarRequisito(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    atualizarRequisitoSchema,
    { ...v, versao: versaoDe(form) },
    `/requisitos-legais/${id}`,
    "PUT",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/ambiental/requisitos/${id}?aviso=salvo`);
}

export async function avaliarRequisito(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    avaliarRequisitoSchema,
    { ...v, versao: versaoDe(form) },
    `/requisitos-legais/${id}/avaliacao`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/ambiental/requisitos/${id}?aviso=avaliado`);
}

export async function criarLicenca(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar<Licenca>(novaLicencaSchema, v, "/licencas", "POST", v);
  if ("erro" in r) return r;
  redirect(`/ambiental/licencas/${r.dados.id}?aviso=criada`);
}

export async function solicitarRenovacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    renovacaoSolicitadaSchema,
    { ...v, versao: versaoDe(form) },
    `/licencas/${id}/renovacao`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/ambiental/licencas/${id}?aviso=renovacao`);
}

export async function criarCondicionante(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    novaCondicionanteSchema,
    v,
    `/licencas/${id}/condicionantes`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/ambiental/licencas/${id}?aviso=condicionante`);
}

export async function cumprirCondicionante(
  licencaId: string,
  condicionanteId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    cumprirCondicionanteSchema,
    v,
    `/licencas/condicionantes/${condicionanteId}/cumprimento`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect(`/ambiental/licencas/${licencaId}?aviso=cumprida`);
}

export async function criarResiduo(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(novoResiduoSchema, v, "/residuos", "POST", v);
  if ("erro" in r) return r;
  redirect("/ambiental/residuos?aviso=residuo");
}

export async function registrarSaida(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    registrarSaidaSchema,
    v,
    "/residuos/saidas",
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect("/ambiental/residuos?aviso=saida");
}

export async function registrarCdf(
  saidaId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const v = textos(form);
  const r = await chamar(
    registrarCdfSchema,
    v,
    `/residuos/saidas/${saidaId}/cdf`,
    "POST",
    v,
  );
  if ("erro" in r) return r;
  redirect("/ambiental/residuos?aviso=cdf");
}
