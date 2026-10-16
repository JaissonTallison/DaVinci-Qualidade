"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import {
  atualizarAuditoriaSchema,
  cancelarAuditoriaSchema,
  concluirAuditoriaSchema,
  detalhesDaValidacao,
  formalizarNcSchema,
  iniciarAuditoriaSchema,
  marcarItemDoKitSchema,
  novaPerguntaPropriaSchema,
  novaEvidenciaPropriaSchema,
  novoCriterioSchema,
  novoModeloNcSchema,
  responderPerguntaSchema,
  selecionarPerguntasSchema,
  type StatusDoItemDoKit,
  novaAuditoriaSchema,
  planoDaAuditoriaSchema,
  type PlanoDaAuditoria,
  registrarConstatacaoSchema,
  type Auditoria,
  type ErroPadrao,
} from "@davinci/types";
import { chamarApi } from "./api";
import { COLUNAS_DA_PLANILHA } from "./planilha-da-biblioteca";

export type EstadoDaAcao = {
  erro?: ErroPadrao;
  valores?: Record<string, string>;
  normas?: string[];
};

const BASE = "/auditorias";
const CONFIRA = "Verifique os campos destacados.";

function textos(form: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [chave, valor] of form.entries())
    if (typeof valor === "string" && chave !== "versao" && chave !== "normas")
      valores[chave] = valor;
  return valores;
}
const versaoDe = (form: FormData) => String(form.get("versao") ?? "");
/** Tela da jornada para onde voltar depois da ação (só dentro da própria auditoria). */
function voltarPara(id: string, form: FormData, padrao: string): string {
  const v = String(form.get("voltar") ?? "");
  return v.startsWith(`${BASE}/${id}/`) ? v : padrao;
}

async function chamar(
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
  const r = await chamarApi<Auditoria>(caminho, { metodo, corpo: dados });
  return r.ok ? { auditoria: r.dados } : { erro: r.erro, ...extra };
}

export async function salvarAuditoria(
  id: string | null,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const normas = form.getAll("normas").map(String);
  const dados = {
    ...valores,
    normas,
    ...(id ? { versao: versaoDe(form) } : {}),
  };
  const r = id
    ? await chamar(
        atualizarAuditoriaSchema,
        dados,
        `/auditorias/${id}`,
        "PUT",
        { valores, normas },
      )
    : await chamar(novaAuditoriaSchema, dados, "/auditorias", "POST", {
        valores,
        normas,
      });
  if ("erro" in r) return r;
  redirect(`${BASE}/${r.auditoria.id}?aviso=${id ? "salva" : "planejada"}`);
}

export async function iniciarAuditoria(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const r = await chamar(
    iniciarAuditoriaSchema,
    { versao: versaoDe(form) },
    `/auditorias/${id}/iniciar`,
    "POST",
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=iniciada`);
}

export async function registrarConstatacao(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  delete valores.voltar;
  const r = await chamar(
    registrarConstatacaoSchema,
    { versao: versaoDe(form), constatacao: valores },
    `/auditorias/${id}/constatacoes`,
    "POST",
    { valores },
  );
  if ("erro" in r) return r;
  redirect(
    voltarPara(id, form, `${BASE}/${id}?aviso=constatacao#constatacoes`),
  );
}

export async function formalizarNc(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const dados = {
    versao: versaoDe(form),
    constatacaoId: valores.constatacaoId,
    responsavel: valores.responsavel,
    prazo: valores.prazo || undefined,
  };
  const r = await chamar(
    formalizarNcSchema,
    dados,
    `/auditorias/${id}/constatacoes/formalizar-nc`,
    "POST",
    { valores },
  );
  if ("erro" in r) return r;
  const numero =
    r.auditoria.constatacoes.find((c) => c.id === valores.constatacaoId)
      ?.ncNumero ?? "";
  const destino = voltarPara(id, form, `${BASE}/${id}#constatacoes`);
  const [caminho, ancora = ""] = destino.split("#");
  redirect(
    `${caminho}${caminho.includes("?") ? "&" : "?"}aviso=nc&nc=${encodeURIComponent(numero)}${ancora ? `#${ancora}` : ""}`,
  );
}

