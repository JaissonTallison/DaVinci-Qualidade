"use server";

import { redirect } from "next/navigation";
import {
  atualizarFuncaoSchema,
  atualizarFuncionarioSchema,
  atualizarSetorSchema,
  desligarFuncionarioSchema,
  novaFuncaoSchema,
  novoFuncionarioSchema,
  novoSetorSchema,
  readmitirFuncionarioSchema,
  situacaoDoCadastroSchema,
  type Funcionario,
} from "@davinci/types";
import { chamar, textos, versaoDe, type EstadoDaAcao } from "./acao";

const FUNCIONARIOS = "/cadastros/funcionarios";
const ESTRUTURA = "/cadastros/setores-e-funcoes";

export async function salvarFuncionario(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = id
    ? await chamar<Funcionario>(
        atualizarFuncionarioSchema,
        { ...valores, versao: versaoDe(form) },
        `/funcionarios/${id}`,
        "PUT",
        valores,
      )
    : await chamar<Funcionario>(
        novoFuncionarioSchema,
        valores,
        "/funcionarios",
        "POST",
        valores,
      );
  if ("erro" in r) return r;
  redirect(`${FUNCIONARIOS}/${r.dados.id}?aviso=${id ? "salvo" : "criado"}`);
}

export async function desligarFuncionario(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Funcionario>(
    desligarFuncionarioSchema,
    { ...valores, versao: versaoDe(form) },
    `/funcionarios/${id}/desligar`,
    "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${FUNCIONARIOS}/${id}?aviso=desligado`);
}

export async function readmitirFuncionario(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar<Funcionario>(
    readmitirFuncionarioSchema,
    { versao: versaoDe(form) },
    `/funcionarios/${id}/readmitir`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${FUNCIONARIOS}/${id}?aviso=readmitido`);
}

type Estrutura = "setor" | "funcao";
const CAMINHO: Record<Estrutura, string> = {
  setor: "/setores-da-empresa",
  funcao: "/funcoes",
};

/** Setor ou função: cadastrar (sem id) ou renomear. */
export async function salvarEstrutura(
  tipo: Estrutura,
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const schema =
    tipo === "setor"
      ? id
        ? atualizarSetorSchema
        : novoSetorSchema
      : id
        ? atualizarFuncaoSchema
        : novaFuncaoSchema;
  const r = await chamar(
    schema,
    id ? { ...valores, versao: versaoDe(form) } : valores,
    id ? `${CAMINHO[tipo]}/${id}` : CAMINHO[tipo],
    id ? "PUT" : "POST",
    valores,
  );
  if ("erro" in r) return r;
  redirect(`${ESTRUTURA}?aviso=${tipo}-${id ? "salvo" : "criado"}`);
}

export async function mudarSituacaoDaEstrutura(
  tipo: Estrutura,
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const ativo = form.get("ativo") === "sim";
  const r = await chamar(
    situacaoDoCadastroSchema,
    { versao: versaoDe(form), ativo },
    `${CAMINHO[tipo]}/${id}/situacao`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${ESTRUTURA}?aviso=${tipo}-${ativo ? "ativado" : "inativado"}`);
}
