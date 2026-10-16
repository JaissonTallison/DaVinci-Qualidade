"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  atualizarFmeaSchema,
  atualizarPlanoDeControleSchema,
  atualizarPpapSchema,
  decidirPpapSchema,
  ELEMENTOS_DO_PPAP,
  novoFmeaSchema,
  novoPlanoDeControleSchema,
  novoPpapSchema,
  submeterPpapSchema,
  type Fmea,
  type PlanoDeControle,
  type Ppap,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";
import { linhasDoFormulario } from "./linhas-do-formulario";

const FMEA = "/qualidade/fmea";
const PC = "/qualidade/planos-de-controle";
const PPAP = "/qualidade/ppap";

const linhasDe = linhasDoFormulario;

const CAMPOS_FMEA = [
  "etapa",
  "funcao",
  "modoDeFalha",
  "efeito",
  "severidade",
  "classificacao",
  "causa",
  "prevencao",
  "ocorrencia",
  "deteccao",
  "notaDeteccao",
  "acao",
  "responsavel",
  "prazo",
  "statusAcao",
] as const;
const CAMPOS_PC = [
  "etapa",
  "maquina",
  "caracteristica",
  "tipo",
  "classificacao",
  "especificacao",
  "metodo",
  "amostra",
  "frequencia",
  "controle",
  "reacao",
] as const;

const cabecalho = (v: Record<string, string>, campos: string[]) =>
  Object.fromEntries(campos.map((c) => [c, v[c] || undefined]));

export async function criarFmea(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Fmea>(
    novoFmeaSchema,
    {
      ...cabecalho(valores, ["titulo", "item", "cliente", "equipe", "revisao"]),
      linhas: [],
    },
    "/fmeas",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${FMEA}/${r.dados.id}`);
}

export async function salvarFmea(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    ...cabecalho(valores, ["titulo", "item", "cliente", "equipe", "revisao"]),
    versao: versaoDe(form),
    linhas: linhasDe(form, CAMPOS_FMEA),
  };
  const r = await chamar<Fmea>(
    atualizarFmeaSchema,
    dados,
    `/fmeas/${id}`,
    "PUT",
    valores,
  );
  if ("erro" in r) return r;
  revalidatePath(`${FMEA}/${id}`);
  redirect(`${FMEA}/${id}?aviso=salvo`);
}

export async function criarPlanoDeControle(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<PlanoDeControle>(
    novoPlanoDeControleSchema,
    {
      ...cabecalho(valores, ["titulo", "item", "fase", "revisao", "fmeaId"]),
      linhas: [],
    },
    "/planos-de-controle",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${PC}/${r.dados.id}`);
}

export async function salvarPlanoDeControle(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    ...cabecalho(valores, ["titulo", "item", "fase", "revisao", "fmeaId"]),
    versao: versaoDe(form),
    linhas: linhasDe(form, CAMPOS_PC),
  };
  const r = await chamar<PlanoDeControle>(
    atualizarPlanoDeControleSchema,
    dados,
    `/planos-de-controle/${id}`,
    "PUT",
    valores,
  );
  if ("erro" in r) return r;
  revalidatePath(`${PC}/${id}`);
  redirect(`${PC}/${id}?aviso=salvo`);
}

const CABECALHO_PPAP = [
  "peca",
  "numeroDaPeca",
  "revisaoDoDesenho",
  "cliente",
  "nivel",
  "motivo",
  "fmeaId",
  "planoDeControleId",
];

export async function criarPpap(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Ppap>(
    novoPpapSchema,
    cabecalho(valores, CABECALHO_PPAP),
    "/ppaps",
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${PPAP}/${r.dados.id}`);
}

export async function salvarPpap(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const elementos = Object.fromEntries(
    Object.keys(ELEMENTOS_DO_PPAP)
      .filter((e) => form.has(`status_${e}`))
      .map((e) => [
        e,
        {
          status: String(form.get(`status_${e}`)),
          observacao: String(form.get(`obs_${e}`) ?? ""),
        },
      ]),
  );
  const r = await chamar<Ppap>(
    atualizarPpapSchema,
    {
      ...cabecalho(valores, CABECALHO_PPAP),
      versao: versaoDe(form),
      elementos,
    },
    `/ppaps/${id}`,
    "PUT",
    valores,
  );
  if ("erro" in r) return r;
  revalidatePath(`${PPAP}/${id}`);
  redirect(`${PPAP}/${id}?aviso=salvo`);
}

export async function submeterPpap(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Ppap>(
    submeterPpapSchema,
    { versao: versaoDe(form), data: valores.data },
    `/ppaps/${id}/submeter`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${PPAP}/${id}?aviso=submetido`);
}

export async function decidirPpap(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Ppap>(
    decidirPpapSchema,
    {
      versao: versaoDe(form),
      decisao: valores.decisao,
      parecer: valores.parecer,
    },
    `/ppaps/${id}/decisao`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${PPAP}/${id}?aviso=decidido`);
}