export async function concluirAuditoria(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    concluirAuditoriaSchema,
    { versao: versaoDe(form), conclusao: valores.conclusao },
    `/auditorias/${id}/concluir`,
    "POST",
    { valores },
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=concluida`);
}

export async function cancelarAuditoria(
  id: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = textos(form);
  const r = await chamar(
    cancelarAuditoriaSchema,
    { versao: versaoDe(form), motivo: valores.motivo },
    `/auditorias/${id}/cancelar`,
    "POST",
    { valores },
  );
  if ("erro" in r) return r;
  redirect(`${BASE}/${id}?aviso=cancelada`);
}

/** Status de um item do kit pré-auditoria. Devolve a mensagem de erro, ou null quando gravou. */
export async function marcarItemDoKit(
  auditoriaId: string,
  codigo: string,
  status: StatusDoItemDoKit,
): Promise<string | null> {
  const dados = { codigo, status };
  if (!marcarItemDoKitSchema.safeParse(dados).success)
    return "Status inválido.";
  const r = await chamarApi(`/auditorias/${auditoriaId}/kit`, {
    metodo: "POST",
    corpo: dados,
  });
  if (!r.ok) return r.erro.mensagem;
  revalidatePath(`/auditorias/${auditoriaId}/kit`);
  return null;
}

/** Inclui ou retira perguntas do roteiro da auditoria. */
export async function selecionarPerguntas(
  auditoriaId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const dados = {
    incluir: form.getAll("incluir").map(String),
    retirar: form.getAll("retirar").map(String),
  };
  const v = selecionarPerguntasSchema.safeParse(dados);
  if (!v.success || (!dados.incluir.length && !dados.retirar.length))
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: "Marque ao menos uma pergunta.",
      } as ErroPadrao,
    };
  const r = await chamarApi(`/auditorias/${auditoriaId}/roteiro`, {
    metodo: "POST",
    corpo: dados,
  });
  if (!r.ok) return { erro: r.erro };
  revalidatePath(`/auditorias/${auditoriaId}/roteiro`);
  return {};
}

/** Pergunta própria da empresa (vale para as próximas auditorias). */
export async function criarPerguntaPropria(
  auditoriaId: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores: Record<string, string> = {};
  for (const [k, v] of form.entries())
    if (typeof v === "string") valores[k] = v;
  const v = novaPerguntaPropriaSchema.safeParse(valores);
  if (!v.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: "Verifique os campos destacados.",
        detalhes: detalhesDaValidacao(v.error.issues),
      } as ErroPadrao,
      valores,
    };
  const r = await chamarApi("/perguntas-de-auditoria", {
    metodo: "POST",
    corpo: valores,
  });
  if (!r.ok) return { erro: r.erro, valores };
  redirect(
    `/auditorias/${auditoriaId}/roteiro?aviso=pergunta&processo=${valores.processo}`,
  );
}

/** Resposta de uma pergunta na execução (Conforme, Parcial, Não conforme) com a evidência verificada. */
export async function responderPergunta(
  auditoriaId: string,
  codigo: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores = {
    resposta: String(form.get("resposta") ?? ""),
    evidencia: String(form.get("evidencia") ?? ""),
  };
  const dados = { codigo, ...valores };
  const v = responderPerguntaSchema.safeParse(dados);
  if (!v.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: "Verifique os campos destacados.",
        detalhes: detalhesDaValidacao(v.error.issues),
      } as ErroPadrao,
      valores,
    };
  const r = await chamarApi(`/auditorias/${auditoriaId}/roteiro/resposta`, {
    metodo: "POST",
    corpo: dados,
  });
  if (!r.ok) return { erro: r.erro, valores };
  revalidatePath(`/auditorias/${auditoriaId}/execucao`);
  return {};
}

/** Evidência própria da empresa na biblioteca. */
export async function criarEvidenciaPropria(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores: Record<string, string> = {};
  for (const [k, v] of form.entries())
    if (typeof v === "string") valores[k] = v;
  const v = novaEvidenciaPropriaSchema.safeParse(valores);
  if (!v.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: "Verifique os campos destacados.",
        detalhes: detalhesDaValidacao(v.error.issues),
      } as ErroPadrao,
      valores,
    };
  const r = await chamarApi("/evidencias-de-auditoria", {
    metodo: "POST",
    corpo: valores,
  });
  if (!r.ok) return { erro: r.erro, valores };
  redirect(`/auditorias/biblioteca?aviso=evidencia&norma=${valores.norma}`);
}

const CAMPOS_DO_PLANO = [
  "empresaAuditada",
  "unidade",
  "objetivo",
  "metodologia",
  "pontosFortes",
  "criterios",
  "emissor",
  "papel",
] as const;

/** Linhas repetidas do formulário (`grupo.0.campo`); as que ficaram em branco saem. */
function linhas<T extends string>(
  form: FormData,
  grupo: string,
  campos: readonly T[],
): Record<T, string>[] {
  const n = Number(form.get(`${grupo}-linhas`) ?? 0);
  const saida: Record<T, string>[] = [];
  for (let i = 0; i < n; i++) {
    const l = Object.fromEntries(
      campos.map((c) => [
        c,
        String(form.get(`${grupo}.${i}.${c}`) ?? "").trim(),
      ]),
    ) as Record<T, string>;
    if (campos.some((c) => l[c])) saida.push(l);
  }
  return saida;
}

/**
 * Plano e dados do relatório. Cada tela manda só a parte que edita; o resto vem do plano atual, porque o serviço
 * grava o plano inteiro.
 */
export async function salvarPlanoDaAuditoria(
  id: string,
  atual: PlanoDaAuditoria,
  voltar: string,
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores: Record<string, string> = {};
  for (const [k, v] of form.entries())
    if (typeof v === "string" && k !== "versao") valores[k] = v;
  const texto = (k: (typeof CAMPOS_DO_PLANO)[number]) =>
    form.has(k) ? String(form.get(k)) : (atual[k] ?? "");
  const dados = {
    versao: versaoDe(form),
    ...Object.fromEntries(CAMPOS_DO_PLANO.map((k) => [k, texto(k)])),
    horas: form.has("horas") ? String(form.get("horas")) : (atual.horas ?? ""),
    processos: form.has("processos-enviados")
      ? form.getAll("processos").map(String)
      : atual.processos,
    cronograma: form.has("cronograma-linhas")
      ? linhas(form, "cronograma", [
          "horaInicio",
          "horaFim",
          "processo",
          "auditado",
          "local",
        ] as const)
      : atual.cronograma,
    auditados: form.has("auditados-linhas")
      ? linhas(form, "auditados", ["nome", "funcao", "processo"] as const)
      : atual.auditados,
    logistica: form.has("logistica.sala")
      ? {
          sala: String(form.get("logistica.sala") ?? ""),
          epi: String(form.get("logistica.epi") ?? ""),
          acompanhante: String(form.get("logistica.acompanhante") ?? ""),
          observacoes: String(form.get("logistica.observacoes") ?? ""),
        }
      : atual.logistica,
  };
  const v = planoDaAuditoriaSchema.safeParse(dados);
  if (!v.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: CONFIRA,
        detalhes: detalhesDaValidacao(v.error.issues),
      } as ErroPadrao,
      valores,
    };
  const r = await chamarApi<Auditoria>(`/auditorias/${id}/plano`, {
    metodo: "PUT",
    corpo: dados,
  });
  if (!r.ok) return { erro: r.erro, valores };
  revalidatePath(`${BASE}/${id}`, "layout");
  redirect(voltar.startsWith(`${BASE}/${id}/`) ? voltar : `${BASE}/${id}`);
}

const MINHA = "/auditorias/minha-biblioteca";

/** Cadastro simples da Minha biblioteca: valida, grava e volta com o aviso. */
async function criarNaBiblioteca(
  schema: z.ZodType,
  caminho: string,
  aviso: string,
  form: FormData,
): Promise<EstadoDaAcao> {
  const valores: Record<string, string> = {};
  for (const [k, v] of form.entries())
    if (typeof v === "string") valores[k] = v;
  const v = schema.safeParse(valores);
  if (!v.success)
    return {
      erro: {
        codigo: "DADOS_INVALIDOS",
        mensagem: CONFIRA,
        detalhes: detalhesDaValidacao(v.error.issues),
      } as ErroPadrao,
      valores,
    };
  const r = await chamarApi(caminho, { metodo: "POST", corpo: valores });
  if (!r.ok) return { erro: r.erro, valores };
  redirect(`${MINHA}?aviso=${aviso}`);
}

export async function criarModeloNcProprio(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  return criarNaBiblioteca(
    novoModeloNcSchema,
    "/modelos-de-nc",
    "modelo",
    form,
  );
}

export async function criarCriterioProprio(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  return criarNaBiblioteca(
    novoCriterioSchema,
    "/criterios-de-auditoria",
    "criterio",
    form,
  );
}

const RECURSOS_PROPRIOS = {
  pergunta: "/perguntas-de-auditoria",
  evidencia: "/evidencias-de-auditoria",
  modelo: "/modelos-de-nc",
  criterio: "/criterios-de-auditoria",
} as const;
export type ItemProprio = keyof typeof RECURSOS_PROPRIOS;

/** Exclui um item próprio da Minha biblioteca. Devolve a mensagem de erro, ou null quando excluiu. */
export async function excluirItemProprio(
  tipo: ItemProprio,
  id: string,
): Promise<string | null> {
  if (!(tipo in RECURSOS_PROPRIOS)) return "Item desconhecido.";
  const r = await chamarApi(
    `${RECURSOS_PROPRIOS[tipo]}/${encodeURIComponent(id)}`,
    { metodo: "DELETE" },
  );
  if (!r.ok) return r.erro.mensagem;
  revalidatePath(MINHA);
  return null;
}

type Planilha = keyof typeof COLUNAS_DA_PLANILHA;
const SCHEMAS_DA_PLANILHA = {
  pergunta: novaPerguntaPropriaSchema,
  evidencia: novaEvidenciaPropriaSchema,
  modelo: novoModeloNcSchema,
};

/** Uma linha de CSV com aspas ("a; b" vira um campo só). */
function campos(linha: string, sep: string): string[] {
  const saida: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"' && aspas && linha[i + 1] === '"') {
      atual += '"';
      i++;
    } else if (c === '"') aspas = !aspas;
    else if (c === sep && !aspas) {
      saida.push(atual.trim());
      atual = "";
    } else atual += c;
  }
  saida.push(atual.trim());
  return saida;
}

/**
 * Importação por planilha (CSV com cabeçalho, separado por ; ou ,). Valida tudo antes de gravar: com uma linha
 * errada, nada entra e a mensagem diz qual linha e qual campo corrigir.
 */
export async function importarPlanilha(
  _: EstadoDaAcao,
  form: FormData,
): Promise<EstadoDaAcao> {
  const tipo = String(form.get("tipo") ?? "") as Planilha;
  const arquivo = form.get("arquivo");
  const texto =
    arquivo instanceof File && arquivo.size > 0
      ? await arquivo.text()
      : String(form.get("conteudo") ?? "");
  const falha = (mensagem: string): EstadoDaAcao => ({
    erro: { codigo: "DADOS_INVALIDOS", mensagem } as ErroPadrao,
    valores: { tipo },
  });
  if (!(tipo in COLUNAS_DA_PLANILHA)) return falha("Escolha o que importar.");
  const linhas = texto
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (linhas.length < 2)
    return falha("A planilha precisa do cabeçalho e de ao menos uma linha.");
  if (linhas.length > 501)
    return falha("Importe no máximo 500 linhas por vez.");
  const sep =
    linhas[0].split(";").length > linhas[0].split(",").length ? ";" : ",";
  const cabecalho = campos(linhas[0], sep);
  const faltam = COLUNAS_DA_PLANILHA[tipo].filter(
    (c) => c !== "objetivo" && !cabecalho.includes(c),
  );
  if (faltam.length)
    return falha(`Faltam colunas no cabeçalho: ${faltam.join(", ")}.`);
  const registros: Record<string, string>[] = [];
  for (let i = 1; i < linhas.length; i++) {
    const valores = campos(linhas[i], sep);
    const r = Object.fromEntries(
      cabecalho.map((c, j) => [c, valores[j] ?? ""]),
    );
    const v = SCHEMAS_DA_PLANILHA[tipo].safeParse(r);
    if (!v.success) {
      const d = detalhesDaValidacao(v.error.issues)[0];
      return falha(
        `Linha ${i + 1}, coluna ${d?.campo ?? "?"}: ${d?.mensagem ?? "valor inválido"}`,
      );
    }
    registros.push(r);
  }
  const destino = RECURSOS_PROPRIOS[tipo];
  for (let i = 0; i < registros.length; i++) {
    const r = await chamarApi(destino, { metodo: "POST", corpo: registros[i] });
    if (!r.ok)
      return falha(
        `Linha ${i + 2}: ${r.erro.mensagem} As ${i} linha(s) anteriores já foram importadas.`,
      );
  }
  redirect(`${MINHA}?aviso=importado&n=${registros.length}`);
}
