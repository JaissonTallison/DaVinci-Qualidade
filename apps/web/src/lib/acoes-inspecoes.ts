"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import {
  atualizarModeloSchema,
  cancelarInspecaoSchema,
  detalhesDaValidacao,
  novaInspecaoSchema,
  novoModeloSchema,
  responderInspecaoSchema,
  situacaoDoModeloSchema,
  type ErroPadrao,
  type Inspecao,
  type ModeloDeInspecao,
} from "@davinci/types";
import { chamarApi } from "./api";

export type EstadoDaAcao = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
  itens?: Record<string, string>[];
  /** Versão nova quando as respostas foram gravadas mas a conclusão foi recusada: a tela continua dela. */
  versao?: string;
};

const BASE = "/qualidade/inspecoes";
const MODELOS = "/qualidade/modelos-de-inspecao";
const CONFIRA = "Verifique os campos destacados.";

function textos(form: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [chave, valor] of form.entries())
    if (
      typeof valor === "string" &&
      chave !== "versao" &&
      !chave.startsWith("item_")
    )
      valores[chave] = valor;
  return valores;
}

/** Itens digitados (`item_verificar` e `item_criterio` repetidos), sem as linhas vazias. */
function itensDoFormulario(form: FormData): Record<string, string>[] {
  const verificar = form.getAll("item_verificar").map(String);
  const criterio = form.getAll("item_criterio").map(String);
  return verificar
    .map((v, i) => ({ verificar: v, criterio: criterio[i] ?? "" }))
    .filter((i) => i.verificar.trim() || i.criterio.trim());
}

async function chamar<T>(
  schema: z.ZodType,
  dados: Record<string, unknown>,
  caminho: string,
  metodo: "POST" | "PUT",
  extra: Omit<EstadoDaAcao, "erro"> = {},
) {
  const v = schema.safeParse(dados);
  if (!v.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: CONFIRA,
        detalhes: detalhesDaValidacao(v.error.issues),
      } as ErroPadrao,
      ...extra,
    };
  const r = await chamarApi<T>(caminho, { metodo, corpo: dados });
  return r.ok ? { dados: r.dados } : { erro: r.erro, ...extra };
}

// ---------------------------------------------------------------- inspeções

export async function criarInspecao(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const itens = itensDoFormulario(form);
  const dados = {
    ...valores,
    nqa: valores.nqa || undefined,
    nivelInspecao: valores.nqa ? valores.nivelInspecao : undefined,
    fornecedorId: valores.fornecedorId || undefined,
    modeloId: valores.modeloId || undefined,
    itens: valores.modeloId ? undefined : itens,
  };
  const r = await chamar<Inspecao>(
    novaInspecaoSchema,
    dados,
    "/inspecoes",
    "POST",
    { valores, itens },
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${r.dados.id}`);
}

/** Respostas da tela (`resposta_<itemId>`, `observacao_<itemId>`). Com `concluir`, grava e conclui em seguida. */
export async function salvarRespostas(
  inspecao: { id: string; itemIds: string[] },
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const respostas = inspecao.itemIds.map((itemId) => ({
    itemId,
    resposta: String(form.get(`resposta_${itemId}`) ?? "") || null,
    observacao: String(form.get(`observacao_${itemId}`) ?? ""),
  }));
  const dados = {
    versao: String(form.get("versao") ?? ""),
    respostas,
    observacoes: valores.observacoes ?? "",
  };
  const salvo = await chamar<Inspecao>(
    responderInspecaoSchema,
    dados,
    `/inspecoes/${inspecao.id}/respostas`,
    "POST",
    { valores },
  );
  if ("erro" in salvo) return salvo;
  if (form.get("concluir") !== "sim")
    redirect(`${BASE}/${inspecao.id}?aviso=salva`);
  const concluida = await chamarApi<Inspecao>(
    `/inspecoes/${inspecao.id}/concluir`,
    {
      metodo: "POST",
      corpo: {
        versao: salvo.dados.versao,
        defeituosos: valores.defeituosos || undefined,
      },
    },
  );
  // As respostas já ficaram salvas: o erro de conclusão (ex.: NOK sem observação) aparece com a tela atualizada
  if (!concluida.ok)
    return { erro: concluida.erro, valores, versao: salvo.dados.versao };
  redirect(`${BASE}/${inspecao.id}?aviso=${concluida.dados.status}`);
}

export async function cancelarInspecao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar<Inspecao>(
    cancelarInspecaoSchema,
    { motivo: valores.motivo, versao: String(form.get("versao") ?? "") },
    `/inspecoes/${id}/cancelar`,
    "POST",
    { valores },
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=cancelada`);
}

// ---------------------------------------------------------------- modelos

export async function salvarModelo(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const itens = itensDoFormulario(form);
  const dados = {
    ...valores,
    itens,
    ...(id ? { versao: String(form.get("versao") ?? "") } : {}),
  };
  const r = id
    ? await chamar<ModeloDeInspecao>(
        atualizarModeloSchema,
        dados,
        `/modelos-de-inspecao/${id}`,
        "PUT",
        { valores, itens },
      )
    : await chamar<ModeloDeInspecao>(
        novoModeloSchema,
        dados,
        "/modelos-de-inspecao",
        "POST",
        { valores, itens },
      );
  if ("erro" in r) return r;
  redirect(`${MODELOS}?aviso=${id ? "salvo" : "criado"}`);
}

export async function mudarSituacaoDoModelo(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const acao = form.get("acao") === "reativar" ? "reativar" : "inativar";
  const r = await chamar<ModeloDeInspecao>(
    situacaoDoModeloSchema,
    { versao: String(form.get("versao") ?? "") },
    `/modelos-de-inspecao/${id}/${acao}`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(
    `${MODELOS}?aviso=${acao === "reativar" ? "reativado" : "inativado"}`,
  );
}
