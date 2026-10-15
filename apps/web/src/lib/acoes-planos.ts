"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import {
  cancelarPlanoSchema,
  cancelarTarefaSchema,
  concluirTarefaSchema,
  detalhesDaValidacao,
  incluirTarefaSchema,
  novoPlanoSchema,
  reabrirTarefaSchema,
  verificarEficaciaPlanoSchema,
  type ErroPadrao,
  type PlanoDeAcao,
} from "@davinci/types";
import { chamarApi } from "./api";
import { valorEmReais } from "./valores";

export type EstadoDaAcao = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
  tarefas?: Record<string, string>[];
};

const BASE = "/qualidade/planos-de-acao";
const CONFIRA = "Verifique os campos destacados.";
const CAMPOS_DA_TAREFA = [
  "oQue",
  "responsavel",
  "prazo",
  "onde",
  "como",
] as const;

function textos(form: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [chave, valor] of form.entries())
    if (
      typeof valor === "string" &&
      chave !== "versao" &&
      !chave.startsWith("tarefa_")
    )
      valores[chave] = valor;
  return valores;
}

/** Linhas de tarefa do formulário (`tarefa_oQue`, `tarefa_prazo`… repetidos), sem as linhas totalmente vazias. */
function tarefasDoFormulario(form: FormData): Record<string, string>[] {
  const colunas = Object.fromEntries(
    CAMPOS_DA_TAREFA.map((c) => [c, form.getAll(`tarefa_${c}`).map(String)]),
  );
  const linhas = Math.max(...CAMPOS_DA_TAREFA.map((c) => colunas[c]!.length));
  return Array.from({ length: linhas }, (_, i) =>
    Object.fromEntries(CAMPOS_DA_TAREFA.map((c) => [c, colunas[c]![i] ?? ""])),
  ).filter((t) => CAMPOS_DA_TAREFA.some((c) => t[c]!.trim()));
}

async function enviar(
  schema: z.ZodType,
  dados: Record<string, unknown>,
  caminho: string,
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
  const r = await chamarApi<PlanoDeAcao>(caminho, {
    metodo: "POST",
    corpo: dados,
  });
  return r.ok ? { plano: r.dados } : { erro: r.erro, ...extra };
}

export async function criarPlano(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const tarefas = tarefasDoFormulario(form);
  const dados = {
    ...valores,
    custoPrevisto: valorEmReais(valores.custoPrevisto),
    tarefas,
  };
  const r = await enviar(novoPlanoSchema, dados, "/planos-de-acao", {
    valores,
    tarefas,
  });
  if ("erro" in r) return r;
  redirect(`${BASE}/${r.plano.id}?aviso=criado`);
}

export async function incluirTarefa(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const [tarefa = {}] = tarefasDoFormulario(form);
  const r = await enviar(
    incluirTarefaSchema,
    { versao: String(form.get("versao") ?? ""), tarefa },
    `/planos-de-acao/${id}/tarefas`,
    { tarefas: [tarefa] },
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=tarefa-incluida`);
}

/** Concluir, reabrir ou cancelar uma tarefa: o botão da linha manda qual. */
export async function mudarTarefa(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const acao = String(form.get("acao") ?? "");
  const base = {
    versao: String(form.get("versao") ?? ""),
    tarefaId: String(form.get("tarefaId") ?? ""),
  };
  const r =
    acao === "concluir"
      ? await enviar(
          concluirTarefaSchema,
          base,
          `/planos-de-acao/${id}/tarefas/concluir`,
        )
      : acao === "reabrir"
        ? await enviar(
            reabrirTarefaSchema,
            base,
            `/planos-de-acao/${id}/tarefas/reabrir`,
          )
        : await enviar(
            cancelarTarefaSchema,
            { ...base, motivo: String(form.get("motivo") ?? "") },
            `/planos-de-acao/${id}/tarefas/cancelar`,
          );
  if ("erro" in r) return r;
  redirect(
    `${BASE}/${id}${r.plano.status === "aguardando_eficacia" ? "?aviso=tudo-concluido" : ""}`,
  );
}

export async function verificarEficaciaDoPlano(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const resposta = form.get("eficaz");
  const dados = {
    eficaz: resposta === "sim" ? true : resposta === "nao" ? false : undefined,
    parecer: valores.parecer,
    versao: String(form.get("versao") ?? ""),
  };
  const r = await enviar(
    verificarEficaciaPlanoSchema,
    dados,
    `/planos-de-acao/${id}/verificar-eficacia`,
    { valores },
  );
  if ("erro" in r) return r;
  redirect(
    `${BASE}/${id}?aviso=${r.plano.status === "encerrado" ? "encerrado" : "ineficaz"}`,
  );
}

export async function cancelarPlano(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await enviar(
    cancelarPlanoSchema,
    { motivo: valores.motivo, versao: String(form.get("versao") ?? "") },
    `/planos-de-acao/${id}/cancelar`,
    { valores },
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=cancelado`);
}
